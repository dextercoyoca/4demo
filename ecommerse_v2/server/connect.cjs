const path = require("path");
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

require("dotenv").config({ path: path.join(__dirname, "config.env") });

// Validate required environment variables
const requiredEnvVars = ["ATLAS_URI", "NODE_ENV"];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ FATAL: Missing required environment variables: ${missingEnvVars.join(", ")}`);
  console.error(`📋 Check server/config.env or server/.env`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

// Security: Set CORS based on environment
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:*").split(",").map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, strictly validate origins
    if (IS_PRODUCTION) {
      if (corsOrigins.includes(origin) || corsOrigins.some(o => o.includes("*"))) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"));
    }
    
    // In development, allow localhost variants
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "ngrok-skip-browser-warning"],
  credentials: true,
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Body parser with size limit
app.use(express.json({ limit: "50mb" }));


const uri = process.env.ATLAS_URI;

if (!uri) {
  throw new Error("ATLAS_URI is missing. Check DEMO/ecommerse_v2/server/config.env.");
}

// Create MongoDB client with connection options
const mongoOptions = {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
};

let client;
try {
  client = new MongoClient(uri, mongoOptions);
} catch (clientErr) {
  console.error("Failed to create MongoClient:", clientErr.message);
  console.error("ATLAS_URI format:", uri?.substring(0, 60) + "...");
  process.exit(1);
}

let db;

const defaultUsageTips = [
  "Use LED bulbs to save up to 75% energy",
  "Set AC temperature to 24-26C",
  "Unplug devices when not in use",
  "Use appliances during off-peak hours",
];

function buildUserIdQuery(userId) {
  if (ObjectId.isValid(userId) && String(new ObjectId(userId)) === userId) {
    return { _id: new ObjectId(userId) };
  }

  return { _id: userId };
}

function createSeedData(user) {
  const displayName = user.name || user.username || "Customer";
  const accountNumber = user.accountNumber || `ACC-${String(user._id).padStart(4, "0")}`.slice(0, 15);

  return {
    usage: {
      weekly: [
        { day: "Mon", usage: 8.5, unit: "kWh" },
        { day: "Tue", usage: 9.2, unit: "kWh" },
        { day: "Wed", usage: 7.8, unit: "kWh" },
        { day: "Thu", usage: 10.1, unit: "kWh" },
        { day: "Fri", usage: 11.5, unit: "kWh" },
        { day: "Sat", usage: 13.2, unit: "kWh" },
        { day: "Sun", usage: 14.8, unit: "kWh" },
      ],
      monthly: [
        { month: "November", usage: 210, cost: 2100 },
        { month: "December", usage: 195, cost: 1950 },
        { month: "January", usage: 245, cost: 2205 },
        { month: "February", usage: 198, cost: 1782 },
        { month: "March (Current)", usage: 245, cost: 2450 },
      ],
      tips: defaultUsageTips,
    },
    payments: {
      currentBill: {
        amount: 2450,
        dueDate: "March 15, 2026",
        status: "Unpaid",
        accountNumber,
        qrData: `PAYMENT-${accountNumber}-${displayName.replace(/\s+/g, "-").toUpperCase()}`,
      },
      history: [
        { id: "pay-2026-02", date: "Feb 01, 2026", amount: 1782, status: "Completed", method: "GCash" },
        { id: "pay-2026-01", date: "Jan 05, 2026", amount: 2205, status: "Completed", method: "Maya" },
        { id: "pay-2025-12", date: "Dec 02, 2025", amount: 1950, status: "Completed", method: "Online Banking" },
      ],
      latestReceipt: null,
    },
  };
}

function normalizeUserProfile(user) {
  return {
    ...user,
    name: user.name || user.username || "",
    address: user.address || user.Address || "",
    contact: user.contact || user.contactNumber || "",
    avatar: user.avatar || user.profilePic || "https://www.pngmart.com/files/23/Profile-PNG-Photo.png",
  };
}

function buildUsageSummary(weekly) {
  const totalUsage = weekly.reduce((sum, item) => sum + Number(item.usage || 0), 0);
  const peakDay = weekly.reduce((max, item) => (item.usage > max.usage ? item : max), weekly[0]);
  const lowDay = weekly.reduce((min, item) => (item.usage < min.usage ? item : min), weekly[0]);

  return {
    totalUsage: Number(totalUsage.toFixed(1)),
    dailyAverage: Number((totalUsage / weekly.length).toFixed(1)),
    peakDay,
    lowDay,
  };
}

async function seedUsers() {
  try {
    if (!db) {
      console.warn("⚠️ Database not initialized, skipping user seeding");
      return;
    }

    const usersCollection = db.collection("users");
    const users = await usersCollection.find().toArray();

    if (users.length === 0) {
      console.log("📭 No users found in database");
      return;
    }

    console.log(`🌱 Seeding ${users.length} users with default data...`);

    for (const user of users) {
      const seedData = createSeedData(user);
      const updateData = {};

      if (!user.usage) updateData.usage = seedData.usage;
      if (!user.payments) updateData.payments = seedData.payments;
      if (!user.accountNumber) updateData.accountNumber = seedData.payments.currentBill.accountNumber;

      const normalizedFields = normalizeUserProfile(user);
      if (!user.name && normalizedFields.name) updateData.name = normalizedFields.name;
      if (!user.address && normalizedFields.address) updateData.address = normalizedFields.address;
      if (!user.contact && normalizedFields.contact) updateData.contact = normalizedFields.contact;
      if (!user.avatar && normalizedFields.avatar) updateData.avatar = normalizedFields.avatar;

      if (Object.keys(updateData).length > 0) {
        try {
          const userId = String(user._id || '');
          if (!userId) {
            console.warn("⚠️ Skipping user with invalid ID");
            continue;
          }
          await usersCollection.updateOne(buildUserIdQuery(userId), { $set: updateData });
        } catch (updateErr) {
          console.warn(`⚠️ Failed to update user: ${updateErr.message}`);
        }
      }
    }
    console.log("✅ User seeding complete");
  } catch (seedErr) {
    console.warn(`⚠️ Seeding warning: ${seedErr.message}`);
    // Non-fatal error, continue startup
  }
}

async function createAccountNumber() {
  const totalUsers = await db.collection("users").countDocuments();
  return `ACC-${String(totalUsers + 1).padStart(4, "0")}`;
}

async function createUserDocument(payload) {
  const accountNumber = await createAccountNumber();
  const baseUser = {
    _id: `USR${Date.now()}`,
    username: payload.username.trim(),
    password: payload.password,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    contact: payload.contact.trim(),
    address: payload.address.trim(),
    avatar: "https://www.pngmart.com/files/23/Profile-PNG-Photo.png",
    accountNumber,
  };

  const seedData = createSeedData(baseUser);

  return {
    ...baseUser,
    usage: seedData.usage,
    payments: {
      ...seedData.payments,
      currentBill: {
        ...seedData.payments.currentBill,
        accountNumber,
        qrData: `PAYMENT-${accountNumber}-${baseUser.name.replace(/\s+/g, "-").toUpperCase()}`,
      },
    },
  };
}

async function connectDB() {
  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      console.log(`Attempting MongoDB connection (${4 - retries}/3)...`);
      console.log(`URI: ${process.env.ATLAS_URI?.substring(0, 50)}...`);
      
      await client.connect();
      console.log("✅ Connected to MongoDB cluster");
      
      db = client.db("database_electripay");
      
      // Test connection with admin command
      try {
        const adminDb = client.db("admin");
        await adminDb.command({ ping: 1 });
        console.log("✅ MongoDB ping successful");
      } catch (pingErr) {
        console.warn("⚠️ Ping check warning:", pingErr.message);
      }
      
      // Seed users
      console.log("📊 Seeding users...");
      await seedUsers();
      console.log("✅ MongoDB connected successfully");
      
      return; // Success
    } catch (err) {
      lastError = err;
      retries--;
      console.error(`❌ Connection attempt failed: ${err.message}`);
      console.error(`Stack: ${err.stack?.substring(0, 200)}`);
      
      if (retries > 0) {
        console.log(`⏳ Retrying in 3 seconds... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  // Final failure
  console.error("\n❌ MongoDB connection failed after 3 attempts");
  console.error("Error:", lastError?.message);
  console.error("\nTroubleshooting tips:");
  console.error("1. ✅ Check ATLAS_URI in server/config.env - should start with mongodb+srv://");
  console.error("2. ✅ Verify username and password in the URI are correct");
  console.error("3. ✅ Go to MongoDB Atlas and whitelist your IP: https://cloud.mongodb.com/v2/atlas");
  console.error("4. ✅ Check your internet connection");
  console.error("5. ✅ Try again in a few moments (sometimes Atlas needs time to activate)");
}

connectDB();

// Railway health checks should prove the HTTP server is alive, even while MongoDB is still connecting.
app.get("/health", (req, res) => {
  res.json({ ok: true, dbConnected: Boolean(db), environment: NODE_ENV });
});

app.get("/ready", (req, res) => {
  if (!db) {
    return res.status(503).json({ ok: false, dbConnected: false });
  }

  res.json({ ok: true, dbConnected: true, environment: NODE_ENV });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === "CORS policy violation") {
    return res.status(403).json({ error: "CORS policy violation: Origin not allowed" });
  }
  
  console.error("❌ Server error:", err.message);
  res.status(500).json({ 
    error: IS_PRODUCTION ? "Internal server error" : err.message 
  });
});

// Middleware: Check database connection
app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({ error: "Database connection is not ready yet" });
  }
  next();
});

// Input validation helpers
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  return username && username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
};

const sanitizeInput = (str) => {
  if (typeof str !== "string") return "";
  return str.trim().substring(0, 500);
};

app.post("/signup", async (req, res) => {
  try {
    const { username, password, name, email, contact, address } = req.body;

    // Input validation
    if (!username || !password || !name || !email || !contact || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Sanitize and validate inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedContact = sanitizeInput(contact);
    const sanitizedAddress = sanitizeInput(address);

    // Validate username
    if (!validateUsername(sanitizedUsername)) {
      return res.status(400).json({ message: "Username must be 3+ characters (alphanumeric, dash, underscore)" });
    }

    // Validate password
    if (!validatePassword(sanitizedPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Validate email
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check for duplicate username or email
    const existingUser = await db.collection("users").findOne({
      $or: [{ username: sanitizedUsername }, { email: sanitizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username or email already exists" });
    }

    const newUser = await createUserDocument({ 
      username: sanitizedUsername, 
      password: sanitizedPassword, 
      name: sanitizedName, 
      email: sanitizedEmail, 
      contact: sanitizedContact, 
      address: sanitizedAddress 
    });
    await db.collection("users").insertOne(newUser);

    res.status(201).json({
      message: "Account created successfully",
      user: normalizeUserProfile(newUser),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);

    const user = await db.collection("users").findOne({ 
      username: sanitizedUsername, 
      password: sanitizedPassword 
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user: normalizeUserProfile(user) });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: IS_PRODUCTION ? "Login failed" : err.message });
  }
});

app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { username, email, contact, newPassword } = req.body;

    // Input validation
    if (!username || !email || !contact || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedContact = sanitizeInput(contact).replace(/\D/g, "");
    const sanitizedPassword = sanitizeInput(newPassword);

    const user = await db.collection("users").findOne({
      username: { $regex: new RegExp(`^${sanitizedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      email: sanitizedEmail,
    });

    if (!user) {
      return res.status(404).json({ message: "Account details did not match any user" });
    }

    const storedContact = String(user.contact || user.contactNumber || "").replace(/\D/g, "");
    if (!storedContact || storedContact !== sanitizedContact) {
      return res.status(404).json({ message: "Account details did not match any user" });
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { password: sanitizedPassword } }
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ error: IS_PRODUCTION ? "Password reset failed" : err.message });
  }
});

app.post("/users/:id/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const sanitizedCurrent = sanitizeInput(currentPassword);
    const sanitizedNew = sanitizeInput(newPassword);

    const user = await db.collection("users").findOne(buildUserIdQuery(req.params.id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password !== sanitizedCurrent) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    await db.collection("users").updateOne(
      buildUserIdQuery(req.params.id),
      { $set: { password: sanitizedNew } }
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ error: IS_PRODUCTION ? "Password change failed" : err.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await db.collection("users").find().toArray();
    res.json(users.map(normalizeUserProfile));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/stats/summary", async (req, res) => {
  try {
    const totalUsers = await db.collection("users").countDocuments();
    const pendingPayments = await db.collection("users").countDocuments({
      "payments.currentBill.status": "Pending Verification",
    });

    res.json({ totalUsers, pendingPayments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await db.collection("users").findOne(buildUserIdQuery(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(normalizeUserProfile(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    // Sanitize all input fields
    const sanitizedData = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === "string") {
        sanitizedData[key] = sanitizeInput(value);
      } else {
        sanitizedData[key] = value;
      }
    }

    const result = await db.collection("users").updateOne(
      buildUserIdQuery(req.params.id),
      { $set: sanitizedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update user error:", err.message);
    res.status(500).json({ error: IS_PRODUCTION ? "Update failed" : err.message });
  }
});

app.get("/users/:id/usage", async (req, res) => {
  try {
    const user = await db.collection("users").findOne(buildUserIdQuery(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });

    const usage = user.usage || createSeedData(user).usage;
    res.json({
      weekly: usage.weekly,
      monthly: usage.monthly,
      tips: usage.tips || defaultUsageTips,
      summary: buildUsageSummary(usage.weekly),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users/:id/payments", async (req, res) => {
  try {
    const user = await db.collection("users").findOne(buildUserIdQuery(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });

    const payments = user.payments || createSeedData(user).payments;
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users/:id/payments/receipt", async (req, res) => {
  try {
    const { receiptUri } = req.body;
    
    if (!receiptUri) {
      return res.status(400).json({ message: "receiptUri is required" });
    }

    const sanitizedUri = sanitizeInput(receiptUri);

    const user = await db.collection("users").findOne(buildUserIdQuery(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });

    const payments = user.payments || createSeedData(user).payments;
    const pendingPayment = {
      id: `pay-${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      amount: payments.currentBill.amount,
      status: "Pending Verification",
      method: "Receipt Upload",
      receiptUri: sanitizedUri,
    };

    const updatedPayments = {
      ...payments,
      latestReceipt: sanitizedUri,
      currentBill: {
        ...payments.currentBill,
        status: "Pending Verification",
      },
      history: [pendingPayment, ...(payments.history || [])],
    };

    await db.collection("users").updateOne(
      buildUserIdQuery(req.params.id),
      { $set: { payments: updatedPayments } }
    );

    res.json({ message: "Receipt submitted successfully", payments: updatedPayments });
  } catch (err) {
    console.error("Receipt upload error:", err.message);
    res.status(500).json({ error: IS_PRODUCTION ? "Receipt upload failed" : err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

async function startServer() {
  const server = app.listen(PORT, "0.0.0.0", async () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Local access: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${NODE_ENV}\n`);

    // ngrok tunnel disabled for local development
    // Uncomment if needed for remote access:
    // await startNgrokTunnel();
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("\n📛 SIGTERM received, shutting down gracefully...");
    server.close(() => {
      console.log("✅ Server closed");
      if (client) client.close();
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("\n📛 SIGINT received, shutting down gracefully...");
    server.close(() => {
      console.log("✅ Server closed");
      if (client) client.close();
      process.exit(0);
    });
  });
}

startServer();

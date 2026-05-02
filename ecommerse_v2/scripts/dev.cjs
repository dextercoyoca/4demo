const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const expoCliPath = path.join(rootDir, "node_modules", "expo", "bin", "cli");
const expoArgs = ["start", ...process.argv.slice(2)];

let shuttingDown = false;
const children = [];

function spawnProcess(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
    ...options,
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.log(`[${name}] stopped with signal ${signal}`);
    } else if (code !== 0) {
      console.log(`[${name}] exited with code ${code}`);
    } else {
      console.log(`[${name}] exited`);
    }

    shutdown(code ?? 0);
  });

  children.push(child);
  return child;
}

function killChild(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      shell: false,
    });
    return;
  }

  child.kill("SIGTERM");
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    killChild(child);
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("Starting API server and Expo app together...");
console.log("MongoDB will connect automatically when the server boots.\n");

spawnProcess("server", process.execPath, ["server/connect.cjs"]);
spawnProcess("expo", process.execPath, [expoCliPath, ...expoArgs]);

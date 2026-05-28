# Electripay Web App

Electripay is a browser-based electricity billing portal for customers to view account details, monitor usage, manage bills, submit payment receipts, and contact support.

## Features

- Customer dashboard with profile, bill status, and account controls
- Usage monitoring with weekly and monthly consumption views
- QR-based payment flow with browser receipt upload
- Payment history and status refresh
- Maintenance contacts, emergency hotlines, and email reporting
- Responsive web layout for desktop, laptop, tablet, and narrow browser screens

## Project Structure

```text
ecommerse_v2/
├── App.js
├── index.js
├── package.json
├── server/
├── components/
│   ├── CompanyInfo.js
│   ├── Dashboard.js
│   ├── MaintenanceSection.js
│   ├── Navbar.js
│   ├── PaymentSection.js
│   └── UsageSection.js
└── assets/
```

## Setup

### Development

```bash
npm install

# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend app
npm start
```

The frontend runs at `http://localhost:3000` (or next available port). The backend defaults to `http://localhost:5000`.

### Production

```bash
# Set NODE_ENV=production in server/config.env
npm run server:prod
```

## Fixing "NOT_FOUND 404" Errors on Vercel

### The Problem

When you deploy to **Vercel**, you get 404 errors because:

1. **Frontend deploys to Vercel** → `https://electripay.vercel.app`
2. **Backend has nowhere to run** → Vercel is a frontend-only platform
3. **Frontend tries `localhost:5000`** → Doesn't exist on Vercel → **404 error**

### The Solution: Two-Tier Deployment Architecture

```
┌─────────────────────┐
│ VERCEL              │
│ (Frontend Only)     │
│ React/Expo Web App  │
└──────────┬──────────┘
           │ HTTP requests
           │ (EXPO_PUBLIC_API_URL)
           ▼
┌─────────────────────┐
│ BACKEND SERVICE     │
│ Express API         │
│ (Heroku/Railway)    │
└─────────────────────┘
```

### Step-by-Step Deployment

#### 1. Deploy Backend First

You can host the Express backend on any Node.js platform. Popular options:

**Option A: Heroku (Free tier ended, but affordable)**

```bash
# Create Heroku app and deploy
heroku create electripay-api
git push heroku main
# Get URL: https://electripay-api.herokuapp.com
```

**Option B: Railway.app (Recommended - easier)**

```bash
# Deploy via Railway dashboard or CLI
# Get URL: https://electripay-api-prod.up.railway.app
```

**Option C: Replit (Quick testing)**

```bash
# Deploy Express server and share public URL
```

#### 2. Deploy Frontend to Vercel

```bash
# Set environment variable BEFORE deploying
EXPO_PUBLIC_API_URL=https://electripay-api-prod.up.railway.app
npm run build

# Deploy to Vercel (via dashboard or CLI)
vercel deploy --prod
```

#### 3. Configure Environment Variables on Vercel

In your **Vercel Project Settings** → **Environment Variables**, add:

```
EXPO_PUBLIC_API_URL = https://your-backend-api-url.herokuapp.com
```

⚠️ **Make sure you use the correct backend URL** — this is what fixes the 404 error!

#### 4. Update Backend CORS Policy

In `server/config.env`, set:

```
CORS_ORIGIN=https://your-vercel-frontend-url.vercel.app
```

Then redeploy backend to apply changes.

### Troubleshooting NOT_FOUND 404

**Symptom**: App loads but API calls fail with 404

**Diagnosis**:

1. Open browser DevTools → Network tab
2. Look at failed API requests — where are they going?
3. Check the request URL:
   - `http://localhost:5000/...` → ❌ Wrong! (local only)
   - `https://your-api.herokuapp.com/...` → ✅ Correct!

**Fixes**:

- [ ] Is `EXPO_PUBLIC_API_URL` set in Vercel environment variables?
- [ ] Does the backend URL actually work? Test with `curl https://your-api.herokuapp.com/health`
- [ ] Is CORS enabled? Backend should have your Vercel URL in `CORS_ORIGIN`
- [ ] Did you rebuild and redeploy after changing env vars?

## Environment Configuration

1. **Copy `.env.example` to `.env.local` or `.env`**:

   ```bash
   cp .env.example .env.local
   ```

2. **Update required variables in `.env` or `server/config.env`**:
   - `ATLAS_URI`: MongoDB Atlas connection string
   - `NODE_ENV`: Set to `production` for deployment
   - `CORS_ORIGIN`: Comma-separated list of allowed domains
   - `PORT`: Server port (default: 5000)

3. **Never commit secrets**:
   - `.gitignore` excludes `config.env` and `.env*` files
   - Store secrets in environment variables on your deployment platform

## Deployment Checklist

- [x] Environment variables validated at startup
- [x] CORS policy restricted to whitelisted domains
- [x] Input validation and sanitization on all endpoints
- [x] Security headers enabled (X-Content-Type-Options, X-Frame-Options, etc.)
- [x] Error handling middleware implemented
- [x] Graceful shutdown on SIGTERM/SIGINT
- [x] Production build scripts configured

### Before Deploying to Production

1. **Set environment variables**:

   ```bash
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   ATLAS_URI=<your-mongodb-uri>
   ```

2. **Test production build locally**:

   ```bash
   npm run server:prod
   npm run build:prod
   ```

3. **Verify database connectivity**:
   - Test `GET /health` endpoint returns `{ ok: true, dbConnected: true }`

4. **Enable HTTPS** in production (use reverse proxy like nginx)

5. **Monitor logs** for errors after deployment

## Scripts

- `npm start` - Start the browser frontend
- `npm run web` - Start the browser frontend
- `npm run start:clear` - Start the browser frontend with cleared cache
- `npm run server` - Start the Express backend (development)
- `npm run server:prod` - Start the Express backend (production)
- `npm run build` - Build frontend for production
- `npm run build:prod` - Build frontend with NODE_ENV=production

## API Endpoints

### Authentication

- `POST /signup` - Create a new account
- `POST /login` - Login with credentials
- `POST /auth/forgot-password` - Reset password

### User Profile

- `GET /users` - Get all users
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `POST /users/:id/change-password` - Change password

### Usage & Payments

- `GET /users/:id/usage` - Get usage data
- `GET /users/:id/payments` - Get payment information
- `POST /users/:id/payments/receipt` - Submit payment receipt

### System

- `GET /health` - Health check endpoint
- `GET /stats/summary` - Get system statistics

## Stack

- React 19
- React Native Web rendering primitives
- Expo web bundling
- Express API
- MongoDB

## License

Copyright 2026 Electripay. All rights reserved.

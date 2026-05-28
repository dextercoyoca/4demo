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

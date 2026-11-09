const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const connectDB = require("./config/db");
const { isDbConnected } = require("./config/db");
const errorHandler = require("./middleware/error.middleware");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (isProduction) {
  const required = [
    "MONGODB_URI",
    "JWT_SECRET",
    "FRONTEND_URL",
    "AI_SERVICE_URL",
    "AI_SERVICE_API_KEY",
    "CRON_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (!allowedOrigins.length) {
    missing.push("FRONTEND_URL (must include at least one origin)");
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    missing.push("JWT_SECRET (must be at least 32 characters)");
  }
  if (process.env.FRONTEND_URL && /localhost|127\.0\.0\.1/i.test(process.env.FRONTEND_URL)) {
    missing.push("FRONTEND_URL (must use the deployed frontend origin)");
  }
  if (process.env.AI_SERVICE_URL && /localhost|127\.0\.0\.1/i.test(process.env.AI_SERVICE_URL)) {
    missing.push("AI_SERVICE_URL (must use the deployed AI service URL)");
  }
  if (missing.length) {
    throw new Error(`Production configuration is incomplete: ${missing.join(", ")}`);
  }
}

// Behind Render/nginx there is one proxy hop, so trust it for `req.ip`
// (audit logs) and `req.protocol`/`req.host` correctness.
app.set("trust proxy", 1);

// Connect to MongoDB (retries in the background, never crashes the server)
connectDB();

// Produce photos uploaded via POST /api/marketplace/upload land in `uploads/`
// (multer's relative destination, so it resolves against the process cwd).
// Create it on boot: a missing directory makes multer fail with ENOENT on the
// very first upload. Served from this origin so `<img src>` can use the
// absolute URL the upload route returns.
const uploadDir = path.join(process.cwd(), "uploads");
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  // Serverless runtimes (Vercel) mount a read-only filesystem: there is no
  // local `uploads/` to create because uploads go to Cloudinary instead.
  // Never let a missing directory take the whole app down at import time.
  console.warn(`uploads/ unavailable (${err.message}); local photo storage disabled.`);
}
app.use("/uploads", express.static(uploadDir));

// Middleware
/*
 * CORS: development (local dev servers hop between localhost ports) allows
 * any origin. Production only allows the deployed frontend origin(s) listed
 * in FRONTEND_URL — comma-separated if there are several (production +
 * preview deployments). Requests without an Origin header (curl, health
 * checks, server-to-server) are never subject to CORS and pass through.
 */
const corsOptions =
  isProduction
    ? {
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            // No CORS headers → the browser blocks it; skip the 500.
            callback(null, false);
          }
        },
      }
    : {};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/docs/swagger.json", (req, res) => res.json(swaggerSpec));

// Swagger API documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
const healthCheck = (req, res) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  const db = dbStates[mongoose.connection.readyState] || "unknown";
  const ready = isDbConnected();
  res.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "not_ready",
    ready,
    db,
    timestamp: new Date().toISOString(),
  });
};
app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

// Routes
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/farmer", require("./modules/farmer/farmer.routes"));
app.use("/api/farms", require("./modules/farms/farms.routes"));
app.use("/api/fields", require("./modules/fields/fields.routes"));
app.use("/api/crop-batches", require("./modules/crop-batches/crop-batches.routes"));
app.use("/api/crop-logs", require("./modules/crop-logs/crop-logs.routes"));
app.use("/api/calendar", require("./modules/calendar/calendar.routes"));
app.use("/api/harvests", require("./modules/harvests/harvests.routes"));
app.use("/api/expenses", require("./modules/expenses/expenses.routes"));
app.use("/api/notifications", require("./modules/notifications/notifications.routes"));
app.use("/api/training", require("./modules/training/training.routes"));
app.use("/api/admin", require("./modules/admin/admin.routes"));
app.use("/api/marketplace", require("./modules/marketplace/marketplace.routes"));
// The demand board's reads are public (`/marketplace/demands` has no
// RouteGuard); optionalAuth attaches a caller when a token is present so
// `?mine=1` can still resolve, and never rejects. Writes re-check via `auth`.
app.use(
  "/api/demands",
  require("./middleware/optionalAuth.middleware"),
  require("./modules/demands/demands.routes")
);
app.use("/api/orders", require("./modules/orders/orders.routes"));
app.use("/api/payments", require("./modules/payments/payments.routes"));
app.use("/api/wallet", require("./modules/wallet/wallet.routes"));
app.use("/api/deliveries", require("./modules/deliveries/deliveries.routes"));
app.use("/api/products", require("./modules/products/products.routes"));
app.use("/api/quality", require("./modules/quality/quality.routes"));
app.use("/api/user", require("./modules/user/user.routes"));

// Error handling middleware
app.use(errorHandler);

module.exports = app;

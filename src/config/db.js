const mongoose = require("mongoose");

/**
 * MongoDB connection with exponential-backoff retries.
 *
 * Logging is intentionally silent: request-path code must not write to
 * stdout (hosting platforms stream it into browser-visible dashboards and
 * it is noise in serverless logs). Connection state is exposed through
 * `isDbConnected()`, which `/health` reports to clients instead.
 */

const MAX_RETRY_DELAY_MS = 15000;
const BASE_RETRY_DELAY_MS = 2000;

let retryTimer = null;
let attempt = 0;

const getRetryDelay = () =>
  Math.min(BASE_RETRY_DELAY_MS * 2 ** Math.min(attempt, 4), MAX_RETRY_DELAY_MS);

const scheduleRetry = () => {
  if (retryTimer) return;
  const delay = getRetryDelay();
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectDB();
  }, delay);
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    scheduleRetry();
    return null;
  }

  try {
    attempt += 1;
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    attempt = 0;
    return conn;
  } catch {
    scheduleRetry();
    return null;
  }
};

mongoose.connection.on("disconnected", () => {
  scheduleRetry();
});

mongoose.connection.on("reconnected", () => {
  attempt = 0;
});

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;

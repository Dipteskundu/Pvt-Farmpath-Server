const mongoose = require("mongoose");

const MAX_RETRY_DELAY_MS = 15000;
const BASE_RETRY_DELAY_MS = 2000;

let retryTimer = null;
let attempt = 0;

const getRetryDelay = () =>
  Math.min(BASE_RETRY_DELAY_MS * 2 ** Math.min(attempt, 4), MAX_RETRY_DELAY_MS);

const scheduleRetry = () => {
  if (retryTimer) return;
  const delay = getRetryDelay();
  console.warn(
    `MongoDB connection lost/failed. Retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1})...`
  );
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connectDB();
  }, delay);
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not set. Check the .env file in FarmPath-Server.");
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
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    scheduleRetry();
    return null;
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
  scheduleRetry();
});

mongoose.connection.on("reconnected", () => {
  attempt = 0;
  console.log("MongoDB reconnected.");
});

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;

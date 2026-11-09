require("dotenv").config();
const app = require("./app");
const { startEscrowSweeper } = require("./modules/orders/escrow.service");

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Hourly escrow auto-release. Registered after `listen` so a sweep can never
// race the DB connection into an unhandled rejection during boot; `unref`ed
// inside so it never keeps the process alive on shutdown.
if (process.env.DISABLE_ESCROW_SWEEP !== "1") startEscrowSweeper();

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or set a different PORT in .env`
    );
    process.exit(1);
  }
  console.error(`Server error: ${err.message}`);
  process.exit(1);
});

const shutdown = () => {
  console.log("\nShutting down server...");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

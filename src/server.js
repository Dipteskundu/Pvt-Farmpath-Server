require("dotenv").config();
const app = require("./app");
const { startEscrowSweeper } = require("./modules/orders/escrow.service");

/**
 * Server entrypoint. Silent by design: nothing in the request path or boot
 * sequence writes to stdout. Health/connection state is served at
 * `/api/health`, and failures are reported through structured HTTP errors.
 */

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT);

// Hourly escrow auto-release. Registered after `listen` so a sweep can never
// race the DB connection into an unhandled rejection during boot; `unref`ed
// inside so it never keeps the process alive on shutdown.
if (process.env.DISABLE_ESCROW_SWEEP !== "1") startEscrowSweeper();

server.on("error", (err) => {
  // EADDRINUSE (the common dev collision) exits with a distinct code so
  // tooling can tell it apart from other boot failures.
  process.exit(err.code === "EADDRINUSE" ? 12 : 1);
});

const shutdown = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on("unhandledRejection", (reason) => {
  // Nothing above handles this rejection; the request path (or a timer) let
  // it escape. Surface it and exit so a supervisor can restart cleanly
  // rather than leaving a half-alive process with a poisoned event loop.
  console.error("Unhandled promise rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  // Same rationale as unhandledRejection: the process is in an undefined
  // state after an uncaught throw, so log and let the supervisor restart.
  console.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

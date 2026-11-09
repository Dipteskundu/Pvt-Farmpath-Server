// Vercel serverless entrypoint.
//
// Loads `.env` first (Vercel injects env vars itself; this matters for
// `vercel dev` and any local run of the function), then re-exports the same
// Express app `src/server.js` uses. `src/app.js` never calls `listen()`, so
// Vercel's Node runtime can wrap it directly.
require("dotenv").config();

module.exports = require("../src/app");

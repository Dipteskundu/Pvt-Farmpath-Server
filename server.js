// Local dev entrypoint: `nodemon server.js` (also wired up as `npm run dev`
// and the `devCommand` in vercel.json).
//
// Delegates to `src/server.js` instead of duplicating its `listen()` so the
// escrow sweeper, the EADDRINUSE handling and the shutdown hooks all behave
// exactly as they do with `nodemon src/server.js`.
require("./src/server");

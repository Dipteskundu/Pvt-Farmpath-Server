/**
 * Start the local MongoDB used by `MONGODB_URI` — `npm run db:start`.
 *
 * The server's `.env` points at `mongodb://127.0.0.1:27017/farmpath`, but a
 * fresh checkout has no MongoDB: it is not an npm dependency and the official
 * installer needs admin rights this project does not assume. Instead the
 * portable server zip lives outside both git repos:
 *
 *     <workspace>/.mongo/bin/mongod(.exe)   binaries
 *     <workspace>/.mongo/data               database files (persistent)
 *     <workspace>/.mongo/mongod.log         server log
 *
 * Run this in its own terminal and leave it up while developing; stop it with
 * Ctrl+C. If the binary is missing, the script prints where to get it.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const MONGO_ROOT = path.resolve(__dirname, "..", "..", ".mongo");
const MONGOD = path.join(
  MONGO_ROOT,
  "bin",
  process.platform === "win32" ? "mongod.exe" : "mongod"
);
const DB_PATH = path.join(MONGO_ROOT, "data");
const LOG_PATH = path.join(MONGO_ROOT, "mongod.log");
const PORT = process.env.MONGO_PORT || "27017";

if (!fs.existsSync(MONGOD)) {
  console.error(`mongod not found at:\n  ${MONGOD}\n`);
  console.error(
    "Download the portable server zip and extract its `bin/` folder there:\n" +
      "  https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14.zip\n" +
      "  (Linux/macOS: https://www.mongodb.com/try/download/community)"
  );
  process.exit(1);
}

fs.mkdirSync(DB_PATH, { recursive: true });

console.log(`Starting MongoDB ${PORT} → ${DB_PATH}`);
console.log(`Log: ${LOG_PATH}  (Ctrl+C stops it)`);

const child = spawn(
  MONGOD,
  [
    "--dbpath", DB_PATH,
    "--port", PORT,
    "--bind_ip", "127.0.0.1",
    "--logpath", LOG_PATH,
    "--logappend",
  ],
  { stdio: "inherit" }
);

child.on("error", (err) => {
  console.error(`Failed to start mongod: ${err.message}`);
  process.exit(1);
});

// Propagate shutdown so Ctrl+C (or a parent kill) stops mongod too, and exit
// with mongod's own code so failures surface in `npm run db:start`.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 0));

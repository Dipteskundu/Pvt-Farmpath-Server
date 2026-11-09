const today = () => new Date().toISOString().slice(0, 10);

const pad = (n) => String(n).padStart(2, "0");

const nowStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const toDateOnly = (value) => {
  if (!value) return today();
  const raw = String(value);
  return raw.length >= 10 ? raw.slice(0, 10) : today();
};

const dateOnly = (value) => {
  if (!value) return today();
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return today();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * `n` calendar days after `from` (defaults to today), as `YYYY-MM-DD`.
 *
 * Runs in UTC off a midnight anchor so a deadline can never drift across a
 * day boundary the way local-time arithmetic does west of UTC. Escrow uses it
 * for the 7-day auto-release date.
 */
const addDays = (n, from) => {
  const anchor = new Date(`${toDateOnly(from)}T00:00:00.000Z`);
  if (Number.isNaN(anchor.getTime())) return addDays(n);
  anchor.setUTCDate(anchor.getUTCDate() + Number(n || 0));
  return anchor.toISOString().slice(0, 10);
};

module.exports = { today, nowStamp, toDateOnly, dateOnly, addDays };

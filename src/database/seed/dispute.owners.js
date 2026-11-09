const User = require("../models/User");

/**
 * Turns the `ownerEmail` markers in `initialDisputes` into `owner` ObjectIds.
 *
 * Same trick as `marketplace.owners.js`, for the same reason: `npm run seed`
 * recreates the users every run, so an ObjectId written into the data file
 * would point at a document that no longer exists. The email is a marker, and
 * it is always dropped — whether or not it resolved — so it can never reach
 * the schema.
 *
 * The resolved `owner` is the whole point of the field: it is what
 * `GET /api/orders/mine/disputes` filters on, so without it the demo buyer's
 * case shelf starts empty. A missing account is a warning, not a failure —
 * those cases seed unowned, i.e. visible to the admin board only, exactly as
 * they were before ownership existed.
 */
async function resolveDisputeOwners(records) {
  const emails = [...new Set(records.map((r) => r.ownerEmail).filter(Boolean))];

  const users = emails.length
    ? await User.find({ email: { $in: emails } }).select("_id email").lean()
    : [];

  const byEmail = new Map(users.map((u) => [u.email, u]));

  for (const email of emails) {
    if (!byEmail.has(email)) {
      console.warn(`! ${email} not found — those disputes will seed unowned`);
    }
  }

  return records.map((record) => {
    const { ownerEmail, ...fields } = record;
    if (!ownerEmail) return { ...fields };

    const user = byEmail.get(ownerEmail);
    if (!user) return { ...fields };

    return { ...fields, owner: user._id };
  });
}

module.exports = { resolveDisputeOwners };

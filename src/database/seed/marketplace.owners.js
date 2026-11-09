const User = require("../models/User");

/**
 * Turns the `ownerEmail` markers in `marketplace.data.js` into `owner` ObjectIds.
 *
 * Shared by both consumers of that file — the full `npm run seed`
 * (`index.js`) and the additive `npm run seed:marketplace`
 * (`marketplace.seed.js`) — so a listing is owned identically whichever path
 * seeded it. Emails are resolved at run time rather than stored as ObjectIds
 * because `npm run seed` recreates the users every time.
 *
 * Returns new records: the caller's data file is never mutated, so a re-run
 * in the same process still finds its markers. A missing account is a warning,
 * not a failure — the listing seeds unowned (admin-visible only), exactly as
 * it did before ownership existed.
 *
 * The seller's display name is re-derived from the resolved account so the
 * name on the listing, the name on the buyer's order card, and the account the
 * escrow is credited to are always the same person.
 *
 * The marker itself is always dropped, whether or not it resolved, so
 * `ownerEmail` can never reach the schema.
 */
async function resolveListingOwners(records) {
  const emails = [...new Set(records.map((r) => r.ownerEmail).filter(Boolean))];

  const users = emails.length
    ? await User.find({ email: { $in: emails } }).select("_id email name").lean()
    : [];

  const byEmail = new Map(users.map((u) => [u.email, u]));

  for (const email of emails) {
    if (!byEmail.has(email)) {
      console.warn(`! ${email} not found — its listings will seed unowned`);
    }
  }

  return records.map((record) => {
    const { ownerEmail, ...fields } = record;
    if (!ownerEmail) return { ...fields };

    const user = byEmail.get(ownerEmail);
    if (!user) return { ...fields };

    // `farmerName` is the name the buyer sees on their order card and the one
    // they would dial, so leaving the original placeholder would name a seller
    // who is not the account the escrow is credited to. Re-derive it from the
    // owner. `farmerPhone` stays as the consignment's contact number — it is a
    // property of the lot, not of the account.
    return { ...fields, owner: user._id, farmerName: user.name || fields.farmerName };
  });
}

module.exports = { resolveListingOwners };

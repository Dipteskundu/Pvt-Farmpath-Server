const { body } = require("express-validator");

/**
 * Withdrawal validation for `POST /api/wallet/withdraw`.
 *
 * Only the shape is checked here — that the amount is a positive, bounded
 * number. Whether it *fits* is decided in the handler against the ledger, not
 * against a number the client sent, because `available` is derived from rows
 * the caller cannot write.
 */
function withdrawRules() {
  return [
    body("amountBdt")
      .exists({ values: "falsy" })
      .withMessage("Please add an amount")
      .isFloat({ gt: 0, lte: 1000000000 })
      .withMessage("Amount must be a positive figure under 1,000,000,000 BDT")
      .toFloat(),

    body("method")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 40 })
      .withMessage("Payment channel must be 40 characters or fewer"),
  ];
}

module.exports = { withdrawRules };

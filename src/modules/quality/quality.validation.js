const { body } = require("express-validator");

/**
 * Quality inspection validation.
 *
 * Factories rather than shared arrays, for the reason documented in
 * `marketplace.validation.js`: `chain.optional()` mutates the chain in place,
 * so deriving one rule set from another shared array would silently make the
 * first set optional too.
 *
 * `assignRules` covers what an inspection *is* (who, where, when, which batch);
 * `submitRules` covers the measurements an inspector records when closing it.
 * `updateRules` is `assignRules` minus the required batch code, because an
 * admin re-pointing an assignment should not have to restate the batch.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const assignRules = () => [
  body("batchCode")
    .trim()
    .notEmpty()
    .withMessage("Batch code is required")
    .bail()
    .isLength({ max: 60 })
    .withMessage("Batch code must be 60 characters or fewer"),

  body("produceType").optional().trim().isLength({ max: 80 }).withMessage("Crop name must be 80 characters or fewer"),
  body("farmerName").optional().trim().isLength({ max: 120 }).withMessage("Farmer name must be 120 characters or fewer"),
  body("farmerPhone").optional().trim().isLength({ max: 30 }).withMessage("Phone must be 30 characters or fewer"),
  body("farmLocation").optional().trim().isLength({ max: 160 }).withMessage("Location must be 160 characters or fewer"),
  body("variety").optional().trim().isLength({ max: 60 }).withMessage("Variety must be 60 characters or fewer"),
  body("testingLabLocation").optional().trim().isLength({ max: 160 }).withMessage("Lab location must be 160 characters or fewer"),
  body("notes").optional().trim().isLength({ max: 500 }).withMessage("Notes must be 500 characters or fewer"),

  body("quantityKg").optional({ falsy: true }).isFloat({ min: 0 }).withMessage("Quantity must be zero or greater"),
  body("scheduledDate").optional({ falsy: true }).matches(DATE).withMessage("Scheduled date must be YYYY-MM-DD"),
  body("requestedAt").optional({ falsy: true }).matches(DATE).withMessage("Requested date must be YYYY-MM-DD"),
  body("priority").optional({ falsy: true }).isIn(["normal", "urgent"]).withMessage("Priority must be normal or urgent"),
  body("status")
    .optional({ falsy: true })
    .isIn(["assigned", "in_progress", "completed", "cancelled"])
    .withMessage("Unknown inspection status"),
  // `null` un-assigns; anything else must be an existing inspector.
  body("owner").optional({ falsy: true }).isMongoId().withMessage("Unknown inspector id"),
];

const updateRules = () => [
  body("batchCode").optional({ falsy: true }).trim().isLength({ min: 1, max: 60 }).withMessage("Batch code must be 1-60 characters"),
  body("produceType").optional().trim().isLength({ max: 80 }),
  body("farmerName").optional().trim().isLength({ max: 120 }),
  body("farmerPhone").optional().trim().isLength({ max: 30 }),
  body("farmLocation").optional().trim().isLength({ max: 160 }),
  body("variety").optional().trim().isLength({ max: 60 }),
  body("testingLabLocation").optional().trim().isLength({ max: 160 }),
  body("notes").optional().trim().isLength({ max: 500 }),
  body("quantityKg").optional({ falsy: true }).isFloat({ min: 0 }),
  body("scheduledDate").optional({ falsy: true }).matches(DATE).withMessage("Scheduled date must be YYYY-MM-DD"),
  body("requestedAt").optional({ falsy: true }).matches(DATE).withMessage("Requested date must be YYYY-MM-DD"),
  body("priority").optional({ falsy: true }).isIn(["normal", "urgent"]),
  body("status").optional({ falsy: true }).isIn(["assigned", "in_progress", "completed", "cancelled"]),
  body("owner").optional({ falsy: true }).isMongoId().withMessage("Unknown inspector id"),
];

const submitRules = () => [
  body("assignedGrade")
    .exists()
    .withMessage("A grade is required")
    .bail()
    .isIn(["Grade A", "Grade B", "Grade C", "Rejected"])
    .withMessage("Grade must be Grade A, Grade B, Grade C or Rejected"),

  body("moistureContentPercent")
    .exists()
    .withMessage("Moisture content is required")
    .bail()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Moisture content must be between 0 and 100"),

  body("foreignMatterPercent")
    .optional({ falsy: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage("Foreign matter must be between 0 and 100"),

  body("aflatoxinPpm")
    .optional({ falsy: true })
    .isFloat({ min: 0, max: 1000 })
    .withMessage("Aflatoxin must be between 0 and 1000"),

  body("complianceVerdict")
    .exists()
    .withMessage("A verdict is required")
    .bail()
    .isIn(["Passed", "Conditional Pass", "Rejected"])
    .withMessage("Verdict must be Passed, Conditional Pass or Rejected"),

  body("visualCondition")
    .optional({ falsy: true })
    .isIn(["Excellent", "Good", "Fair", "Poor"])
    .withMessage("Visual condition must be Excellent, Good, Fair or Poor"),

  body("recommendedAction").optional().trim().isLength({ max: 300 }).withMessage("Recommended action must be 300 characters or fewer"),
  body("findings").optional().trim().isLength({ max: 2000 }).withMessage("Findings must be 2000 characters or fewer"),
  body("certificateNumber").optional().trim().isLength({ max: 60 }).withMessage("Certificate number must be 60 characters or fewer"),
  body("inspectionDate").optional({ falsy: true }).matches(DATE).withMessage("Inspection date must be YYYY-MM-DD"),
];

module.exports = { assignRules, updateRules, submitRules };

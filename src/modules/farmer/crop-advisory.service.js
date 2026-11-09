const Crop = require("../../database/models/Crop");
const Field = require("../../database/models/Field");
const Farm = require("../../database/models/Farm");
const CropBatch = require("../../database/models/CropBatch");

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Converts the farm location entered by the farmer into
 * district/upazila for the AI service.
 *
 * Expected UI format:
 *   Village, Upazila, District
 *
 * Example:
 *   Garidaha, Sherpur, Bogura
 */
const parseFarmLocation = (location) => {
  const parts = String(location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return {
      district: null,
      upazila: null,
    };
  }

  if (parts.length === 1) {
    return {
      district: parts[0],
      upazila: null,
    };
  }

  return {
    district: parts[parts.length - 1],
    upazila: parts.length >= 3 ? parts[parts.length - 2] : null,
  };
};

/**
 * Calls the real AgriNova FastAPI/XGBoost recommendation service.
 */
const getAiFarmRecommendation = async (input, farm) => {
  const { district, upazila } = parseFarmLocation(farm.location);

  if (!district) {
    throw new Error(
      "Farm location is required for AI crop recommendation. Please update the farm location first."
    );
  }

  const area = Number(input.targetLandSizeAcres);

  const payload = {
    field: {
      district,
      upazila,
      area: area > 0 ? area : Number(farm.totalAreaAcres) || 1,
      area_unit: "acre",
      latitude:
        Number(farm.latitude) !== 0 ? Number(farm.latitude) : null,
      longitude:
        Number(farm.longitude) !== 0 ? Number(farm.longitude) : null,
    },

    // Only send pH here.
    //
    // The existing Field N/P/K values and the frontend N/P/K values
    // use different units from the FastAPI SoilData schema.
    // The XGBoost crop predictor itself does not use these soil values.
    soil: {
      ph: Number.isFinite(Number(input.ph))
        ? Number(input.ph)
        : null,
    },

    season: input.season || null,

    irrigation_available:
      String(farm.irrigationType || "").toLowerCase() !== "rainfed",

    crop_stage: null,
  };


  console.log("[Crop AI diagnostic]", {
    farmId: String(farm._id),
    farmLocation: farm.location,
    district: payload.field.district,
    upazila: payload.field.upazila,
    latitude: payload.field.latitude,
    longitude: payload.field.longitude,
    season: payload.season,
    area: payload.field.area,
    soil: payload.soil,
  });


  let response;
  try {
    response = await fetch(`${AI_SERVICE_URL}/recommend/farm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AI-Service-Key": process.env.AI_SERVICE_API_KEY || "",
      },
      body: JSON.stringify(payload),
      // Never let an unreachable or slow AI service hang the request:
      // a production host has a finite budget per call, and the UI must
      // get a prompt, readable failure instead of a stalled response.
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      throw new Error(
        "AI recommendation service timed out. Please try again in a moment."
      );
    }
    throw new Error(
      "AI recommendation service is unavailable right now. Please try again later."
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.detail ||
      result?.message ||
      `AI recommendation service returned ${response.status}`;

    throw new Error(message);
  }

  return result;
};

/**
 * Converts an AI candidate into the existing frontend
 * CropRecommendationItem structure.
 */

const mapAiCandidateToCrop = (candidate, crop, index) => {
  const modelScore = Number(candidate.model_confidence_score);
  const hasModelScore = Number.isFinite(modelScore);

  // Only use financial and agronomic values backed by the database.
  // Do not invent values for crops absent from the catalogue.
  const yieldKg =
    crop?.standardYieldKgPerAcre != null
      ? Math.round(crop.standardYieldKgPerAcre * 100) / 100
      : null;

  const price =
    crop?.benchmarkPriceBdtPerKg != null
      ? crop.benchmarkPriceBdtPerKg
      : null;

  const revenue =
    yieldKg != null && price != null
      ? Math.round(yieldKg * price)
      : null;

  // No verified cost model is available for arbitrary AI crops.
  const cost = null;
  const profit = null;
  const roi = null;

  const cropName =
    crop?.cropName ||
    candidate.canonical_name ||
    candidate.spas_label ||
    candidate.bangla_name ||
    `AI-recommended crop ${index + 1}`;

  const confidence = hasModelScore
    ? Math.max(0, Math.min(1, modelScore))
    : 0;

  return {
    id: String(crop?._id || candidate.canonical_name || cropName),
    cropName,
    scientificName: crop?.scientificName || "",

    suitabilityScore: Math.round(confidence * 100),

    recommendedVariety:
      crop?.approvedVarieties?.[0] || "Unavailable",

    maturityPeriodDays: crop?.averageMaturityDays ?? null,

    estimatedYieldKgPerAcre: yieldKg,
    estimatedCostPerAcre: cost,
    expectedMarketPricePerKg: price,
    estimatedRevenuePerAcre: revenue,
    estimatedProfitPerAcre: profit,
    roiPercentage: roi,

    // Model confidence is not the same as agricultural risk.
    // Keep risk unclassified until a validated risk estimate exists.
    riskFactor: "Unknown",

    waterRequirementMm:
      crop?.minRainfallMm != null && crop?.maxRainfallMm != null
        ? Math.round((crop.minRainfallMm + crop.maxRainfallMm) / 2)
        : null,

    keyAdvantages: [
      `AI rank #${candidate.rank || index + 1}`,
      hasModelScore
        ? `${(confidence * 100).toFixed(1)}% model confidence`
        : "Model confidence unavailable",
      candidate.barc_suitability?.suitability_class
        ? `BARC suitability: ${candidate.barc_suitability.suitability_class}`
        : "BARC suitability data unavailable",
    ],

    climateResilience: candidate.season_compatibility?.is_compatible
      ? `AI and domain rules matched this crop to the ${candidate.season_compatibility.target_season || "selected"
      } season`
      : "Requires further agronomic validation",
  };
};


const buildRecommendations = async (input = {}, user = null) => {
  /*
   * Get the farmer's farm so the AI service can receive
   * the actual geographic location and GPS coordinates.
   */
  if (!user?._id) {
    throw new Error("Authenticated farmer information is required.");
  }


  const farmQuery = {
    owner: user._id,
    status: "active",
  };

  if (input.farmId) {
    farmQuery._id = input.farmId;
  }

  const farm = await Farm.findOne(farmQuery)
    .sort({ createdAt: 1 })
    .lean();

  if (input.farmId && !farm) {
    throw new Error(
      "The selected farm was not found or is not active for this account."
    );
  }


  if (!farm) {
    throw new Error(
      "No active farm found. Please register a farm before using AI crop recommendation."
    );
  }

  /*
   * Call the real FastAPI/XGBoost service.
   */
  const aiResult = await getAiFarmRecommendation(input, farm);

  /*
   * Load our local Crop catalog so the existing frontend
   * can continue receiving its current CropRecommendationItem format.
   */
  const crops = await Crop.find().sort({ cropName: 1 }).lean();
  /*
   * Match AI canonical crop names against our MongoDB catalog.
   */
  const cropByName = new Map();

  crops.forEach((crop) => {
    cropByName.set(
      String(crop.cropName || "")
        .trim()
        .toLowerCase(),
      crop
    );
  });

  const candidates = [
    aiResult.primary_crop,
    ...(aiResult.alternatives || []),
  ].filter(Boolean);

  const recommendations = [];

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];

    const namesToTry = [
      candidate.canonical_name,
      candidate.bangla_name,
      candidate.spas_label,
    ].filter(Boolean);

    let crop = null;

    for (const name of namesToTry) {
      crop = cropByName.get(String(name).trim().toLowerCase());

      if (crop) {
        break;
      }
    }

    /*
     * Keep AI candidates even when they have no matching database crop.
     * The mapper marks unavailable catalogue values as null.
     */
    recommendations.push(
      mapAiCandidateToCrop(candidate, crop, index)
    );
  }

  return recommendations.slice(0, 8);
};

const buildComparisonProfiles = async () => {
  const crops = await Crop.find().sort({ cropName: 1 }).lean();

  return crops.map((crop, index) => {
    const yieldKg = crop.standardYieldKgPerAcre || 1500;
    const price = crop.benchmarkPriceBdtPerKg || 25;
    const inputCost = Math.round(yieldKg * price * 0.55);
    const pests = (crop.pestVulnerabilities || []).length;
    const category = String(crop.category || "").toLowerCase();

    return {
      id: String(crop._id),
      cropName: crop.cropName,
      variety:
        (crop.approvedVarieties && crop.approvedVarieties[0]) || "Improved",
      season: crop.recommendedSeason || "",
      waterRequirementLitersPerKg:
        600 +
        index * 40 +
        (category.includes("vegetable") ? 350 : 0),
      seedCostPerAcre: Math.round(yieldKg * price * 0.12),
      totalInputCostPerAcre: inputCost,
      maturityDays: crop.averageMaturityDays || 120,
      yieldKgPerAcre: yieldKg,
      marketPricePerKg: price,
      netMarginPercent:
        Math.round(
          ((yieldKg * price - inputCost) / (yieldKg * price)) * 1000
        ) / 10,
      pestVulnerability:
        pests >= 3 ? "High" : pests >= 1 ? "Moderate" : "Low",
      laborIntensityDays:
        25 +
        index * 4 +
        (category.includes("vegetable") ? 18 : 0),
      shelfLifeDays: category.includes("vegetable")
        ? 21
        : category.includes("fruit")
          ? 14
          : 180,
      governmentSubsidiesEligible:
        String(crop.cropName).toLowerCase().includes("rice") ||
        index % 2 === 0,
    };
  });
};

const nutrientStatus = (value, low, high) =>
  value < low
    ? "Deficient"
    : value > high
      ? "Excessive"
      : "Sufficient";

const buildAiDiagnostic = async (user) => {
  const fields = await Field.find({
    owner: user._id || user.id,
  }).lean();

  const batches = await CropBatch.find({
    owner: user._id || user.id,
  }).lean();

  const avg = (key) =>
    fields.length
      ? Math.round(
        fields.reduce((acc, f) => acc + (f[key] || 0), 0) /
        fields.length
      )
      : 0;

  const nitrogen = avg("nitrogenLevelKgPerHa") || 38;
  const phosphorus = avg("phosphorusLevelKgPerHa") || 22;
  const potassium = avg("potassiumLevelKgPerHa") || 140;
  const ph = fields.length
    ? fields.reduce((acc, f) => acc + (f.soilPh || 7), 0) /
    fields.length
    : 6.4;

  const soilDeficiencies = [
    {
      nutrient: "Nitrogen (N)",
      currentLevel: `${nitrogen} kg/ha`,
      optimalLevel: "60 - 90 kg/ha",
      status: nutrientStatus(nitrogen, 55, 95),
    },
    {
      nutrient: "Phosphorus (P)",
      currentLevel: `${phosphorus} kg/ha`,
      optimalLevel: "25 - 45 kg/ha",
      status: nutrientStatus(phosphorus, 22, 50),
    },
    {
      nutrient: "Potassium (K)",
      currentLevel: `${potassium} kg/ha`,
      optimalLevel: "120 - 180 kg/ha",
      status: nutrientStatus(potassium, 110, 190),
    },
    {
      nutrient: "Soil pH",
      currentLevel: ph.toFixed(1),
      optimalLevel: "5.8 - 7.0",
      status: nutrientStatus(ph, 5.8, 7.0),
    },
  ];

  const recommendedFertilizers = soilDeficiencies
    .filter((d) => d.status === "Deficient")
    .map((d) => ({
      name:
        d.nutrient.startsWith("Nitrogen")
          ? "Granular Urea (46-0-0)"
          : d.nutrient.startsWith("Phosphorus")
            ? "Triple Super Phosphate (0-46-0)"
            : d.nutrient.startsWith("Potassium")
              ? "Muriate of Potash (0-0-60)"
              : "Agricultural Lime (CaCO3)",
      dosagePerAcre: d.nutrient.startsWith("Nitrogen")
        ? "45 - 55 kg"
        : d.nutrient.startsWith("Phosphorus")
          ? "25 - 30 kg"
          : d.nutrient.startsWith("Potassium")
            ? "20 - 25 kg"
            : "250 - 300 kg",
      applicationWindow: d.nutrient.startsWith("Nitrogen")
        ? "Split: basal + tillering + panicle"
        : "Basal application before final ploughing",
      purpose: `Correct ${d.nutrient.split(" (")[0]
        } deficiency measured across ${fields.length || 1} active field(s)`,
    }));

  if (!recommendedFertilizers.length) {
    recommendedFertilizers.push({
      name: "Balanced NPK 20-20-20 (foliar)",
      dosagePerAcre: "5 kg",
      applicationWindow:
        "Every 21 days during vegetative growth",
      purpose:
        "Maintain the already balanced soil fertility status",
    });
  }

  const riskFactors = [];

  if (fields.some((f) => f.irrigationStatus === "Needed")) {
    riskFactors.push({
      factor: "Moisture stress in at least one field",
      impact: "Medium",
      mitigationStrategy:
        "Schedule deficit irrigation within the next 48 hours",
    });
  }

  if (ph < 5.8 || ph > 7.0) {
    riskFactors.push({
      factor: "Soil pH outside optimal band",
      impact: "Medium",
      mitigationStrategy:
        ph < 5.8
          ? "Apply agricultural lime at 250 kg/acre"
          : "Apply elemental sulphur to lower pH",
    });
  }

  riskFactors.push({
    factor: "Seasonal pest pressure (BPH / armyworm)",
    impact: "Low",
    mitigationStrategy:
      "Weekly scouting and pheromone traps at field bunds",
  });

  const targetYields = batches
    .filter((b) => b.targetYieldKg > 0)
    .map((b) => b.targetYieldKg);

  const baseYield = targetYields.length
    ? Math.round(
      targetYields.reduce((a, b) => a + b, 0) /
      targetYields.length
    )
    : 1800;

  const cropNames = batches.length
    ? [...new Set(batches.map((b) => b.cropName))].join(", ")
    : "the currently planned crop rotation";

  return {
    soilDeficiencies,
    recommendedFertilizers,
    riskFactors,
    agronomicRationale: `Nutrient status was aggregated from ${fields.length || 0
      } registered field(s) and combined with ${batches.length || 0
      } active cropbatch(es) for ${cropNames}. Recommendations prioritise correcting measured deficiencies before yield-limiting stages, while keeping leaching losses low under the prevailing rainfall.`,
    yieldPotentialPrediction: {
      minimumYield: Math.round(baseYield * 0.85),
      maximumYield: Math.round(baseYield * 1.18),
      unit: "kg/acre",
      confidenceLevel: fields.length ? 82 : 64,
    },
  };
};

module.exports = {
  buildRecommendations,
  buildComparisonProfiles,
  buildAiDiagnostic,
};

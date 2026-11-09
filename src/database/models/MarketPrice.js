const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema(
  {
    commodityName: { type: String, required: [true, "Please add a commodity name"], trim: true },
    variety: { type: String, default: "" },
    marketLocation: { type: String, default: "" },
    division: { type: String, default: "" },
    wholesaleMinPriceBdt: { type: Number, default: 0 },
    wholesaleMaxPriceBdt: { type: Number, default: 0 },
    wholesaleModalPriceBdt: { type: Number, default: 0 },
    retailPriceBdt: { type: Number, default: 0 },
    priceTrend: { type: String, default: "stable" },
    recordedDate: { type: String, default: "" },
    volumeTradedMetricTons: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketPrice", marketPriceSchema);

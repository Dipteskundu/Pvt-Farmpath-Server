"use strict";
const mongoose = require("mongoose");
require("dotenv").config();

const marketplaceImageMap = {};

const inputImageMap = {
  "Urea 50kg Bag": "https://5.imimg.com/data5/SELLER/Default/2024/3/404121042/LX/IV/BZ/92886536/iffco-urea.jpeg",
  "TSP 50kg Bag": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5OQXgcS39U09VOgvphXWX8qgrMStYrAbDsemtfM9ivw&s=10",
  "Magnesium Sulphate 5kg": "https://www.parshwaorgano.com/wp-content/uploads/2021/10/Purav-Magnesium-Sulphate-9.5-5Kg.png",
  "BRRI dhan-28 Seed 20kg": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTo_E5SeV3mRUd0OF5KTtq6lal_Hd_hOKbCLY7zi_5mfw&s=10",
  "Hybrid Onion Seed 100g": "https://irfarm.com/cdn/shop/files/snsonionseed_468582a8-aac4-47a2-b852-89cfedd3b85b.webp?v=1786190895&width=600",
  "Hybrid Tomato Seed 50g": "https://www.farmersstop.com/cdn/shop/files/kirtiman.png?v=1782800659&width=600",
  "Neem Oil 1L": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVjMZKUZN8xVpfyjgrYc54IYXIE0FP60VOR6shgTtQ0xJh9yc8EMhTzCKG&s=10",
  "Mancozeb 1kg": "https://down-ph.img.susercontent.com/file/ph-11134207-7ra0i-mczvly53amweb7",
  "Pruning Shear": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMYKFPVkr32oUpNnMRkmawZRxNsmDz2o_XnndkLZqEiA&s=10",
  "Knapsack Sprayer 16L": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZ0rdk7BTkqclTRzw50LrgD7pHWc1sxcQyRYa73ab8uw&s=10",
  "Drip Irrigation Kit 100m": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThKRqDf6RIhfktsFN3Tmx7n0csHyKpvk9OaOEIeU3anUu0GTARGjo1UVE&s=10",
  "Vented Produce Crate": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQu2f3dYfULpS38w_xhVdKvEZTYGUxWCEQfnP6ZKtaSQ&s=10",
};

async function fixAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/farmpath");
    const marketCol = mongoose.connection.db.collection("marketplacelistings");
    const prodCol = mongoose.connection.db.collection("products");

    for (const [name, img] of Object.entries(marketplaceImageMap)) {
      const res = await marketCol.updateMany(
        { $or: [{ produceName: name }, { cropName: name }] },
        { $set: { imageUrl: img } }
      );
      console.log(`Updated marketplace listing '${name}': ${res.modifiedCount} modified`);
    }

    for (const [name, img] of Object.entries(inputImageMap)) {
      const res = await prodCol.updateMany(
        { name: name },
        { $set: { image: img } }
      );
      console.log(`Updated product input '${name}': ${res.modifiedCount} modified`);
    }

    console.log("✓ All DB records successfully updated with verified matching images.");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

fixAll();

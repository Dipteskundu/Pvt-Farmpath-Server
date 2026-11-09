/**
 * Farm input fixtures — `npm run seed:inputs`.
 *
 * These are what the public `/inputs` page lists, so they cover every entry
 * in `Product.category` and mix stock levels (including one deliberately
 * low-stock row and one delisted row) so the supplier's Inventory screen has
 * something to alert on.
 *
 * `name` is the natural key the seeder upserts on. `image` points at
 * `public/inputs/*.svg`, one per category, generated alongside the produce
 * illustrations in `public/produce/`.
 *
 * `supplier` is intentionally absent — it is resolved from
 * `supplier@demo.com` at seed time, because a hard-coded ObjectId would not
 * survive a `npm run seed`.
 */
const inputs = [
  {
    name: "Urea 50kg Bag",
    category: "fertilizer",
    description: "Granular urea, 46% nitrogen. The workhorse basal dose for paddy and maize.",
    price: 2750,
    unit: "bag",
    stock: 240,
    minimumOrderQuantity: 2,
    image: "https://5.imimg.com/data5/SELLER/Default/2024/3/404121042/LX/IV/BZ/92886536/iffco-urea.jpeg",
    isActive: true,
  },
  {
    name: "TSP 50kg Bag",
    category: "fertilizer",
    description: "Triple superphosphate, 46% P₂O₅. Applied at transplanting for root vigour.",
    price: 3100,
    unit: "bag",
    stock: 160,
    minimumOrderQuantity: 1,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5OQXgcS39U09VOgvphXWX8qgrMStYrAbDsemtfM9ivw&s=10",
    isActive: true,
  },
  {
    name: "Magnesium Sulphate 5kg",
    category: "fertilizer",
    description: "Corrects interveinal chlorosis in vegetable and fruit crops.",
    price: 640,
    unit: "bag",
    stock: 75,
    minimumOrderQuantity: 1,
    image: "https://www.parshwaorgano.com/wp-content/uploads/2021/10/Purav-Magnesium-Sulphate-9.5-5Kg.png",
    isActive: true,
  },
  {
    name: "BRRI dhan-28 Seed 20kg",
    category: "seeds",
    description: "Certified aman paddy seed, 105–110 days, drought tolerant.",
    price: 1850,
    unit: "bag",
    stock: 90,
    minimumOrderQuantity: 1,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTo_E5SeV3mRUd0OF5KTtq6lal_Hd_hOKbCLY7zi_5mfw&s=10",
    isActive: true,
  },
  {
    name: "Hybrid Onion Seed 100g",
    category: "seeds",
    description: "Atlas hybrid onion seed, 100g sachet, ~8,000 plants.",
    price: 420,
    unit: "piece",
    stock: 320,
    minimumOrderQuantity: 1,
    image: "https://irfarm.com/cdn/shop/files/snsonionseed_468582a8-aac4-47a2-b852-89cfedd3b85b.webp?v=1786190895&width=600",
    isActive: true,
  },
  {
    name: "Hybrid Tomato Seed 50g",
    category: "seeds",
    description: "Mintoo Super determinate tomato, disease resistant.",
    price: 380,
    unit: "piece",
    stock: 6,
    minimumOrderQuantity: 1,
    image: "https://www.farmersstop.com/cdn/shop/files/kirtiman.png?v=1782800659&width=600",
    isActive: true,
  },
  {
    name: "Neem Oil 1L",
    category: "pesticide",
    description: "Cold-pressed botanical pesticide. Effective against aphids and mites.",
    price: 480,
    unit: "liter",
    stock: 60,
    minimumOrderQuantity: 2,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVjMZKUZN8xVpfyjgrYc54IYXIE0FP60VOR6shgTtQ0xJh9yc8EMhTzCKG&s=10",
    isActive: true,
  },
  {
    name: "Mancozeb 1kg",
    category: "pesticide",
    description: "Protectant fungicide, 80% WP. Blight and leaf-spot programmes.",
    price: 760,
    unit: "kg",
    stock: 45,
    minimumOrderQuantity: 1,
    image: "https://down-ph.img.susercontent.com/file/ph-11134207-7ra0i-mczvly53amweb7",
    isActive: true,
  },
  {
    name: "Pruning Shear",
    category: "tools",
    description: "Drop-forged bypass shear with sap groove. Suits up to 20mm green wood.",
    price: 1250,
    unit: "piece",
    stock: 34,
    minimumOrderQuantity: 1,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMYKFPVkr32oUpNnMRkmawZRxNsmDz2o_XnndkLZqEiA&s=10",
    isActive: true,
  },
  {
    name: "Knapsack Sprayer 16L",
    category: "equipment",
    description: "Pressure-indicator knapsack sprayer, 16L, brass nozzle set included.",
    price: 4600,
    unit: "piece",
    stock: 18,
    minimumOrderQuantity: 1,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZ0rdk7BTkqclTRzw50LrgD7pHWc1sxcQyRYa73ab8uw&s=10",
    isActive: true,
  },
  {
    name: "Drip Irrigation Kit 100m",
    category: "irrigation",
    description: "100m mainline with 20 emitters and filter — covers roughly 0.1 acre of vegetables.",
    price: 7900,
    unit: "set",
    stock: 12,
    minimumOrderQuantity: 1,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThKRqDf6RIhfktsFN3Tmx7n0csHyKpvk9OaOEIeU3anUu0GTARGjo1UVE&s=10",
    isActive: true,
  },
  {
    name: "Vented Produce Crate",
    category: "packaging",
    description: "Stackable 25kg vented crate for tomato and onion handling.",
    price: 940,
    unit: "piece",
    stock: 210,
    minimumOrderQuantity: 5,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQu2f3dYfULpS38w_xhVdKvEZTYGUxWCEQfnP6ZKtaSQ&s=10",
    isActive: true,
  },
];

module.exports = { inputs };

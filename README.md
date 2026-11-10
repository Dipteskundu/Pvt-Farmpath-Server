# AgriNova Backend

Node.js + Express backend for the AgriNova Smart Agriculture & Farm-to-Market Platform.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4+
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Express Validator
- **File Upload:** Multer

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/agrinova

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

# Python FastAPI AI service
AI_SERVICE_URL=http://127.0.0.1:8000

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Absolute origin of this API (used for uploaded-photo URLs in local-disk
# fallback mode; set to https://<project>.vercel.app on Vercel)
PUBLIC_API_URL=

# Cloudinary (photo uploads) - when all three are set, produce photos are
# uploaded to Cloudinary instead of the local `uploads/` directory.
# Required on Vercel (read-only filesystem).
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cron secret for the hourly escrow auto-release
# (GET /api/orders/escrow/cron, scheduled by vercel.json "crons")
CRON_SECRET=

# External Services (optional)
WEATHER_API_KEY=your_weather_api_key
PAYMENT_GATEWAY_KEY=your_payment_gateway_key
AI_API_KEY=your_ai_api_key
CLOUD_STORAGE_BUCKET=your_cloud_storage_bucket
```

## Available Scripts

```bash
npm run dev      # Start development server with nodemon (runs `server.js`)
npm run start    # Start production server (node src/server.js)
npm run db:start # Start local MongoDB (portable server in <workspace>/.mongo)
npm run seed     # Seed database with initial data
npm run lint     # Run ESLint
```

`nodemon server.js` also works directly â€” the root `server.js` delegates to
`src/server.js`, so both entrypoints behave identically.


## API Endpoints

### Authentication
```
POST   /api/auth/register     # Register new user
POST   /api/auth/login        # Login user
GET    /api/auth/me           # Get current user
```

### Farms
```
GET    /api/farms             # Get all farms
POST   /api/farms             # Create farm
GET    /api/farms/:id         # Get farm by ID
PUT    /api/farms/:id         # Update farm
DELETE /api/farms/:id         # Delete farm
```

### Fields
```
GET    /api/fields            # Get all fields
POST   /api/fields            # Create field
GET    /api/fields/:id        # Get field by ID
PUT    /api/fields/:id        # Update field
DELETE /api/fields/:id        # Delete field
```

### Crops
```
GET    /api/crops             # Get all crops
POST   /api/crops/recommend   # Get recommendations
GET    /api/crops/:id         # Get crop by ID
```

### Harvest
```
GET    /api/harvest           # Get all harvests
POST   /api/harvest           # Create harvest lot
GET    /api/harvest/:id       # Get harvest by ID
```

### Orders
```
GET    /api/orders            # Get all orders
POST   /api/orders            # Create order
GET    /api/orders/:id        # Get order by ID
PUT    /api/orders/:id/status # Update order status
```

### Marketplace
```
GET    /api/marketplace/inputs   # Get input products
GET    /api/marketplace/produce  # Get produce listings
POST   /api/marketplace/produce  # Create listing
```

### Demands
```
GET    /api/demands           # Get all demands
POST   /api/demands           # Create demand
GET    /api/demands/:id       # Get demand by ID
```

### Weather
```
GET    /api/weather           # Get weather data
```

## Middleware

### Authentication
```javascript
const auth = require("./middleware/auth.middleware");

// Protected route
router.get("/protected", auth, controller.method);
```

### Role-Based Access
```javascript
const role = require("./middleware/role.middleware");

// Admin only route
router.get("/admin", auth, role(["admin"]), controller.method);

// Multiple roles
router.get("/farmer-or-buyer", auth, role(["farmer", "buyer"]), controller.method);
```

## Database Models

- **User** - User accounts and profiles
- **Farm** - Farm information
- **Field** - Field details
- **Crop** - Crop database
- **CropCycle** - Active crop cycles
- **Harvest** - Harvest lots
- **QualityRequest** - Quality verification
- **Product** - Marketplace products
- **Demand** - Buyer demands
- **Order** - Orders
- **Payment** - Payments
- **Delivery** - Deliveries
- **Expense** - Expenses
- **Notification** - Notifications

## Error Handling

All errors are handled by the error middleware and return:

```json
{
  "message": "Error message"
}
```

Status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Deploying to Vercel

The backend deploys as a single serverless Express function:

- `api/index.js` â€” serverless entrypoint; loads `.env` and re-exports `src/app`.
  `src/app.js` never calls `listen()`, so Vercel wraps it directly.
- `vercel.json` â€” rewrites every `/api/*` path to the function, raises the
  function timeout to 60s, schedules the hourly escrow cron, and sets
  `devCommand` so `vercel dev` starts the app with `nodemon server.js`.
- `src/server.js` (and the `nodemon server.js` wrapper) remain the local
  entrypoints â€” they are not used by the hosted deployment.

### Required environment variables (Project â†’ Settings â†’ Environment Variables)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (local Mongo is unreachable from Vercel) |
| `JWT_SECRET` / `JWT_EXPIRE` | Token signing (tokens get no expiry if `JWT_EXPIRE` is missing) |
| `NODE_ENV` | `production` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Photo uploads (serverless filesystem is read-only) |
| `CRON_SECRET` | Authenticates `GET /api/orders/escrow/cron` (Vercel Cron sends it as `Bearer $CRON_SECRET`) |
| `PUBLIC_API_URL` | Optional; only used by the local-disk upload fallback |

### Deploy

```bash
vercel login
vercel link          # create/link the project
vercel --prod
```

Local equivalent of the hosted behavior:

```bash
vercel dev           # runs `nodemon server.js` via vercel.json devCommand
# or simply:
npm run dev          # nodemon server.js
```

## Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

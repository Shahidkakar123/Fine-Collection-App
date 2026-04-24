const express = require("express");
const serverless = require("serverless-http");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./utils/db");
const userRoutes = require("./routes/users");
const itemRoutes = require("./routes/items");
const configRoutes = require("./routes/config");

const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const fs = require("fs");

dotenv.config({ path: require('path').join(__dirname, '.env') });
const app = express();

// Enable CORS for frontend requests
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://localhost:3000",
    "https://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());

// Load swagger using absolute path — works in both local and serverless environments
const swaggerPath = path.join(__dirname, "swagger.yaml");
const swaggerDocument = yaml.load(fs.readFileSync(swaggerPath, "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Fine Collection API! Please append /api-docs to URL for documentation and API Testing." });
});

// Connect to DB before handling any route (cached — won't reconnect if already connected)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("✗ DB connection failed:", err.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/config", configRoutes);

// Start local server only when not running on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}

module.exports = app;
module.exports.handler = serverless(app);
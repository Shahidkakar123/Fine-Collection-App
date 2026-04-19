const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoutes = require("./routes/users");
const itemRoutes = require("./routes/items");
const configRoutes = require("./routes/config");

const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const fs = require("fs");

dotenv.config();
const app = express();

// Enable CORS for frontend requests
app.use(cors({
  origin: ["http://localhost:5173", "https://localhost:5173", "http://localhost:3000", "https://localhost:3000"],
  credentials: true
}));

app.use(express.json());
const swaggerDocument = yaml.load(fs.readFileSync("./swagger.yaml", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Add root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Fine Collection API! Please append /api-docs to URL for documentation and API Testing." });
});

// Connect to MongoDB then start server
const startServer = async () => {
  try {
    // Verify MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Add routes
    app.use("/api/users", userRoutes);
    app.use("/api/items", itemRoutes);
    app.use("/api/config", configRoutes);

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("✗ Failed to start server:", err.message);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;
module.exports.handler = serverless(app);

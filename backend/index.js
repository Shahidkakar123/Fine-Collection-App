const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/users");
const itemRoutes = require("./routes/items");

const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const fs = require("fs");

dotenv.config();
const app = express();
app.use(express.json());
const swaggerDocument = yaml.load(fs.readFileSync("./swagger.yaml", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Add root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Fine Collection API! Please append /api-docs to URL for documentation and API Testing." });
});

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));

module.exports = app;

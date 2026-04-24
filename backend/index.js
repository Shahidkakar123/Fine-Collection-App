const express = require("express");
const serverless = require("serverless-http");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./utils/db");
const userRoutes = require("./routes/users");
const itemRoutes = require("./routes/items");
const configRoutes = require("./routes/config");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://localhost:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());

// DB connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("✗ DB connection failed:", err.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "FineMate API running" });
});

app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/config", configRoutes);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
}

module.exports = app;
module.exports.handler = serverless(app);
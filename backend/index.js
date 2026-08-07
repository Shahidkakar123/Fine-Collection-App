const express = require("express");
const serverless = require("serverless-http");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./utils/db");
const { verifyEmailToken } = require("./utils/verification");
const userRoutes = require("./routes/users");
const itemRoutes = require("./routes/items");
const configRoutes = require("./routes/config");
const messageRoutes = require('./routes/messages');

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
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

app.get("/verify-email/:token", async (req, res) => {
  const result = await verifyEmailToken(req.params.token);
  if (result.success) {
    return res.json({ message: result.message });
  }
  return res.status(400).json({ message: result.message });
});

app.use('/api/messages', messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/config", configRoutes);

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
}

module.exports = app;
module.exports.handler = serverless(app);

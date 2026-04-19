const express = require("express");
const router = express.Router();
const Config = require("../models/Config");
const { auth, checkRole } = require("../middleware/auth");

// Get a config value
router.get("/:key", async (req, res) => {
  try {
    const config = await Config.findOne({ key: req.params.key });
    if (!config) {
      return res.status(404).json({ message: "Config not found" });
    }
    res.json({ key: config.key, value: config.value });
  } catch (error) {
    console.error("Error fetching config:", error);
    res.status(500).json({ message: "Error fetching config", error: error.message });
  }
});

// Update a config value (PD only)
router.put("/:key", auth, checkRole('pd'), async (req, res) => {
  try {
    const { value } = req.body;
    
    if (value === undefined || value === null) {
      return res.status(400).json({ message: "Value is required" });
    }

    let config = await Config.findOne({ key: req.params.key });
    
    if (!config) {
      // Create new config if doesn't exist
      config = new Config({
        key: req.params.key,
        value: value,
        updatedBy: req.user.id
      });
    } else {
      // Update existing config
      config.value = value;
      config.updatedBy = req.user.id;
      config.updatedAt = new Date();
    }
    
    await config.save();
    res.json({ 
      message: "Config updated successfully", 
      key: config.key, 
      value: config.value 
    });
  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({ message: "Error updating config", error: error.message });
  }
});

module.exports = router;

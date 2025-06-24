const express = require("express")
const userRouter = express.Router()
const User = require('../models/user')

// GET user settings
userRouter.get("/settings", async (req, res) => {
  try {
    const userId = req.auth._id;
    const user = await User.findById(userId).select('notificationSettings');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Return default settings if none exist
    const settings = user.notificationSettings || {
      milestones: true,
      automaticReturns: true
    };
    
    res.status(200).json({ 
      success: true, 
      notificationSettings: settings 
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch settings" });
  }
});

// UPDATE user settings
userRouter.put("/settings", async (req, res) => {
  try {
    const userId = req.auth._id;
    const { notificationSettings } = req.body;
    
    if (!notificationSettings) {
      return res.status(400).json({ success: false, message: "Notification settings required" });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationSettings },
      { new: true }
    ).select('notificationSettings');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Settings updated successfully",
      notificationSettings: user.notificationSettings 
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ success: false, error: "Failed to update settings" });
  }
});

module.exports = userRouter 
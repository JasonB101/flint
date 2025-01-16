const express = require("express")
const churnSettingsRouter = express.Router()
const ChurnSettings = require("../models/churnSettings")

churnSettingsRouter.post("/", async (req, res) => {
  try {
    const userId = req.auth._id
    const settings = req.body
    // console.log(settings)

    // Find and update or create new settings
    const updatedSettings = await ChurnSettings.findOneAndUpdate(
      { userId: userId },
      {
        ...settings,
        userId,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )
    // console.log(updatedSettings)

    res.status(200).json({
      success: true,
      churnSettings: updatedSettings,
    })
  } catch (err) {
    console.error("Error saving churn settings:", err)
    res.status(500).json({
      success: false,
      message: "Failed to save churn settings",
    })
  }
})

churnSettingsRouter.get("/", async (req, res) => {
  try {
    const userId = req.auth._id

    let settings = await ChurnSettings.findOne({ userId })

    if (!settings) {
      settings = new ChurnSettings({ userId })
      await settings.save()
    }

    res.json({
      success: true,
      churnSettings: settings,
    })
  } catch (err) {
    console.error("Error fetching churn settings:", err)
    res.status(500).json({
      success: false,
      message: "Failed to fetch churn settings",
    })
  }
})

module.exports = churnSettingsRouter

const express = require("express")
const notificationRouter = express.Router()
const Notification = require('../models/notification')
const Milestones = require('../models/milestones')

// GET route to fetch all notifications for a user
notificationRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    // Fetch notifications for the user, sorted by date (newest first)
    const notifications = await Notification.find({ userId: userId })
      .sort({ date: -1 })
      .limit(50) // Limit to 50 most recent notifications
    
    res.status(200).json({ success: true, notifications })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    res.status(500).json({ success: false, error: "Failed to fetch notifications" })
  }
})

// GET route to fetch unviewed notifications count
notificationRouter.get("/unviewed-count", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    const count = await Notification.countDocuments({ 
      userId: userId, 
      isViewed: false 
    })
    
    res.status(200).json({ success: true, count })
  } catch (error) {
    console.error("Error fetching unviewed count:", error)
    res.status(500).json({ success: false, error: "Failed to fetch unviewed count" })
  }
})

// GET route to fetch notification status (count + milestone info) in one call
notificationRouter.get("/status", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    // Get unviewed count
    const count = await Notification.countDocuments({ 
      userId: userId, 
      isViewed: false 
    })
    
    // Check if there are unviewed milestones (only if count > 0)
    let hasMilestones = false
    if (count > 0) {
      const milestoneCount = await Notification.countDocuments({
        userId: userId,
        isViewed: false,
        type: 'newMilestone'
      })
      hasMilestones = milestoneCount > 0
    }
    
    res.status(200).json({ 
      success: true, 
      count,
      hasMilestones
    })
  } catch (error) {
    console.error("Error fetching notification status:", error)
    res.status(500).json({ success: false, error: "Failed to fetch notification status" })
  }
})

// POST route to reset all milestone tracking (clear notifications and milestones)
notificationRouter.post("/reset-milestones", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    // Clear all notifications for this user
    const deletedNotifications = await Notification.deleteMany({ userId: userId })
    
    // Reset/clear all milestone records for this user
    const deletedMilestones = await Milestones.deleteMany({ userId: userId })
    
    console.log(`Reset milestones for user ${userId}:`)
    console.log(`- Deleted ${deletedNotifications.deletedCount} notifications`)
    console.log(`- Deleted ${deletedMilestones.deletedCount} milestone records`)
    
    res.status(200).json({ 
      success: true, 
      message: "All milestone tracking has been reset. Fresh start from now!",
      deletedNotifications: deletedNotifications.deletedCount,
      deletedMilestones: deletedMilestones.deletedCount
    })
  } catch (error) {
    console.error("Error resetting milestones:", error)
    res.status(500).json({ success: false, error: "Failed to reset milestones" })
  }
})

// PUT route to mark a notification as viewed
notificationRouter.put("/:id/viewed", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const notificationId = req.params.id
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: userId },
      { isViewed: true },
      { new: true }
    )
    
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" })
    }
    
    res.status(200).json({ success: true, notification })
  } catch (error) {
    console.error("Error marking notification as viewed:", error)
    res.status(500).json({ success: false, error: "Failed to mark notification as viewed" })
  }
})

// PUT route to mark all notifications as viewed
notificationRouter.put("/mark-all-viewed", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    await Notification.updateMany(
      { userId: userId, isViewed: false },
      { isViewed: true }
    )
    
    res.status(200).json({ success: true, message: "All notifications marked as viewed" })
  } catch (error) {
    console.error("Error marking all notifications as viewed:", error)
    res.status(500).json({ success: false, error: "Failed to mark all notifications as viewed" })
  }
})

// DELETE route to delete a notification
notificationRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const notificationId = req.params.id
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: userId
    })
    
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found" })
    }
    
    res.status(200).json({ success: true, message: "Notification deleted" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    res.status(500).json({ success: false, error: "Failed to delete notification" })
  }
})

// DELETE route to clear all notifications for a user
notificationRouter.delete("/", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    await Notification.deleteMany({ userId: userId })
    
    res.status(200).json({ success: true, message: "All notifications cleared" })
  } catch (error) {
    console.error("Error clearing notifications:", error)
    res.status(500).json({ success: false, error: "Failed to clear notifications" })
  }
})

module.exports = notificationRouter 
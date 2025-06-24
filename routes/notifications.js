const express = require("express")
const notificationRouter = express.Router()
const Notification = require('../models/notification')
const Milestones = require('../models/milestones')

// GET route to fetch unread notifications for a user
notificationRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    // Fetch only unread notifications for the user, excluding soft-deleted ones, sorted by date (newest first)
    const notifications = await Notification.find({ 
      userId: userId,
      isViewed: false, // Only unread notifications
      isDeleted: { $ne: true } // Exclude soft-deleted notifications
    })
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
      isViewed: false,
      isDeleted: { $ne: true } // Exclude soft-deleted notifications
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
    
    // Get unviewed count (excluding soft-deleted)
    const count = await Notification.countDocuments({ 
      userId: userId, 
      isViewed: false,
      isDeleted: { $ne: true } // Exclude soft-deleted notifications
    })
    
    // Check if there are unviewed milestones (only if count > 0)
    let hasMilestones = false
    if (count > 0) {
      const milestoneCount = await Notification.countDocuments({
        userId: userId,
        isViewed: false,
        isDeleted: { $ne: true }, // Exclude soft-deleted notifications
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
      { 
        userId: userId, 
        isViewed: false,
        isDeleted: { $ne: true } // Only mark non-deleted notifications as viewed
      },
      { isViewed: true }
    )
    
    res.status(200).json({ success: true, message: "All notifications marked as viewed" })
  } catch (error) {
    console.error("Error marking all notifications as viewed:", error)
    res.status(500).json({ success: false, error: "Failed to mark all notifications as viewed" })
  }
})

// DELETE route to soft delete a notification (keeps record to prevent recreation)
notificationRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const notificationId = req.params.id
    
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: userId,
        isDeleted: { $ne: true } // Only soft delete if not already deleted
      },
      {
        isDeleted: true
      },
      { new: true }
    )
    
    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found or already deleted" })
    }
    
    res.status(200).json({ success: true, message: "Notification deleted" })
  } catch (error) {
    console.error("Error deleting notification:", error)
    res.status(500).json({ success: false, error: "Failed to delete notification" })
  }
})

// DELETE route to clear all notifications for a user (soft delete)
notificationRouter.delete("/", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    await Notification.updateMany(
      { 
        userId: userId,
        isDeleted: { $ne: true }
      },
      {
        isDeleted: true
      }
    )
    
    res.status(200).json({ success: true, message: "All notifications cleared" })
  } catch (error) {
    console.error("Error clearing notifications:", error)
    res.status(500).json({ success: false, error: "Failed to clear notifications" })
  }
})

// DELETE route to permanently remove notifications older than 30 days (cleanup job)
notificationRouter.delete("/cleanup", async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Only delete notifications that are either:
    // 1. Soft deleted (regardless of when)
    // 2. Regular notifications older than 30 days
    const result = await Notification.deleteMany({
      $or: [
        {
          isDeleted: true
        },
        {
          date: { $lt: thirtyDaysAgo }
        }
      ]
    })
    
    console.log(`Cleanup: Permanently deleted ${result.deletedCount} notifications older than 30 days`)
    
    res.status(200).json({ 
      success: true, 
      message: `Cleanup completed: ${result.deletedCount} notifications permanently removed`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error("Error during cleanup:", error)
    res.status(500).json({ success: false, error: "Failed to perform cleanup" })
  }
})

module.exports = notificationRouter 
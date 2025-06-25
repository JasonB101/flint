const express = require("express")
const returnRouter = express.Router()
const Return = require('../models/return')
const InventoryItem = require('../models/inventoryItem')
const { 
  getReturnsForItem, 
  getReturnByEbayId, 
  getReturnStats,
  getUnprocessedReturns
} = require('../lib/returnService')

// GET route to fetch returns for a specific inventory item
returnRouter.get("/item/:itemId", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const { itemId } = req.params
    
    const returns = await getReturnsForItem(itemId, userId)
    
    res.status(200).json({ 
      success: true, 
      returns,
      count: returns.length
    })
  } catch (error) {
    console.error("Error fetching returns for item:", error)
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch returns for item" 
    })
  }
})

// GET route to fetch a specific return by eBay return ID
returnRouter.get("/ebay/:ebayReturnId", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const { ebayReturnId } = req.params
    
    const returnRecord = await getReturnByEbayId(ebayReturnId, userId)
    
    if (!returnRecord) {
      return res.status(404).json({ 
        success: false, 
        error: "Return not found" 
      })
    }
    
    res.status(200).json({ 
      success: true, 
      returnRecord 
    })
  } catch (error) {
    console.error("Error fetching return by eBay ID:", error)
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch return" 
    })
  }
})

// GET route to fetch return statistics for user
returnRouter.get("/stats", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    const stats = await getReturnStats(userId)
    
    res.status(200).json({ 
      success: true, 
      stats 
    })
  } catch (error) {
    console.error("Error fetching return stats:", error)
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch return statistics" 
    })
  }
})

// GET route to fetch paginated returns with optional filtering
returnRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const { 
      page = 1, 
      limit = 50, 
      status, 
      reason,
      trackingStatus,
      startDate,
      endDate 
    } = req.query
    
    // Build filter object
    const filter = { userId }
    
    if (status) filter.returnStatus = status
    if (reason) filter.returnReason = reason
    if (trackingStatus) filter.trackingStatus = trackingStatus
    
    if (startDate || endDate) {
      filter.creationDate = {}
      if (startDate) filter.creationDate.$gte = new Date(startDate)
      if (endDate) filter.creationDate.$lte = new Date(endDate)
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [returns, total] = await Promise.all([
      Return.find(filter)
        .populate('inventoryItemId', 'title sku partNo datePurchased dateSold purchasePrice priceSold profit expectedProfit shippingCost ebayFees additionalCosts buyer listed status')
        .sort({ creationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Return.countDocuments(filter)
    ])
    
    res.status(200).json({ 
      success: true, 
      returns,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReturns: total,
        hasNext: skip + returns.length < total,
        hasPrev: parseInt(page) > 1
      }
    })
  } catch (error) {
    console.error("Error fetching returns:", error)
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch returns" 
    })
  }
})

// GET route to fetch unprocessed returns for user
returnRouter.get("/unprocessed", async (req, res, next) => {
  try {
    const userId = req.auth._id
    
    const unprocessedReturns = await getUnprocessedReturns(userId)
    
    // Create a map for easier frontend lookup
    const unprocessedReturnsMap = {}
    unprocessedReturns.forEach(returnItem => {
      unprocessedReturnsMap[returnItem.ebayReturnId] = {
        processingStatus: returnItem.processingStatus,
        missingIndicators: returnItem.processingStatus.missingIndicators,
        issues: returnItem.processingStatus.issues
      }
    })
    
    res.status(200).json({ 
      success: true, 
      unprocessedReturns,
      unprocessedReturnsMap,
      count: unprocessedReturns.length
    })
  } catch (error) {
    console.error("Error fetching unprocessed returns:", error)
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch unprocessed returns" 
    })
  }
})

// GET route to fetch returns by SKU
returnRouter.get("/sku/:sku", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const { sku } = req.params
    
    // Find inventory item by SKU first
    const inventoryItem = await InventoryItem.findOne({ sku, userId })
    if (!inventoryItem) {
      return res.status(404).json({ 
        success: false, 
        error: "Inventory item not found for this SKU" 
      })
    }
    
    // Find returns for this inventory item
    const returns = await Return.find({ 
      inventoryItemId: inventoryItem._id,
      userId 
    }).sort({ creationDate: -1 })
    
    res.status(200).json({ 
      success: true, 
      returns,
      count: returns.length
    })
  } catch (error) {
    console.error("Error fetching returns by SKU:", error)
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch returns by SKU" 
    })
  }
})

// GET route to fetch returns by order ID
returnRouter.get("/order/:orderId", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const { orderId } = req.params
    
    // Search returns by order ID
    const returns = await Return.find({ 
      orderId, 
      userId 
    }).sort({ creationDate: -1 })
    
    res.status(200).json({ 
      success: true, 
      returns,
      count: returns.length
    })
  } catch (error) {
    console.error("Error fetching returns by order ID:", error)
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch returns by order ID" 
    })
  }
})

// POST route to test return delivery notification (for testing only)
returnRouter.post("/test-delivery-notification", async (req, res, next) => {
  try {
    const userId = req.auth._id
    const { ebayReturnId } = req.body
    
    if (!ebayReturnId) {
      return res.status(400).json({ 
        success: false, 
        error: "ebayReturnId is required" 
      })
    }
    
    // Find the return
    const returnRecord = await Return.findOne({ 
      ebayReturnId, 
      userId 
    }).populate('inventoryItemId', 'title sku')
    
    if (!returnRecord) {
      return res.status(404).json({ 
        success: false, 
        error: "Return not found" 
      })
    }
    
    // Simulate delivery by updating tracking status
    returnRecord.trackingStatus = 'DELIVERED'
    returnRecord.deliveryDate = new Date()
    await returnRecord.save()
    
    // Manually trigger notification creation
    const { createReturnDeliveredNotification } = require('../lib/returnService')
    
    // Import the notification function directly since it's not exported
    const Notification = require('../models/notification')
    const User = require('../models/user')
    
    // Check user's notification settings
    const user = await User.findById(userId).select('notificationSettings')
    const notificationSettings = user?.notificationSettings || { automaticReturns: true }
    
    if (notificationSettings.automaticReturns) {
      // Check if notification already exists
      const existingNotification = await Notification.findOne({
        userId: userId,
        type: 'returnDelivered',
        'data.ebayReturnId': returnRecord.ebayReturnId,
        isDeleted: { $ne: true }
      })
      
      if (!existingNotification) {
        // Create notification
        const notification = new Notification({
          userId: userId,
          data: {
            ebayReturnId: returnRecord.ebayReturnId,
            itemTitle: returnRecord.inventoryItemId.title,
            itemSku: returnRecord.inventoryItemId.sku,
            trackingNumber: returnRecord.trackingNumber,
            carrierUsed: returnRecord.carrierUsed,
            deliveryDate: returnRecord.deliveryDate,
            orderId: returnRecord.orderId,
            message: `Return delivered for ${returnRecord.inventoryItemId.title} (SKU: ${returnRecord.inventoryItemId.sku})`
          },
          type: 'returnDelivered',
          isViewed: false,
        })
        
        await notification.save()
        
        res.status(200).json({ 
          success: true, 
          message: "Test notification created successfully",
          notification,
          returnRecord
        })
      } else {
        res.status(200).json({ 
          success: true, 
          message: "Notification already exists",
          existingNotification,
          returnRecord
        })
      }
    } else {
      res.status(200).json({ 
        success: true, 
        message: "Notification skipped - disabled in user settings",
        returnRecord
      })
    }
    
  } catch (error) {
    console.error("Error creating test notification:", error)
    res.status(500).json({ 
      success: false, 
      error: "Failed to create test notification" 
    })
  }
})

module.exports = returnRouter 
const express = require("express")
const ebayRouter = express.Router()
const User = require("../models/user")
const InventoryItem = require("../models/inventoryItem")
const Fitment = require("../models/fitment")
const findEbayListings = require("../lib/ebayMethods/findEbayListings")
const { updateSellerAvgShipping } = require("../lib/userMethods")
const {
  getEbayListings,
  getShippingTransactions,
  getListing,
} = require("../lib/ebayMethods/ebayApi")
const { getOAuthLink, refreshAccessToken } = require("../lib/oAuth")
const {
  updateInventoryWithSales,
  getInventoryItems,
  updateAllZeroShippingCost,
  figureExpectedProfit,
  verifyCorrectInfoInInventoryItems,
} = require("../lib/inventoryMethods")
const getCompletedSales = require("../lib/ebayMethods/getCompletedSales")
const findCompatibilityList = require("../lib/ebayMethods/findCompatibilityList")
const SocketProgressEmitter = require("../lib/socketProgressEmitter")

// GET EBAY NOW COMPLETES SALES, AND RETURNS NEW UPDATED ITEMS.
// NEED TO HANDLE MULTIPLE QUANTITIES, use await between each itemUpdate. use InventoryItem.find() instead of findOne.
//Sort array based on the purchase date. Update the first item in the array, on the next iteration that item will now be
//set as "Sold" ;) Goodluck, ima play a video game :P Need to think about how to filter between transactions that have been recorded
//already. There may be more in inventory and the same part is counted more than once. Save the transaction ID to the item
//so when you retrieve transactions to merge, you filter the list by which transactions have not been merged.

ebayRouter.get("/getactivelistings", async (req, res, next) => {
  try {
    const { keyword } = req.query

    if (!keyword) {
      return res.status(400).json({ error: "Missing keyword parameter" })
    }

    const simplifiedItems = await findEbayListings(keyword)

    res.json(simplifiedItems)
  } catch (error) {
    console.error("Error in /getactivelistings route:", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
})

ebayRouter.get("/getShippingLabels", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const { ebayOAuthToken } = userObject
  try {
    const shippingTransactions = await getShippingTransactions(ebayOAuthToken)
    if (shippingTransactions.failedOAuth) {
      throw new Error("Need to Update OAuth")
    }
    res.send({
      success: true,
      shippingLabels: shippingTransactions.transactions,
    })
  } catch (e) {
    console.log(e)
    res
      .status(500)
      .send({ success: false, message: e.message, shippingLabels: [] })
  }
})

ebayRouter.get("/getCompatibility", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const partNumber = req.query.partNumber
  // Check database for existing fitment data
  const fitment = await Fitment.findOne({ partNumber: partNumber })
  if (fitment) {
    return res.send({
      success: true,
      compatibility: fitment.compatibilityList,
    })
  }

  const { ebayToken } = userObject
  const listingBatchLimit = 10 // Prevents doing too many calls to eBay

  try {
    // Get item IDs from query or body
    let itemIds = req.query.itemIds?.split(",") || [] // Assuming item IDs are passed as a comma-separated string
    itemIds = itemIds.splice(0, listingBatchLimit * 5) // Limit total number of items to process

    // Validate that there are item IDs to process
    if (itemIds.length === 0) {
      throw new Error("No item IDs provided")
    }

    let compatibilityList = [] // Accumulate compatibility results

    // Fetch compatibility data from eBay in batches
    while (itemIds.length > 0) {
      const currentBatch = itemIds.splice(0, listingBatchLimit) // Take a batch of IDs
      const batchCompatibility = await findCompatibilityList(
        currentBatch,
        ebayToken
      )

      if (batchCompatibility.length > 0) {
        compatibilityList = compatibilityList.concat(batchCompatibility) // Accumulate results
      }

      // Stop if we've gathered enough results
      if (compatibilityList.length >= 4) {
        break
      }
    }

    // Send the accumulated results or indicate no compatibility found
    if (compatibilityList.length > 0) {
      res.send({ success: true, compatibility: compatibilityList })
    } else {
      res.send({
        success: true,
        compatibility: [],
        message: "No compatible items found",
      })
    }
  } catch (e) {
    console.error(e)
    res
      .status(500)
      .send({ success: false, message: e.message, compatibility: [] })
  }
})

// Track active syncs to prevent concurrent syncs
const activeSync = new Set()

// Legacy sync status endpoint (for backward compatibility during transition)
ebayRouter.get("/sync-status", async (req, res) => {
  try {
    const userId = req.auth._id
    const isActive = activeSync.has(userId)
    res.json({ 
      active: isActive,
      userId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ 
      active: false, 
      error: error.message 
    })
  }
})

ebayRouter.get("/getebay", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const {
    _id: userId,
    averageShippingCost,
    ebayToken: ebayAuthToken,
    ebayOAuthToken = "0",
    ebayRefreshOAuthToken,
    ebayFeePercent,
  } = userObject

  // Check if sync already in progress
  if (activeSync.has(userId)) {
    return res.status(409).send({ 
      success: false, 
      message: "Sync already in progress" 
    })
  }

  // Set request timeout (2 minutes)
  const SYNC_TIMEOUT = 120000
  req.setTimeout(SYNC_TIMEOUT, () => {
    console.log(`[${userId}] Sync timeout`)
    activeSync.delete(userId)
    if (!res.headersSent) {
      res.status(408).send({ success: false, message: "Sync timeout" })
    }
  })

  // Initialize WebSocket progress emitter
  const io = req.app.get('io')
  const progress = new SocketProgressEmitter(io, userId)

  // Track what succeeded vs failed
  const syncResults = {
    shipping: { success: false, error: null },
    sales: { success: false, error: null },
    listings: { success: false, error: null },
    verification: { success: false, error: null }
  }

  try {
    activeSync.add(userId)
    progress.starting()
    console.log(`[${userId}] Starting eBay sync`)
    
    // Step 1: Get shipping transactions (most critical)
    let shippingTransactions = []
    let refreshedOAuthToken = ebayOAuthToken
    
    try {
      progress.fetchingShipping()
      const shippingResult = await getShippingTransactions(refreshedOAuthToken)
      if (shippingResult.failedOAuth) throw new Error("OAuth expired")
      shippingTransactions = shippingResult.transactions
      syncResults.shipping.success = true
      progress.fetchingShipping(shippingTransactions.length)
      console.log(`[${userId}] ✅ Shipping: ${shippingTransactions.length} transactions`)
    } catch (error) {
      syncResults.shipping.error = error.message
      console.log(`[${userId}] ❌ Shipping failed: ${error.message}`)
      
      if (error.message.includes("OAuth")) {
        // Attempt automatic token refresh within the same sync
        try {
          progress.emit('refreshing token', 10, 'Refreshing access token...')
          console.log(`[${userId}] 🔄 Attempting OAuth token refresh`)
          
          const { refreshAccessToken } = require("../lib/oAuth")
          const newTokenResult = await refreshAccessToken(ebayRefreshOAuthToken)
          
          if (!newTokenResult.success) {
            throw new Error("Token refresh failed")
          }
          
          refreshedOAuthToken = newTokenResult.token
          
          // Update user's token in database
          await User.findOneAndUpdate(
            { _id: userId },
            { ebayOAuthToken: refreshedOAuthToken }
          )
          
          console.log(`[${userId}] ✅ OAuth token refreshed successfully`)
          progress.fetchingShipping()
          
          // Retry shipping transactions with new token
          const retryShippingResult = await getShippingTransactions(refreshedOAuthToken)
          if (retryShippingResult.failedOAuth) {
            throw new Error("OAuth still expired after refresh")
          }
          
          shippingTransactions = retryShippingResult.transactions
          syncResults.shipping.success = true
          progress.fetchingShipping(shippingTransactions.length)
          console.log(`[${userId}] ✅ Shipping (after refresh): ${shippingTransactions.length} transactions`)
          
        } catch (refreshError) {
          console.log(`[${userId}] ❌ OAuth refresh failed: ${refreshError.message}`)
          activeSync.delete(userId)
          progress.complete(false, "Access Token Expired - Please Re-authenticate")
          return res.status(402).send({ success: false, message: "Access Token Expired" })
        }
      }
      // Continue without shipping data if non-OAuth error
    }

    // Step 2: Parallel operations with individual error handling
    progress.fetchingEbayData()
    let shippingUpdates, completedSales, ebayListings
    
    try {
      const results = await Promise.allSettled([
        updateAllZeroShippingCost(userId, shippingTransactions),
        getCompletedSales(refreshedOAuthToken),
        getEbayListings(ebayAuthToken, userId),
      ])
      
      shippingUpdates = results[0].status === 'fulfilled' ? results[0].value : null
      completedSales = results[1].status === 'fulfilled' ? results[1].value : []
      ebayListings = results[2].status === 'fulfilled' ? results[2].value : []
      
      // Log individual results with progress updates
      if (results[0].status === 'rejected') {
        console.log(`[${userId}] ❌ Shipping updates failed: ${results[0].reason?.message}`)
      }
      if (results[1].status === 'rejected') {
        console.log(`[${userId}] ❌ Completed sales failed: ${results[1].reason?.message}`)
        syncResults.sales.error = results[1].reason?.message
      } else {
        progress.fetchingSales(completedSales.length)
        console.log(`[${userId}] ✅ Sales: ${completedSales.length} completed`)
        syncResults.sales.success = true
      }
      if (results[2].status === 'rejected') {
        console.log(`[${userId}] ❌ eBay listings failed: ${results[2].reason?.message}`)
        syncResults.listings.error = results[2].reason?.message
      } else {
        progress.fetchingListings()
        console.log(`[${userId}] ✅ Listings: ${ebayListings.length} active`)
        syncResults.listings.success = true
      }
      
    } catch (error) {
      console.log(`[${userId}] ❌ Parallel operations error: ${error.message}`)
      // Continue with whatever data we got
      completedSales = []
      ebayListings = []
    }

    // Step 3: Inventory processing with safety checks
    progress.processingInventory()
    let inventoryItems = await getInventoryItems(userId, false)
    const inventoryItemsMap = new Map(inventoryItems.map((item) => [item.sku, item]))
    
    let newSoldItems = []
    if (completedSales.length > 0) {
      try {
        newSoldItems = await updateInventoryWithSales(
          userId, completedSales, inventoryItemsMap, 
          shippingTransactions, ebayFeePercent
        )
        progress.processingInventory(newSoldItems.length)
        console.log(`[${userId}] ✅ Updated ${newSoldItems.length} sold items`)
        
        if (newSoldItems.length > 0) {
          updateSellerAvgShipping(userId)
          newSoldItems.forEach((item) => inventoryItemsMap.set(item.sku, item))
        }
      } catch (error) {
        syncResults.sales.error = error.message
        console.log(`[${userId}] ❌ Sales update failed: ${error.message}`)
        // Continue without sales updates - not fatal
      }
    }

    // Step 4: Verification (non-critical)
    progress.verifyingData()
    let verifiedCorrectInfo = false
    try {
      verifiedCorrectInfo = await verifyCorrectInfoInInventoryItems(
        inventoryItemsMap, ebayListings, averageShippingCost, ebayFeePercent
      )
      syncResults.verification.success = true
      console.log(`[${userId}] ✅ Verification complete`)
    } catch (error) {
      syncResults.verification.error = error.message
      console.log(`[${userId}] ❌ Verification failed: ${error.message}`)
      // Continue without verification - not fatal
    }

    // Final data refresh if anything changed
    progress.finalizing()
    if (verifiedCorrectInfo || newSoldItems.length > 0) {
      inventoryItems = await getInventoryItems(userId)
    }

    console.log(`[${userId}] Sync completed successfully`)
    activeSync.delete(userId)
    
    const response = {
      ebayListings: ebayListings || [],
      inventoryItems,
      syncResults,
      timestamp: new Date().toISOString()
    }
    
    progress.complete(true, null, response)
    res.send(response)

  } catch (error) {
    console.error(`[${userId}] Sync error:`, error.message)
    activeSync.delete(userId)
    progress.complete(false, error.message)
    
    if (!res.headersSent) {
      res.status(500).send({ 
        success: false, 
        message: "Sync partially failed", 
        syncResults,
        error: error.message 
      })
    }
  }
})

ebayRouter.post("/refreshOToken", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const { _id: userId, ebayRefreshOAuthToken } = userObject

  try {
    const newToken = await refreshAccessToken(ebayRefreshOAuthToken)
    const { success, token } = newToken
    if (!success) throw Error("Refresh Failed")
    console.log("Successfully fetched Access Token")
    User.findOneAndUpdate(
      { _id: userId },
      { ebayOAuthToken: token },
      (err, result) => {
        if (err) console.log(err.message)
      }
    )
    res.status(200).send({ success: true })
  } catch (e) {
    res.status(401).send({ link: getOAuthLink() })
    console.log(e.message, "Refresh OAUTH Error: Sending Link")
  }
})

ebayRouter.put("/linkItem/:id", async (req, res, next) => {
  const { ItemID, BuyItNowPrice, SKU } = req.body
  const { _id: userId, averageShippingCost, ebayFeePercent } = req.user
  console.log(req.body)
  const item = await InventoryItem.findById(req.params.id)
  const purchasePrice = item.toObject().purchasePrice

  const updatedInfo = {
    listed: true,
    ebayId: ItemID,
    listedPrice: BuyItNowPrice,
    expectedProfit: figureExpectedProfit(
      BuyItNowPrice,
      purchasePrice,
      [], //additionalCosts
      averageShippingCost,
      ebayFeePercent
    ),
    userId: req.auth._id,
  }
  InventoryItem.findByIdAndUpdate(
    req.params.id,
    updatedInfo,
    { new: true },
    (err, updatedItem) => {
      if (err) {
        console.log(err)
        return res.status(500).send({ success: false, error: err })
      }
      res.send({ success: true, updatedItem })
    }
  )
})

ebayRouter.get("/getListing/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params

    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, message: "Item ID is required" })
    }

    const userObject = await getUserObject(req.auth._id)
    const { ebayToken: ebayAuthToken } = userObject

    const listingResponse = await getListing(ebayAuthToken, itemId)
    // console.log("Listing Response:", listingResponse)

    if (!listingResponse.success) {
      return res.status(404).json({
        success: false,
        message: listingResponse.message || "Failed to retrieve listing",
      })
    }

    res.json({
      success: true,
      listing: listingResponse.data,
    })
  } catch (error) {
    console.error("Error fetching listing:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching listing details",
    })
  }
})

async function getUserObject(userId) {
  const userInfo = await User.findById(userId)
  return userInfo.toObject()
}

module.exports = ebayRouter

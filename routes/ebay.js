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
const {
  searchReturns,
  getReturnDetails,
  getReturnTracking,
  searchCancellations,
  getCancellationDetails,
  syncReturnsWithInventory
} = require("../lib/ebayMethods/postOrderApi")
const {
  createOrUpdateReturn,
  getReturnsForItem,
  updateInventoryItemReturnFlags,
  autoProcessOrUpdateReturn
} = require("../lib/returnService")
const { getOAuthLink, refreshAccessToken } = require("../lib/oAuth")
const {
  updateInventoryWithSales,
  getInventoryItems,
  updateAllZeroShippingCost,
  figureExpectedProfit,
  verifyCorrectInfoInInventoryItems,
  processCancellations,
} = require("../lib/inventoryMethods")
const getCompletedSales = require("../lib/ebayMethods/getCompletedSales")
const findCompatibilityList = require("../lib/ebayMethods/findCompatibilityList")
const SocketProgressEmitter = require("../lib/socketProgressEmitter")
const Return = require("../models/return")

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
    let shippingUpdates, completedSales, ebayListings, returnData, cancellationData
    
    try {
      // Calculate date range for returns and cancellations (last 6 months for returns, 12 months for cancellations)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      
      const dateFilter = {
        creation_date_range_from: twelveMonthsAgo.toISOString(),
        creation_date_range_to: new Date().toISOString(),
        limit: '200'
      }
      
      // Return search for last 6 months (more focused)
      const returnDateFilter = {
        creation_date_range_from: sixMonthsAgo.toISOString(),
        creation_date_range_to: new Date().toISOString(),
        limit: '200'
        // Don't specify return_status to get all returns
      }
      
              const results = await Promise.allSettled([
          updateAllZeroShippingCost(userId, shippingTransactions),
          getCompletedSales(refreshedOAuthToken),
          getEbayListings(ebayAuthToken, userId),
          searchReturns(refreshedOAuthToken, returnDateFilter),
          searchCancellations(refreshedOAuthToken, dateFilter),
        ])
      
      shippingUpdates = results[0].status === 'fulfilled' ? results[0].value : null
      completedSales = results[1].status === 'fulfilled' ? results[1].value : []
      ebayListings = results[2].status === 'fulfilled' ? results[2].value : []
      returnData = results[3].status === 'fulfilled' ? results[3].value : { returns: [], success: false }
      cancellationData = results[4].status === 'fulfilled' ? results[4].value : { cancellations: [], success: false }
      
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
      if (results[3].status === 'rejected') {
        console.log(`[${userId}] ❌ Returns data failed: ${results[3].reason?.message}`)
        syncResults.returns = { success: false, error: results[3].reason?.message }
      } else {
        console.log(`[${userId}] ✅ Returns: ${returnData.returns?.length || 0} found`)
        syncResults.returns = { success: returnData.success, count: returnData.returns?.length || 0 }
      }
      if (results[4].status === 'rejected') {
        console.log(`[${userId}] ❌ Cancellations data failed: ${results[4].reason?.message}`)
        syncResults.cancellations = { success: false, error: results[4].reason?.message }
      } else {
        console.log(`[${userId}] ✅ Cancellations: ${cancellationData.cancellations?.length || 0} found`)
        syncResults.cancellations = { success: cancellationData.success, count: cancellationData.cancellations?.length || 0 }
      }
      
    } catch (error) {
      console.log(`[${userId}] ❌ Parallel operations error: ${error.message}`)
      // Continue with whatever data we got
      completedSales = []
      ebayListings = []
      returnData = { returns: [], success: false }
      cancellationData = { cancellations: [], success: false }
    }

    // Step 3: Inventory processing with safety checks
    progress.processingInventory()
    let inventoryItems = await getInventoryItems(userId, false)
    const inventoryItemsMap = new Map(inventoryItems.map((item) => [item.sku, item]))
    
    // Step 3.1: Process cancellations FIRST (before sales)
    if (cancellationData.success && cancellationData.cancellations.length > 0) {
      try {
        progress.emit('processing cancellations', 50, 'Processing order cancellations...')
        const cancellationResults = await processCancellations(
          cancellationData.cancellations,
          inventoryItemsMap
        )
        
        console.log(`[${userId}] ✅ Processed cancellations: ${cancellationResults.reverted} reverted, ${cancellationResults.processed} processed`)
        syncResults.cancellations = { 
          success: true, 
          ...cancellationResults 
        }
      } catch (error) {
        console.log(`[${userId}] ❌ Cancellation processing failed: ${error.message}`)
        syncResults.cancellations = { success: false, error: error.message }
      }
    }
    
    // Step 3.2: Process sales AFTER cancellations
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

    // Step 3.5: Sync Post-Order API data with new Return collection
    if (returnData.success && returnData.returns.length > 0) {
      try {
        progress.emit('syncing returns', 60, 'Syncing return data...')
        
        let returnsSynced = 0
        let returnsCreated = 0
        let returnsUpdated = 0
        
        // --- NEW: Pre-filter out closed returns ---
        const closedReturnsArr = await Return.find({ userId, returnStatus: 'CLOSED' }).select('ebayReturnId orderId')
        const closedReturnIds = new Set(closedReturnsArr.map(r => r.ebayReturnId))
        const closedOrderIds = new Set(closedReturnsArr.map(r => r.orderId))
        const returnsToProcess = returnData.returns.filter(r =>
          !closedReturnIds.has(r.returnId) && (!r.orderId || !closedOrderIds.has(r.orderId))
        )
        // --- END NEW ---
        
        // Process each return and store in dedicated Return collection
        let processedReturns = []
        for (const rawReturnData of returnsToProcess) {
          try {
            // Find matching inventory item - rawReturnData is from search API (flat structure)
            const normalizedReturn = {
              orderId: rawReturnData.orderId,  // Direct property from search API
              sku: rawReturnData.creationInfo?.item?.sku,  // From creationInfo in search API
              itemId: rawReturnData.creationInfo?.item?.itemId  // From creationInfo in search API
            }
            
            let matchedItem = null
            if (normalizedReturn.sku) {
              matchedItem = inventoryItemsMap.get(normalizedReturn.sku)
            }
            if (!matchedItem && normalizedReturn.itemId) {
              matchedItem = Array.from(inventoryItemsMap.values()).find(item => item.ebayId === normalizedReturn.itemId)
            }
            
            if (matchedItem) {
              // === NEW: Fetch detail API for each return ===
              let detail = null;
              try {
                const detailResp = await getReturnDetails(refreshedOAuthToken, rawReturnData.returnId);
                if (detailResp && detailResp.success && detailResp.returnData) {
                  detail = detailResp.returnData.detail;
                }
              } catch (e) {
                console.log(`⚠️ Could not fetch detail for return ${rawReturnData.returnId}: ${e.message}`);
              }
              const structuredReturnData = {
                summary: rawReturnData,
                detail: detail
              };
              // Create or update return record in dedicated collection
              const returnRecord = await createOrUpdateReturn(structuredReturnData, matchedItem._id, userId)
              
              // Update basic return info in inventory item
              const basicReturnInfo = {
                returnDate: returnRecord.creationDate ? returnRecord.creationDate.toLocaleDateString() : undefined,
                returnDeliveredDate: returnRecord.deliveryDate ? returnRecord.deliveryDate.toLocaleDateString() : undefined
              }
              
              // Remove undefined values
              Object.keys(basicReturnInfo).forEach(key => {
                if (basicReturnInfo[key] === undefined) {
                  delete basicReturnInfo[key]
                }
              })
              
              if (Object.keys(basicReturnInfo).length > 0) {
                await InventoryItem.findByIdAndUpdate(matchedItem._id, basicReturnInfo)
                Object.assign(matchedItem, basicReturnInfo)
              }
              
              returnsSynced++
              if (returnRecord.createdAt && returnRecord.updatedAt && 
                  returnRecord.createdAt.getTime() === returnRecord.updatedAt.getTime()) {
                returnsCreated++
              } else {
                returnsUpdated++
              }
              
              processedReturns.push({ sku: matchedItem?.sku || normalizedReturn.sku || '', returnStatus: (returnRecord?.returnStatus || '').toUpperCase() });
            } else {
              console.log(`⚠️ No inventory match for return: ${rawReturnData.returnId} (SKU: ${normalizedReturn.sku}, ItemID: ${normalizedReturn.itemId})`)
            }
          } catch (returnError) {
            console.error(`❌ Error processing individual return:`, returnError.message)
          }
        }
        
        if (processedReturns.length > 0) {
          console.table(processedReturns, ['sku', 'returnStatus']);
        }
        
        syncResults.returnSync = { 
          success: true, 
          synced: returnsSynced,
          created: returnsCreated,
          updated: returnsUpdated,
          total: returnData.returns.length
        }
        
      } catch (error) {
        console.log(`[${userId}] ❌ Return sync failed: ${error.message}`)
        syncResults.returnSync = { success: false, error: error.message }
      }
    }

    // Cancellation processing moved to Step 3.1 (before sales)

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

// Get detailed return information for an item
ebayRouter.get("/getReturnDetails/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params
    
    if (!req.auth?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }
    
    console.log(`🔍 Getting return details for item ${itemId}, user ${req.auth._id}`)
    
    let userObject
    let ebayOAuthToken
    
    try {
      userObject = await getUserObject(req.auth._id)
      ebayOAuthToken = userObject.ebayOAuthToken
    } catch (userError) {
      console.error(`❌ User lookup failed for ID ${req.auth._id}:`, userError.message)
      return res.status(401).json({
        success: false,
        message: "User authentication invalid. Please log in again.",
        needsReauth: true
      })
    }
    
    if (!ebayOAuthToken) {
      console.warn(`⚠️ No eBay OAuth token found for user ${req.auth._id}`)
      return res.status(401).json({
        success: false,
        message: "eBay authentication required"
      })
    }

    // Get the inventory item to find the return ID
    const inventoryItem = await InventoryItem.findById(itemId)
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      })
    }

    let returnDetails = null
    let trackingDetails = null

    // If we have an eBay return ID, get detailed return information
    if (inventoryItem.ebayReturnId) {
      console.log(`🔍 Found stored return ID: ${inventoryItem.ebayReturnId}`)
      const returnResponse = await getReturnDetails(ebayOAuthToken, inventoryItem.ebayReturnId)
      
      if (returnResponse.success) {
        returnDetails = returnResponse.returnData
        console.log(`✅ Retrieved return details for stored return ID`)
        console.log(`📋 Return data structure:`)
        console.log(`📋 Summary:`, JSON.stringify(returnDetails.summary, null, 2))
        console.log(`📋 Detail:`, JSON.stringify(returnDetails.detail, null, 2))
        
        // If we have tracking info, get detailed tracking
        if (inventoryItem.ebayTrackingNumber && inventoryItem.ebayCarrierUsed) {
          const trackingResponse = await getReturnTracking(
            ebayOAuthToken, 
            inventoryItem.ebayReturnId,
            inventoryItem.ebayCarrierUsed,
            inventoryItem.ebayTrackingNumber
          )
          
          if (trackingResponse.success) {
            trackingDetails = trackingResponse.trackingData
          }
        }
      } else if (returnResponse.failedOAuth) {
        return res.status(401).json({
          success: false,
          message: "eBay authentication expired"
        })
      }
    } else {
      // No stored return ID - search for returns that might match this item
      console.log(`🔍 No stored return ID found, searching for returns for order: ${inventoryItem.orderId}`)
      
      try {
        // Search for recent returns (last 90 days)
        const searchFilters = {
          creation_date_range_from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          limit: '200'
        }
        
        const searchResult = await searchReturns(ebayOAuthToken, searchFilters)
        
        if (searchResult.success && searchResult.returns.length > 0) {
          console.log(`📊 Found ${searchResult.returns.length} recent returns, checking for matches`)
          
          // Look for returns that match this item's order ID, SKU, or eBay ID
          const matchingReturn = searchResult.returns.find(returnItem => {
            const orderMatch = returnItem.orderId === inventoryItem.orderId
            const skuMatch = returnItem.lineItems && returnItem.lineItems.some(lineItem => 
              lineItem.itemId === inventoryItem.ebayId || 
              lineItem.lineItemId === inventoryItem.sku
            )
            return orderMatch || skuMatch
          })
          
          if (matchingReturn) {
            console.log(`✅ Found matching return for this item:`, {
              returnId: matchingReturn.returnId,
              orderId: matchingReturn.orderId,
              creationDate: matchingReturn.creationDate
            })
            
            // Get detailed return information and store in Return collection
            const returnResponse = await getReturnDetails(ebayOAuthToken, matchingReturn.returnId)
            if (returnResponse.success) {
              returnDetails = returnResponse.returnData
              
              // Store in dedicated Return collection
              await createOrUpdateReturn(returnDetails, itemId, req.auth._id)
              
              console.log(`✅ Retrieved and stored detailed return information`)
              console.log(`📋 Return data structure:`)
              console.log(`📋 Summary:`, JSON.stringify(returnDetails.summary, null, 2))
              console.log(`📋 Detail:`, JSON.stringify(returnDetails.detail, null, 2))
            }
          } else {
            console.log(`⚠️ No matching return found among ${searchResult.returns.length} returns`)
          }
        } else {
          console.log(`⚠️ No returns found in search result`)
        }
      } catch (searchError) {
        console.error("Error searching for returns:", searchError.message)
      }
    }

    res.json({
      success: true,
      inventoryItem: inventoryItem.toObject(),
      returnDetails,
      trackingDetails,
      hasEbayData: !!inventoryItem.ebayReturnId
    })

  } catch (error) {
    console.error("Error fetching return details:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching return details"
    })
  }
})

// Get return tracking information
ebayRouter.get("/getReturnTracking/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params
    
    if (!req.auth?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      })
    }
    
    console.log(`📦 Getting return tracking for item ${itemId}, user ${req.auth._id}`)
    
    let userObject
    let ebayOAuthToken
    
    try {
      userObject = await getUserObject(req.auth._id)
      ebayOAuthToken = userObject.ebayOAuthToken
    } catch (userError) {
      console.error(`❌ User lookup failed for tracking request, ID ${req.auth._id}:`, userError.message)
      return res.status(401).json({
        success: false,
        message: "User authentication invalid. Please log in again.",
        needsReauth: true
      })
    }
    
    if (!ebayOAuthToken) {
      console.warn(`⚠️ No eBay OAuth token found for tracking request, user ${req.auth._id}`)
      return res.status(401).json({
        success: false,
        message: "eBay authentication required"
      })
    }

    const inventoryItem = await InventoryItem.findById(itemId)
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      })
    }

    if (!inventoryItem.ebayReturnId || !inventoryItem.ebayTrackingNumber || !inventoryItem.ebayCarrierUsed) {
      return res.status(404).json({
        success: false,
        message: "No tracking information available"
      })
    }

    const trackingResponse = await getReturnTracking(
      ebayOAuthToken,
      inventoryItem.ebayReturnId,
      inventoryItem.ebayCarrierUsed,
      inventoryItem.ebayTrackingNumber
    )

    if (!trackingResponse.success) {
      if (trackingResponse.failedOAuth) {
        return res.status(401).json({
          success: false,
          message: "eBay authentication expired"
        })
      }
      
      return res.status(404).json({
        success: false,
        message: trackingResponse.error || "Failed to retrieve tracking information"
      })
    }

    res.json({
      success: true,
      trackingData: trackingResponse.trackingData,
      inventoryItem: {
        sku: inventoryItem.sku,
        title: inventoryItem.title,
        ebayReturnId: inventoryItem.ebayReturnId,
        ebayTrackingNumber: inventoryItem.ebayTrackingNumber,
        ebayCarrierUsed: inventoryItem.ebayCarrierUsed
      }
    })

  } catch (error) {
    console.error("Error fetching return tracking:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching tracking information"
    })
  }
})

async function getUserObject(userId) {
  const userInfo = await User.findById(userId)
  if (!userInfo) {
    throw new Error(`User not found with ID: ${userId}`)
  }
  return userInfo.toObject()
}

module.exports = ebayRouter

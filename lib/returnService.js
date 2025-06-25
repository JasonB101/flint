const Return = require("../models/return")
const InventoryItem = require("../models/inventoryItem")
const Notification = require("../models/notification")
const User = require("../models/user")

/**
 * Extract buyer comments from return data with comprehensive fallbacks
 * @param {Object} returnData - Object containing summary and detail from eBay
 * @returns {String|null} Buyer comments or null if none found
 */
function extractBuyerComments(returnData) {
  if (!returnData) return null
  
  const { summary, detail } = returnData
  
  // PRIMARY LOCATION: Check creation info comments first (most reliable)
  if (summary?.creationInfo?.comments?.content) {
    const content = summary.creationInfo.comments.content.trim()
    if (content.length > 0) {
      console.log(`📝 Found buyer comments in creationInfo.comments.content: "${content}"`)
      return content
    }
  }
  
  // SECONDARY LOCATION: Check response history for buyer notes
  if (detail?.responseHistory?.length > 0) {
    for (const response of detail.responseHistory) {
      if (response.author === 'BUYER') {
        // Check for notes field
        if (response.notes && typeof response.notes === 'string' && response.notes.trim().length > 0) {
          const notes = response.notes.trim()
          console.log(`📝 Found buyer comments in responseHistory.notes: "${notes}"`)
          return notes
        }
        
        // Check various attributes that might contain comments
        if (response.attributes) {
          const commentFields = [
            response.attributes.comments,
            response.attributes.comment,
            response.attributes.message,
            response.attributes.buyerComments,
            response.attributes.buyerMessage,
            response.attributes.text,
            response.attributes.description,
            response.attributes.returnReason,
            response.attributes.reason
          ]
          
          for (const field of commentFields) {
            if (field && typeof field === 'string' && field.trim().length > 0) {
              console.log(`📝 Found buyer comments in responseHistory.attributes: "${field.trim()}"`)
              return field.trim()
            }
          }
        }
        
        // Check if there are comments directly on the response object
        const directFields = [
          response.comments,
          response.comment,
          response.message,
          response.text,
          response.description,
          response.buyerMessage
        ]
        
        for (const field of directFields) {
          if (field && typeof field === 'string' && field.trim().length > 0) {
            console.log(`📝 Found buyer comments in responseHistory: "${field.trim()}"`)
            return field.trim()
          }
        }
      }
    }
  }
  
  // FALLBACK LOCATIONS: Check other possible locations
  const possiblePaths = [
    // Other creation info variants
    summary?.creationInfo?.comment?.content,
    summary?.creationInfo?.comments,
    summary?.creationInfo?.comment,
    summary?.creationInfo?.buyerMessage,
    summary?.creationInfo?.message,
    
    // Other summary level comments
    summary?.comments?.content,
    summary?.comment?.content,
    summary?.comments,
    summary?.comment,
    summary?.buyerComments,
    summary?.buyerMessage,
    summary?.message,
    
    // Detail level comments
    detail?.buyerComments,
    detail?.comments?.content,
    detail?.comment?.content,
    detail?.comments,
    detail?.comment,
    detail?.buyerMessage,
    detail?.message,
    
    // Root level fallbacks
    returnData.buyerComments,
    returnData.comments?.content,
    returnData.comment?.content,
    returnData.comments,
    returnData.comment,
    returnData.buyerMessage,
    returnData.message
  ]
  
  // Check the fallback possible paths
  for (const path of possiblePaths) {
    if (path && typeof path === 'string' && path.trim().length > 0) {
      console.log(`📝 Found buyer comments in fallback path: "${path.trim()}"`)
      return path.trim()
    }
  }
  
  return null
}

/**
 * Safely extract nested value with fallback
 * @param {Object} obj - Object to extract from
 * @param {String} path - Dot notation path
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Extracted value or default
 */
function safeExtract(obj, path, defaultValue = null) {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue
  } catch (error) {
    return defaultValue
  }
}

// Old extraction functions removed - replaced with direct extraction in createOrUpdateReturn

/**
 * Create a notification when a return is delivered
 * @param {Object} returnRecord - The return record
 * @param {String} userId - User ID
 */
async function createReturnDeliveredNotification(returnRecord, userId) {
  try {
    // Check user's notification settings before creating notification
    const user = await User.findById(userId).select('notificationSettings')
    
    // Default to enabled if no settings exist
    const notificationSettings = user?.notificationSettings || { automaticReturns: true }
    
    // Only create notification if user has automatic returns enabled
    if (!notificationSettings.automaticReturns) {
      console.log(`Return delivery notification skipped for User ${userId} - disabled in settings`)
      return
    }

    // Get item details for notification
    const item = await InventoryItem.findById(returnRecord.inventoryItemId).select('title sku')
    if (!item) {
      console.log(`Could not find inventory item for return notification: ${returnRecord.inventoryItemId}`)
      return
    }

    // Check if notification already exists for this return delivery
    const existingNotification = await Notification.findOne({
      userId: userId,
      type: 'returnDelivered',
      'data.ebayReturnId': returnRecord.ebayReturnId,
      isDeleted: { $ne: true } // Don't count deleted notifications
    })
    
    if (!existingNotification) {
      // Create a notification
      const notification = new Notification({
        userId: userId,
        data: {
          ebayReturnId: returnRecord.ebayReturnId,
          itemTitle: item.title,
          itemSku: item.sku,
          trackingNumber: returnRecord.trackingNumber,
          carrierUsed: returnRecord.carrierUsed,
          deliveryDate: returnRecord.deliveryDate,
          orderId: returnRecord.orderId,
          message: `Return delivered for ${item.title} (SKU: ${item.sku})`
        },
        type: 'returnDelivered',
        isViewed: false,
      })

      // Save the notification
      await notification.save()

      console.log(`🔔 Return delivery notification created for User ${userId} - Return ${returnRecord.ebayReturnId}`)
    } else {
      console.log(`Return delivery notification already exists for return ${returnRecord.ebayReturnId}`)
    }
  } catch (error) {
    console.error(`Error creating return delivery notification: ${error.message}`)
  }
}

/**
 * Compare key fields to determine if a return has changed (robust to undefined/null/empty values)
 * @param {Object} existing - The existing DB return
 * @param {Object} incoming - The new incoming return data (summary/detail)
 * @returns {Boolean} true if changed, false if not
 */
function hasReturnChanged(existing, incoming) {
  // Use summary and detail for incoming
  const summary = incoming.summary || incoming;
  const detail = incoming.detail || {};
  // Normalize all values for comparison
  const norm = v => (v === undefined || v === null) ? '' : String(v).trim().toUpperCase();
  return (
    norm(existing.returnStatus) !== norm(summary.status || summary.state) ||
    norm(existing.trackingNumber) !== norm(detail.returnShipmentInfo?.shipmentTracking?.trackingNumber) ||
    norm(existing.carrierUsed) !== norm(detail.returnShipmentInfo?.shipmentTracking?.carrierUsed || detail.returnShipmentInfo?.shipmentTracking?.carrierName) ||
    norm(existing.trackingStatus) !== norm(detail.returnShipmentInfo?.shipmentTracking?.deliveryStatus || detail.returnShipmentInfo?.shipmentTracking?.trackingStatus) ||
    String(existing.refundAmount ?? '') !== String(
      detail.buyerTotalRefund?.actualRefundAmount?.value ??
      detail.sellerTotalRefund?.actualRefundAmount?.value ??
      summary.buyerTotalRefund?.actualRefundAmount?.value ??
      summary.sellerTotalRefund?.actualRefundAmount?.value ?? ''
    ) ||
    String(existing.returnShippingCost ?? '') !== String(detail.returnShipmentInfo?.shippingLabelCost?.totalAmount?.value ?? '') ||
    (existing.deliveryDate ? new Date(existing.deliveryDate).toISOString() : '') !== (detail.returnShipmentInfo?.shipmentTracking?.actualDeliveryDate?.value ? new Date(detail.returnShipmentInfo.shipmentTracking.actualDeliveryDate.value).toISOString() : '') ||
    (existing.shipDate ? new Date(existing.shipDate).toISOString() : '') !== (detail.returnShipmentInfo?.shipmentTracking?.actualShipDate?.value ? new Date(detail.returnShipmentInfo.shipmentTracking.actualShipDate.value).toISOString() : '')
  );
}

/**
 * Smart sync: Only add new returns, and only update existing returns if not completed (CLOSED).
 * @param {Object} returnData - {summary, detail} from eBay
 * @param {ObjectId} inventoryItemId
 * @param {ObjectId} userId
 */
async function createOrUpdateReturn(returnData, inventoryItemId, userId) {
  try {
    // Always use the full structured data if available
    const summary = returnData.summary || returnData;
    const detail = returnData.detail || {};
    // Normalize status
    const incomingStatus = ((summary.status || summary.state || '') + '').trim().toUpperCase();
    if (!incomingStatus) {
      console.warn(`[SYNC WARNING] Incoming return ${summary.returnId} has missing/undefined status. Skipping update.`);
      return null;
    }
    
    console.log(`🔍 Processing return ${summary.returnId}`)
    
    // Extract buyer comments directly from summary
    const buyerComments = summary.creationInfo?.comments?.content || null
    console.log(`📝 Buyer comments: ${buyerComments || 'none'}`)
    
    // Extract tracking info from detail.returnShipmentInfo.shipmentTracking
    let trackingNumber = null;
    let carrierUsed = null;
    let trackingStatus = null;
    let shipDate = null;
    let deliveryDate = null;
    if (detail.returnShipmentInfo?.shipmentTracking) {
      const tracking = detail.returnShipmentInfo.shipmentTracking;
      trackingNumber = tracking.trackingNumber || null;
      carrierUsed = tracking.carrierUsed || tracking.carrierName || null;
      trackingStatus = tracking.deliveryStatus || tracking.trackingStatus || null;
      shipDate = tracking.actualShipDate?.value ? new Date(tracking.actualShipDate.value) : null;
      deliveryDate = tracking.actualDeliveryDate?.value ? new Date(tracking.actualDeliveryDate.value) : null;
    }
    
    // Extract shipping cost from detail
    const returnShippingCost = detail.returnShipmentInfo?.shippingLabelCost?.totalAmount?.value || null
    
    console.log(`🚚 Tracking: ${trackingNumber || 'none'} via ${carrierUsed || 'none'}`)
    console.log(`💰 Shipping cost: $${returnShippingCost || 'none'}`)

    // Get the inventory item to extract additional linking data
    let inventoryItem = null
    let itemSku = null
    let itemTitle = null
    try {
      const InventoryItem = require("../models/inventoryItem")
      inventoryItem = await InventoryItem.findById(inventoryItemId).select('sku orderId ebayId dateSold title')
      if (inventoryItem) {
        itemSku = inventoryItem.sku
        itemTitle = inventoryItem.title
      }
    } catch (error) {
      console.log(`⚠️ Could not fetch inventory item ${inventoryItemId} for SKU lookup:`, error.message)
    }

    // Check if this is an existing return
    const existingReturn = await Return.findOne({ 
      ebayReturnId: summary.returnId, 
      userId 
    })

    // If exists, only update if not completed (CLOSED)
    if (existingReturn) {
      const dbStatus = ((existingReturn?.returnStatus || '') + '').trim().toUpperCase();
      if (incomingStatus === 'CLOSED' && dbStatus !== 'CLOSED') {
        // Proceed to update the DB to CLOSED (fall through to update logic)
      } else if (dbStatus === 'CLOSED') {
        await Return.updateOne({ _id: existingReturn._id }, { $set: { lastEbaySync: new Date() } });
        return existingReturn;
      }
      if (!hasReturnChanged(existingReturn, returnData)) {
        await Return.updateOne({ _id: existingReturn._id }, { $set: { lastEbaySync: new Date() } });
        return existingReturn;
      }
    }

    // Extract refund information from detail (prefer detail, fallback to summary)
    const refundAmount = detail.buyerTotalRefund?.actualRefundAmount?.value || 
                        detail.sellerTotalRefund?.actualRefundAmount?.value ||
                        summary.buyerTotalRefund?.actualRefundAmount?.value ||
                        summary.sellerTotalRefund?.actualRefundAmount?.value || null
    const refundCurrency = detail.buyerTotalRefund?.actualRefundAmount?.currency || 
                          detail.sellerTotalRefund?.actualRefundAmount?.currency ||
                          summary.buyerTotalRefund?.actualRefundAmount?.currency || 
                          summary.sellerTotalRefund?.actualRefundAmount?.currency || 'USD'
    const sellerRefundAmount = detail.sellerTotalRefund?.actualRefundAmount?.value ||
                              summary.sellerTotalRefund?.actualRefundAmount?.value || null
    
    console.log(`💰 Refund amount: $${refundAmount || 'none'} ${refundCurrency}`)
    console.log(`💰 Seller refund: $${sellerRefundAmount || 'none'}`)

    // Build comprehensive normalized return object
    const normalizedReturn = {
      // Basic identification
      inventoryItemId,
      userId,
      ebayReturnId: summary.returnId,
      
      // Return status and dates
      returnStatus: incomingStatus,
      returnReason: summary.creationInfo?.reason,
      reasonType: summary.creationInfo?.reasonType,
      creationDate: summary.creationInfo?.creationDate?.value ? new Date(summary.creationInfo.creationDate.value) : null,
      closeDate: null, // Will be populated if we have detail data later
      
      // Buyer information and comments
      buyerLoginName: summary.buyerLoginName,
      buyerComments: buyerComments,
      
      // CRITICAL LINKING FIELDS - Order and item information
      orderId: summary.orderId,
      itemId: summary.creationInfo?.item?.itemId,
      transactionId: summary.creationInfo?.item?.transactionId,
      transactionDate: null, // Not available in search API
      itemTitle: itemTitle, // From inventory item
      itemPrice: null, // Not available in search API
      itemPriceCurrency: refundCurrency,
      returnQuantity: summary.creationInfo?.item?.returnQuantity || 1,
      
      // Additional linking fields for inventory matching
      sku: itemSku, // Derived from inventory item
      originalSaleDate: null, // Not available in search API
      
      // Financial information - primary fields
      refundAmount: refundAmount,
      refundCurrency: refundCurrency,
      refundStatus: incomingStatus === 'CLOSED' ? 'COMPLETED' : 'PENDING',
      refundDate: null, // Would need detail API for this
      
      // Financial information - seller perspective
      sellerRefundAmount: sellerRefundAmount,
      
      // Return shipping costs
      returnShippingCost: returnShippingCost,
      
      // Tracking information
      trackingNumber: trackingNumber,
      carrierUsed: carrierUsed,
      trackingStatus: trackingStatus,
      deliveryDate: deliveryDate,
      shipDate: shipDate,
      
      // Store minimal essential debugging data (not full eBay response)
      rawEbayData: {
        returnId: summary.returnId,
        lastApiCall: new Date(),
        hasDetailData: !!returnData.detail,
        hasSummaryData: !!returnData.summary,
        extractedSuccessfully: {
          buyerComments: !!buyerComments,
          refundInfo: !!refundAmount,
          trackingInfo: !!trackingNumber,
          shippingCost: !!returnShippingCost,
          linkingData: !!(summary.orderId && summary.creationInfo?.item?.itemId)
        }
      },
      
      // Metadata
      lastSync: new Date(),
      dataVersion: '2.3' // Updated version for correct search API handling
    }

    // Validate critical linking fields (more lenient for search API only data)
    if (!normalizedReturn.orderId) {
      console.log(`⚠️ Missing orderId for return ${summary.returnId} - will have limited matching capability`)
      throw new Error(`Missing critical linking field: orderId for return ${summary.returnId}`)
    }
    if (!normalizedReturn.itemId) {
      console.log(`⚠️ Missing itemId for return ${summary.returnId} - will have limited matching capability`)
    }
    if (!normalizedReturn.transactionId) {
      console.log(`⚠️ Missing transactionId for return ${summary.returnId} - will have limited matching capability`)
    }

    // Remove any undefined, null, or empty values to keep the document clean
    Object.keys(normalizedReturn).forEach(key => {
      const value = normalizedReturn[key]
      if (value === undefined || value === null || value === '' || 
          (typeof value === 'string' && value.trim() === '')) {
        delete normalizedReturn[key]
      }
    })

    // Upsert the return record
    const returnRecord = await Return.findOneAndUpdate(
      { ebayReturnId: summary.returnId, userId },
      normalizedReturn,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    )

    // Check if tracking status just changed to DELIVERED
    const isNewlyDelivered = trackingStatus === 'DELIVERED' && 
      (!existingReturn || existingReturn.trackingStatus !== 'DELIVERED')

    if (isNewlyDelivered) {
      console.log(`📦 Return ${summary.returnId} tracking status changed to DELIVERED`)
      await createReturnDeliveredNotification(returnRecord, userId)
    }

    // Update inventory item flags
    await updateInventoryItemReturnFlags(inventoryItemId)

    console.log(`✅ Created/updated return record: ${summary.returnId} (v${normalizedReturn.dataVersion})`)
    console.log(`🔗 Linking data: orderId=${normalizedReturn.orderId}, itemId=${normalizedReturn.itemId}, sku=${normalizedReturn.sku}`)
    console.log(`📋 Title: ${normalizedReturn.itemTitle || 'from inventory'}`)
    console.log(`💰 Refund: $${normalizedReturn.refundAmount || 'none'} (${normalizedReturn.refundStatus})`)
    console.log(`🚚 Tracking: ${normalizedReturn.trackingNumber || 'none'} via ${normalizedReturn.carrierUsed || 'none'}`)
    console.log(`💸 Shipping cost: $${normalizedReturn.returnShippingCost || 'none'}`)
    console.log(`📝 Comments: ${normalizedReturn.buyerComments || 'none'}`)
    
    // Summary of what we successfully extracted
    const extractedFields = {
      orderId: !!normalizedReturn.orderId,
      itemId: !!normalizedReturn.itemId,
      itemTitle: !!normalizedReturn.itemTitle,
      refundAmount: !!normalizedReturn.refundAmount,
      trackingNumber: !!normalizedReturn.trackingNumber,
      returnShippingCost: !!normalizedReturn.returnShippingCost,
      buyerComments: !!normalizedReturn.buyerComments
    }
    
    const extractedCount = Object.values(extractedFields).filter(Boolean).length
    console.log(`📊 Successfully extracted ${extractedCount}/7 key fields: ${Object.keys(extractedFields).filter(key => extractedFields[key]).join(', ')}`)
    
    return returnRecord

  } catch (error) {
    console.error("Error creating/updating return:", error)
    throw error
  }
}

/**
 * Get returns for an inventory item
 * @param {String} inventoryItemId - MongoDB ObjectId of inventory item
 * @param {String} userId - MongoDB ObjectId of user
 * @returns {Array} Array of return records
 */
async function getReturnsForItem(inventoryItemId, userId) {
  try {
    const returns = await Return.find({
      inventoryItemId,
      userId
    }).sort({ creationDate: -1 })

    return returns
  } catch (error) {
    console.error("Error fetching returns for item:", error)
    throw error
  }
}

/**
 * Get a specific return by eBay return ID
 * @param {String} ebayReturnId - eBay return ID
 * @param {String} userId - MongoDB ObjectId of user
 * @returns {Object} Return record
 */
async function getReturnByEbayId(ebayReturnId, userId) {
  try {
    const returnRecord = await Return.findOne({
      ebayReturnId,
      userId
    }).populate('inventoryItemId')

    return returnRecord
  } catch (error) {
    console.error("Error fetching return by eBay ID:", error)
    throw error
  }
}

/**
 * Update inventory item return flags
 * @param {String} inventoryItemId - MongoDB ObjectId of inventory item
 */
async function updateInventoryItemReturnFlags(inventoryItemId) {
  try {
    const returnCount = await Return.countDocuments({ inventoryItemId })
    const hasActiveReturn = await Return.exists({ 
      inventoryItemId, 
      returnStatus: { $in: ['OPEN', 'RETURN_REQUESTED', 'ITEM_READY_TO_SHIP', 'ITEM_SHIPPED'] }
    })

    await InventoryItem.findByIdAndUpdate(inventoryItemId, {
      returnCount,
      hasActiveReturn: !!hasActiveReturn
    })

    console.log(`📊 Updated return flags for item ${inventoryItemId}: count=${returnCount}, active=${!!hasActiveReturn}`)
  } catch (error) {
    console.error("Error updating inventory item return flags:", error)
  }
}

/**
 * Get return statistics for a user
 * @param {String} userId - MongoDB ObjectId of user
 * @returns {Object} Return statistics
 */
async function getReturnStats(userId) {
  try {
    const stats = await Return.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalReturns: { $sum: 1 },
          totalRefundAmount: { $sum: '$refundAmount' },
          totalShippingCost: { $sum: '$returnShippingCost' },
          avgRefundAmount: { $avg: '$refundAmount' },
          statusBreakdown: {
            $push: '$returnStatus'
          },
          reasonBreakdown: {
            $push: '$returnReason'
          }
        }
      }
    ])

    return stats[0] || {
      totalReturns: 0,
      totalRefundAmount: 0,
      totalShippingCost: 0,
      avgRefundAmount: 0,
      statusBreakdown: [],
      reasonBreakdown: []
    }
  } catch (error) {
    console.error("Error getting return stats:", error)
    throw error
  }
}

/**
 * Find returns by order ID
 * @param {String} orderId - eBay order ID
 * @param {String} userId - MongoDB ObjectId of user
 * @returns {Array} Array of return records
 */
async function getReturnsByOrderId(orderId, userId) {
  try {
    const returns = await Return.find({
      orderId,
      userId
    }).sort({ creationDate: -1 })

    return returns
  } catch (error) {
    console.error("Error fetching returns by order ID:", error)
    throw error
  }
}

/**
 * Find returns by eBay item ID
 * @param {String} itemId - eBay item ID
 * @param {String} userId - MongoDB ObjectId of user
 * @returns {Array} Array of return records
 */
async function getReturnsByItemId(itemId, userId) {
  try {
    const returns = await Return.find({
      itemId,
      userId
    }).sort({ creationDate: -1 })

    return returns
  } catch (error) {
    console.error("Error fetching returns by item ID:", error)
    throw error
  }
}

/**
 * Find returns by SKU
 * @param {String} sku - Item SKU
 * @param {String} userId - MongoDB ObjectId of user
 * @returns {Array} Array of return records
 */
async function getReturnsBySku(sku, userId) {
  try {
    const returns = await Return.find({
      sku,
      userId
    }).sort({ creationDate: -1 })

    return returns
  } catch (error) {
    console.error("Error fetching returns by SKU:", error)
    throw error
  }
}

/**
 * Find matching inventory item for a return using multiple linking strategies
 * @param {Object} returnData - Return data with linking fields
 * @param {String} userId - MongoDB ObjectId of user
 * @returns {Object|null} Matching inventory item or null
 */
async function findMatchingInventoryItem(returnData, userId) {
  try {
    const InventoryItem = require("../models/inventoryItem")
    
    // Strategy 1: Match by orderId (most reliable)
    if (returnData.orderId) {
      let item = await InventoryItem.findOne({
        userId,
        orderId: returnData.orderId
      })
      if (item) {
        console.log(`🎯 Found inventory match by orderId: ${returnData.orderId}`)
        return item
      }
    }
    
    // Strategy 2: Match by eBay itemId
    if (returnData.itemId) {
      let item = await InventoryItem.findOne({
        userId,
        ebayId: returnData.itemId
      })
      if (item) {
        console.log(`🎯 Found inventory match by ebayId: ${returnData.itemId}`)
        return item
      }
    }
    
    // Strategy 3: Match by transactionId (if stored in inventory)
    if (returnData.transactionId) {
      let item = await InventoryItem.findOne({
        userId,
        transactionId: returnData.transactionId
      })
      if (item) {
        console.log(`🎯 Found inventory match by transactionId: ${returnData.transactionId}`)
        return item
      }
    }
    
    console.log(`⚠️ No inventory match found for return with orderId: ${returnData.orderId}, itemId: ${returnData.itemId}`)
    return null
    
  } catch (error) {
    console.error("Error finding matching inventory item:", error)
    return null
  }
}

/**
 * Auto-process or update a return based on inventory item and active listings
 * @param {Object} inventoryItem - The inventory item
 * @param {Array} activeListings - Array of active eBay listings (with SKUs)
 * @param {String} userId - User ID
 */
async function autoProcessOrUpdateReturn(inventoryItem, activeListings, userId) {
  // Check for refund, return shipping cost, and relisted status
  const hasRefund = inventoryItem.additionalCosts?.some(c => c.title === 'refund' && c.amount > 0) || inventoryItem.refundAmount > 0;
  const hasReturnShipping = inventoryItem.additionalCosts?.some(c => c.title === 'returnShippingCost' && c.amount > 0) || inventoryItem.returnShippingCost > 0;
  // Relisted: check if SKU is in active listings
  const isRelisted = activeListings.some(listing => listing.sku === inventoryItem.sku);

  if (hasRefund && hasReturnShipping && isRelisted) {
    // Find existing return record
    const Return = require('../models/return');
    let returnRecord = await Return.findOne({ inventoryItemId: inventoryItem._id, userId });
    const now = new Date();
    let status = inventoryItem.returnStatus || 'AUTO_PROCESSED';
    let update = {
      autoProcessed: true,
      returnStatus: status,
      lastSync: now,
    };
    // Optionally update refund, shipping, relist info
    if (inventoryItem.refundAmount) update.refundAmount = inventoryItem.refundAmount;
    if (inventoryItem.returnShippingCost) update.returnShippingCost = inventoryItem.returnShippingCost;
    if (inventoryItem.relistedDate) update.relistedDate = inventoryItem.relistedDate;
    // Push to statusHistory
    if (!returnRecord) {
      update.statusHistory = [{ status, date: now }];
      // Create new return record
      returnRecord = await Return.create({
        inventoryItemId: inventoryItem._id,
        userId,
        ...update
      });
    } else {
      // Only push to statusHistory if status changed
      if (!returnRecord.statusHistory || returnRecord.statusHistory[returnRecord.statusHistory.length-1]?.status !== status) {
        await Return.findByIdAndUpdate(returnRecord._id, {
          $set: update,
          $push: { statusHistory: { status, date: now } }
        });
      } else {
        await Return.findByIdAndUpdate(returnRecord._id, { $set: update });
      }
    }
    // Create notification
    await createReturnDeliveredNotification(returnRecord, userId);
    return true;
  }
  return false;
}

/**
 * Determines if a return has been properly processed by checking multiple indicators
 * @param {Object} returnItem - Return document
 * @param {Object} inventoryItem - Linked inventory item document (if exists)
 * @returns {Object} Processing status and details
 */
const isReturnProcessed = (returnItem, inventoryItem = null) => {
  const status = {
    isProcessed: false,
    hasLinkedInventoryItem: !!inventoryItem,
    processingIndicators: {
      hasReturnDate: false,
      hasReturnShippingCost: false,
      hasLastReturnedOrder: false,
      hasReturnCount: false,
      automaticReturnFlagSet: false,
      additionalCostsUpdated: false
    },
    processingScore: 0,
    missingIndicators: [],
    issues: []
  }

  // Primary issue: No linked inventory item
  if (!inventoryItem) {
    status.issues.push('No linked inventory item')
    status.missingIndicators.push('inventoryItemId')
    return status
  }

  // Check processing indicators based on ItemReturnModal workflow
  
  // 1. Return date should be set
  if (inventoryItem.returnDate) {
    status.processingIndicators.hasReturnDate = true
    status.processingScore++
  } else {
    status.missingIndicators.push('returnDate')
  }

  // 2. Return shipping cost should be in additionalCosts
  const hasReturnShippingCost = inventoryItem.additionalCosts?.some(cost => 
    cost.title === 'returnShippingCost' && cost.amount > 0
  )
  if (hasReturnShippingCost) {
    status.processingIndicators.hasReturnShippingCost = true
    status.processingScore++
  } else {
    status.missingIndicators.push('returnShippingCost')
  }

  // 3. Last returned order should be tracked
  if (inventoryItem.lastReturnedOrder) {
    status.processingIndicators.hasLastReturnedOrder = true
    status.processingScore++
  } else {
    status.missingIndicators.push('lastReturnedOrder')
  }

  // 4. Return count should be incremented
  if ((inventoryItem.returnCount || 0) > 0) {
    status.processingIndicators.hasReturnCount = true
    status.processingScore++
  } else {
    status.missingIndicators.push('returnCount')
  }

  // 5. Automatic return flag should be set appropriately
  if (inventoryItem.automaticReturn !== undefined) {
    status.processingIndicators.automaticReturnFlagSet = true
    status.processingScore++
  } else {
    status.missingIndicators.push('automaticReturn')
  }

  // 6. Additional costs should have been updated (basic check)
  if (inventoryItem.additionalCosts && inventoryItem.additionalCosts.length > 0) {
    status.processingIndicators.additionalCostsUpdated = true
    status.processingScore++
  } else {
    status.missingIndicators.push('additionalCosts')
  }

  // Determine if processed (need at least 4 out of 6 indicators for well-processed return)
  status.isProcessed = status.processingScore >= 4

  if (!status.isProcessed) {
    status.issues.push(`Insufficient processing indicators (${status.processingScore}/6)`)
  }

  return status
}

/**
 * Get all unprocessed returns for a user
 * @param {String} userId - User ID
 * @returns {Array} Array of unprocessed returns with processing details
 */
const getUnprocessedReturns = async (userId) => {
  try {
    // Get all returns for user with populated inventory items
    const returns = await Return.find({ userId })
      .populate('inventoryItemId')
      .lean()

    const unprocessedReturns = []

    for (const returnItem of returns) {
      const processingStatus = isReturnProcessed(returnItem, returnItem.inventoryItemId)
      
      if (!processingStatus.isProcessed) {
        unprocessedReturns.push({
          ...returnItem,
          processingStatus
        })
      }
    }

    return unprocessedReturns
  } catch (error) {
    console.error('Error getting unprocessed returns:', error)
    throw error
  }
}

/**
 * Smart auto-processing logic for returns based on eBay data
 * Uses return status, shipping costs, and tracking info to determine likely outcome
 * @param {Object} returnRecord - Return document from database
 * @param {Array} activeListings - Active eBay listings (to check if already re-listed)
 * @returns {Object} Processing recommendation and confidence level
 */
const determineReturnProcessing = (returnRecord, activeListings = []) => {
  const result = {
    action: null, // 'RELIST', 'WASTE', 'MANUAL_REVIEW'
    confidence: 0, // 0-100
    reasoning: [],
    autoProcessable: false,
    suggestedUpdates: {}
  }

  // Check if item is currently listed (user already handled it)
  // Only check if we have a valid SKU to compare against
  if (returnRecord.sku && returnRecord.sku.trim()) {
    const isCurrentlyListed = activeListings.some(listing => 
      (listing.SKU && listing.SKU === returnRecord.sku) || 
      (listing.sku && listing.sku === returnRecord.sku)
    )

    if (isCurrentlyListed) {
      result.action = 'RELIST'
      result.confidence = 95
      result.reasoning.push('Item is currently listed on eBay - user already re-listed it')
      result.autoProcessable = true
      result.suggestedUpdates = {
        returnDate: returnRecord.creationDate ? new Date(returnRecord.creationDate).toISOString().split('T')[0] : null,
        returnShippingCost: returnRecord.returnShippingCost || 0,
        refundAmount: returnRecord.refundAmount || returnRecord.itemPrice,
        isRelisted: true
      }
      return result
    }
  } else {
    // No SKU available - cannot determine listing status
    result.reasoning.push('No SKU available - cannot verify current listing status')
  }

  // CRITICAL LOGIC: CLOSED status analysis
  if (returnRecord.returnStatus === 'CLOSED') {
    result.reasoning.push('Return status is CLOSED - eBay has finalized this return')

    // Key insight: No return shipping cost = item never shipped back = waste
    if (!returnRecord.returnShippingCost || returnRecord.returnShippingCost === 0) {
      result.action = 'WASTE'
      result.confidence = 90
      result.reasoning.push('No return shipping cost - item was not shipped back to seller')
      result.reasoning.push('Buyer was refunded but kept the item - mark as waste')
      result.autoProcessable = true
      result.suggestedUpdates = {
        returnDate: returnRecord.creationDate ? new Date(returnRecord.creationDate).toISOString().split('T')[0] : null,
        returnShippingCost: 0,
        refundAmount: returnRecord.refundAmount || returnRecord.itemPrice,
        isWaste: true
      }
    } 
    // Has return shipping cost - requires manual review
    else if (returnRecord.returnShippingCost > 0) {
      // All items with shipping costs require manual review
      if (returnRecord.trackingStatus === 'DELIVERED') {
        result.action = 'MANUAL_REVIEW'
        result.confidence = 75
        result.reasoning.push('Item was shipped back and delivered - needs manual inspection')
        result.reasoning.push('Check item condition to determine if waste or re-listable')
        
        // Add contextual information for manual decision making
        const itemValue = returnRecord.refundAmount || returnRecord.itemPrice || 0
        const returnShippingCost = returnRecord.returnShippingCost || 0
        
        if (returnRecord.returnReason) {
          result.reasoning.push(`Return reason: "${returnRecord.returnReason}"`)
        }
        
        if (returnRecord.buyerComments) {
          result.reasoning.push('Has buyer comments for context')
        }
        
        result.autoProcessable = false
        result.suggestedUpdates = {
          returnDate: returnRecord.creationDate ? new Date(returnRecord.creationDate).toISOString().split('T')[0] : null,
          returnShippingCost: returnRecord.returnShippingCost,
          refundAmount: returnRecord.refundAmount || returnRecord.itemPrice
        }
      } else {
        result.action = 'MANUAL_REVIEW'
        result.confidence = 60
        result.reasoning.push('Return shipping cost exists but tracking status unclear')
        result.reasoning.push('May still be in transit or delivery status unknown')
        result.autoProcessable = false
      }
    }
  }
  // OPEN status - return still in progress
  else if (returnRecord.returnStatus === 'OPEN') {
    result.action = 'MANUAL_REVIEW'
    result.confidence = 30
    result.reasoning.push('Return is still OPEN - wait for eBay to close it')
    result.reasoning.push('Processing premature - let eBay finalize first')
    result.autoProcessable = false
  }
  // Unknown or other status
  else {
    result.action = 'MANUAL_REVIEW'
    result.confidence = 20
    result.reasoning.push(`Unknown return status: ${returnRecord.returnStatus}`)
    result.reasoning.push('Requires manual review to determine next steps')
    result.autoProcessable = false
  }

  // Additional confidence adjustments
  if (returnRecord.refundAmount && returnRecord.refundAmount > 0) {
    result.confidence += 5
    result.reasoning.push('Refund amount confirmed')
  }

  if (returnRecord.buyerComments) {
    result.confidence += 3
    result.reasoning.push('Has buyer comments for context')
  }

  // Cap confidence at 100
  result.confidence = Math.min(result.confidence, 100)

  return result
}

/**
 * Bulk process returns using smart logic
 * @param {String} userId - User ID
 * @param {Array} activeListings - Array of active eBay listings
 * @param {Object} options - Processing options
 * @returns {Object} Processing results and statistics
 */
const smartProcessReturns = async (userId, activeListings = [], options = {}) => {
  const {
    dryRun = false,
    minConfidence = 80,
    autoProcessWaste = true,
    autoProcessRelist = true
  } = options

  try {
    console.log(`🤖 Starting smart return processing for user ${userId}`)
    console.log(`📋 Options: dryRun=${dryRun}, minConfidence=${minConfidence}`)

    // Get all unprocessed returns
    const unprocessedReturns = await getUnprocessedReturns(userId)
    console.log(`📦 Found ${unprocessedReturns.length} unprocessed returns`)

    const results = {
      processed: 0,
      skipped: 0,
      actions: {
        RELIST: 0,
        WASTE: 0,
        MANUAL_REVIEW: 0
      },
      details: []
    }

    for (const returnItem of unprocessedReturns) {
      const recommendation = determineReturnProcessing(returnItem, activeListings)
      
      console.log(`\n📋 Return ${returnItem.ebayReturnId} (${returnItem.sku || 'no SKU'})`)
      console.log(`   Action: ${recommendation.action} (${recommendation.confidence}% confidence)`)
      console.log(`   Reasoning: ${recommendation.reasoning.join(', ')}`)

      results.details.push({
        ebayReturnId: returnItem.ebayReturnId,
        sku: returnItem.sku,
        recommendation
      })

      results.actions[recommendation.action]++

      // Auto-process if confidence is high enough and auto-processing is enabled
      const shouldAutoProcess = recommendation.autoProcessable && 
                               recommendation.confidence >= minConfidence &&
                               ((recommendation.action === 'WASTE' && autoProcessWaste) ||
                                (recommendation.action === 'RELIST' && autoProcessRelist))

      if (shouldAutoProcess && !dryRun) {
        try {
          // Get the inventory item
          const inventoryItem = await InventoryItem.findById(returnItem.inventoryItemId)
          if (!inventoryItem) {
            console.log(`   ❌ Could not find inventory item ${returnItem.inventoryItemId}`)
            results.skipped++
            continue
          }

          // Apply the suggested updates
          const updates = recommendation.suggestedUpdates
          
          // Update inventory item with return processing data
          const inventoryUpdates = {
            returnDate: updates.returnDate,
            returnShippingCost: updates.returnShippingCost,
            refundAmount: updates.refundAmount,
            automaticReturn: true,
            lastReturnedOrder: returnItem.orderId,
            returnCount: (inventoryItem.returnCount || 0) + 1
          }

          // Add additional costs
          const additionalCosts = [...(inventoryItem.additionalCosts || [])]
          
          if (updates.returnShippingCost > 0) {
            additionalCosts.push({
              title: 'returnShippingCost',
              amount: updates.returnShippingCost,
              date: new Date()
            })
          }

          if (updates.refundAmount > 0) {
            additionalCosts.push({
              title: 'refund',
              amount: updates.refundAmount,
              date: new Date()
            })
          }

          inventoryUpdates.additionalCosts = additionalCosts

          // Set status based on action and clear sale data
          if (recommendation.action === 'WASTE') {
            inventoryUpdates.status = 'waste'
            // Clear sale data since item was returned
            inventoryUpdates.sold = false
            inventoryUpdates.shipped = false
            inventoryUpdates.listed = false
            inventoryUpdates.priceSold = null
            inventoryUpdates.dateSold = null
            inventoryUpdates.ebayFees = null
            inventoryUpdates.trackingNumber = null
            inventoryUpdates.buyer = null
            inventoryUpdates.daysListed = null
            inventoryUpdates.orderId = null
            inventoryUpdates.shippingCost = null
            inventoryUpdates.roi = null
          } else if (recommendation.action === 'RELIST') {
            inventoryUpdates.status = 'active'
            // Clear sale data since item was returned and needs to be relisted
            inventoryUpdates.sold = false
            inventoryUpdates.shipped = false
            inventoryUpdates.listed = true
            inventoryUpdates.priceSold = null
            inventoryUpdates.dateSold = null
            inventoryUpdates.ebayFees = null
            inventoryUpdates.trackingNumber = null
            inventoryUpdates.buyer = null
            inventoryUpdates.daysListed = null
            inventoryUpdates.orderId = null
            inventoryUpdates.shippingCost = null
            inventoryUpdates.roi = null
            inventoryUpdates.profit = null
          }

          await InventoryItem.findByIdAndUpdate(inventoryItem._id, inventoryUpdates)

          // Mark return as auto-processed
          await Return.findByIdAndUpdate(returnItem._id, {
            autoProcessed: true,
            lastSync: new Date()
          })

          console.log(`   ✅ Auto-processed as ${recommendation.action}`)
          results.processed++

        } catch (error) {
          console.error(`   ❌ Error auto-processing return ${returnItem.ebayReturnId}:`, error.message)
          results.skipped++
        }
      } else {
        console.log(`   ⏭️ Skipped - ${dryRun ? 'dry run' : shouldAutoProcess ? 'auto-processing disabled' : 'confidence too low'}`)
        results.skipped++
      }
    }

    console.log(`\n📊 Smart Processing Results:`)
    console.log(`   Processed: ${results.processed}`)
    console.log(`   Skipped: ${results.skipped}`)
    console.log(`   Actions: RELIST=${results.actions.RELIST}, WASTE=${results.actions.WASTE}, MANUAL=${results.actions.MANUAL_REVIEW}`)

    return results

  } catch (error) {
    console.error('Error in smart return processing:', error)
    throw error
  }
}

/**
 * Advanced return-to-inventory matching using multiple strategies
 * @param {Object} returnRecord - Return document
 * @param {String} userId - User ID
 * @returns {Object|null} Matching inventory item with match details
 */
async function findInventoryItemForReturn(returnRecord, userId) {
  try {
    const InventoryItem = require("../models/inventoryItem")
    
    console.log(`🔍 Searching for inventory item for return ${returnRecord.ebayReturnId}`)
    console.log(`   Available data: orderId=${returnRecord.orderId}, itemId=${returnRecord.itemId}, buyer=${returnRecord.buyerLoginName}`)
    console.log(`   Price: $${returnRecord.refundAmount}, Title: "${returnRecord.itemTitle}"`)
    
    const matchStrategies = []
    
    // Strategy 1: Direct SKU match (if available)
    if (returnRecord.sku && returnRecord.sku.trim()) {
      const item = await InventoryItem.findOne({ userId, sku: returnRecord.sku })
      if (item) {
        console.log(`✅ Found match by SKU: ${returnRecord.sku}`)
        return { 
          item, 
          matchStrategy: 'SKU',
          confidence: 100,
          matchDetails: `Direct SKU match: ${returnRecord.sku}`
        }
      }
      matchStrategies.push('SKU (no match)')
    }
    
    // Strategy 2: Order ID match (most reliable)
    if (returnRecord.orderId) {
      const item = await InventoryItem.findOne({ userId, orderId: returnRecord.orderId })
      if (item) {
        console.log(`✅ Found match by Order ID: ${returnRecord.orderId}`)
        return { 
          item, 
          matchStrategy: 'OrderID',
          confidence: 95,
          matchDetails: `Order ID match: ${returnRecord.orderId}`
        }
      }
      matchStrategies.push('OrderID (no match)')
    }
    
    // Strategy 3: eBay Item ID match
    if (returnRecord.itemId) {
      const item = await InventoryItem.findOne({ userId, ebayId: returnRecord.itemId })
      if (item) {
        console.log(`✅ Found match by eBay Item ID: ${returnRecord.itemId}`)
        return { 
          item, 
          matchStrategy: 'EbayItemID',
          confidence: 90,
          matchDetails: `eBay Item ID match: ${returnRecord.itemId}`
        }
      }
      matchStrategies.push('EbayItemID (no match)')
    }
    
    // Strategy 4: Enhanced fuzzy matching using price and date range
    if (returnRecord.refundAmount && returnRecord.refundAmount > 0) {
      console.log(`🎯 Trying fuzzy price matching for $${returnRecord.refundAmount}...`)
      
      // Look for sold items with similar price (within $5 or 10% tolerance)
      const priceThreshold = Math.max(5, returnRecord.refundAmount * 0.1)
      const minPrice = returnRecord.refundAmount - priceThreshold
      const maxPrice = returnRecord.refundAmount + priceThreshold
      
      // ENHANCED: Use broader date filter or ignore dates if they seem problematic
      let dateFilter = {}
      let usedDateFilter = false
      
      if (returnRecord.creationDate) {
        const returnDate = new Date(returnRecord.creationDate)
        const currentDate = new Date()
        
        // Check if return date is in the future or too far in the future (data issue)
        if (returnDate > currentDate || returnDate.getFullYear() > currentDate.getFullYear()) {
          console.log(`   ⚠️ Return date appears incorrect (${returnDate.toISOString().split('T')[0]}), searching recent sales instead`)
          // Search last 6 months of sales instead
          const sixMonthsAgo = new Date(currentDate.getTime() - (180 * 24 * 60 * 60 * 1000))
          dateFilter = {
            dateSold: {
              $gte: sixMonthsAgo.toISOString().split('T')[0],
              $lte: currentDate.toISOString().split('T')[0]
            }
          }
          usedDateFilter = true
        } else {
          // Use original logic for valid dates
          const earliestSaleDate = new Date(returnDate.getTime() - (60 * 24 * 60 * 60 * 1000)) // 60 days before
          const latestSaleDate = new Date(returnDate.getTime() - (1 * 24 * 60 * 60 * 1000)) // 1 day before
          
          dateFilter = {
            dateSold: {
              $gte: earliestSaleDate.toISOString().split('T')[0],
              $lte: latestSaleDate.toISOString().split('T')[0]
            }
          }
          usedDateFilter = true
        }
      } else {
        console.log(`   ⚠️ No return date available, searching recent sales`)
        // Search last 6 months if no date available
        const currentDate = new Date()
        const sixMonthsAgo = new Date(currentDate.getTime() - (180 * 24 * 60 * 60 * 1000))
        dateFilter = {
          dateSold: {
            $gte: sixMonthsAgo.toISOString().split('T')[0],
            $lte: currentDate.toISOString().split('T')[0]
          }
        }
        usedDateFilter = true
      }
      
      if (usedDateFilter) {
        console.log(`   Date range: ${dateFilter.dateSold.$gte} to ${dateFilter.dateSold.$lte}`)
      }
      
      const candidateItems = await InventoryItem.find({
        userId,
        sold: true,
        priceSold: { $gte: minPrice, $lte: maxPrice },
        ...dateFilter
      }).lean()
      
      console.log(`   Found ${candidateItems.length} items with similar price in date range`)
      
      // ENHANCED: If no candidates with date filter, try without date filter
      let fallbackCandidates = []
      if (candidateItems.length === 0 && usedDateFilter) {
        console.log(`   🔄 No matches in date range, trying without date restrictions...`)
        fallbackCandidates = await InventoryItem.find({
          userId,
          sold: true,
          priceSold: { $gte: minPrice, $lte: maxPrice }
        }).sort({ dateSold: -1 }).limit(20).lean() // Most recent 20 matches
        
        console.log(`   Found ${fallbackCandidates.length} items with similar price (no date filter)`)
      }
      
      const allCandidates = candidateItems.length > 0 ? candidateItems : fallbackCandidates
      
      if (allCandidates.length > 0) {
        // Score each candidate
        for (const item of allCandidates) {
          let score = 40 // Base score for price proximity
          let reasons = []
          
          // Price scoring
          const priceDiff = Math.abs(returnRecord.refundAmount - item.priceSold)
          if (priceDiff <= 1) {
            score += 30
            reasons.push(`Exact price match: $${returnRecord.refundAmount}`)
          } else if (priceDiff <= 5) {
            score += 20
            reasons.push(`Close price match: $${returnRecord.refundAmount} ≈ $${item.priceSold}`)
          } else {
            score += 10
            reasons.push(`Similar price: $${returnRecord.refundAmount} vs $${item.priceSold}`)
          }
          
          // ENHANCED: Title similarity scoring with better handling of missing titles
          if (returnRecord.itemTitle && returnRecord.itemTitle !== 'undefined' && item.title) {
            const returnTitle = returnRecord.itemTitle.toLowerCase()
            const itemTitle = item.title.toLowerCase()
            
            // Check for exact title match
            if (returnTitle === itemTitle) {
              score += 25
              reasons.push('Exact title match')
            } else {
              // Word overlap scoring
              const returnWords = returnTitle.split(/\s+/).filter(w => w.length > 3)
              const itemWords = itemTitle.split(/\s+/).filter(w => w.length > 3)
              const commonWords = returnWords.filter(w => itemWords.includes(w))
              const overlapRatio = commonWords.length / Math.max(returnWords.length, itemWords.length)
              
              if (overlapRatio >= 0.6) {
                score += 20
                reasons.push(`High title similarity (${Math.round(overlapRatio * 100)}%)`)
              } else if (overlapRatio >= 0.3) {
                score += 10
                reasons.push(`Medium title similarity (${Math.round(overlapRatio * 100)}%)`)
              }
            }
          } else {
            // When title is missing/undefined, give small bonus for exact price matches
            if (priceDiff <= 1) {
              score += 10
              reasons.push('Exact price match (title unavailable)')
            }
          }
          
          // ENHANCED: Date proximity scoring with fallback handling
          if (returnRecord.creationDate && item.dateSold) {
            try {
              const returnDate = new Date(returnRecord.creationDate)
              const soldDate = new Date(item.dateSold)
              const currentDate = new Date()
              
              // Only score date proximity if return date seems reasonable
              if (returnDate <= currentDate && returnDate.getFullYear() <= currentDate.getFullYear()) {
                const daysDiff = Math.abs((returnDate - soldDate) / (1000 * 60 * 60 * 24))
                
                if (daysDiff <= 7) {
                  score += 15
                  reasons.push(`Return within 1 week of sale (${Math.round(daysDiff)} days)`)
                } else if (daysDiff <= 30) {
                  score += 10
                  reasons.push(`Return within 30 days of sale (${Math.round(daysDiff)} days)`)
                } else {
                  score += 5
                  reasons.push(`Return ${Math.round(daysDiff)} days after sale`)
                }
              } else {
                // For problematic return dates, just note recent sale
                score += 5
                reasons.push(`Recent sale on ${item.dateSold} (return date uncertain)`)
              }
            } catch (error) {
              console.log(`⚠️ Date parsing error: ${error.message}`)
            }
          }
          
          // Buyer matching bonus (if available)
          if (returnRecord.buyerLoginName && item.buyer) {
            // Check if buyer fields match (handling both username and ObjectId formats)
            if (returnRecord.buyerLoginName === item.buyer) {
              score += 25
              reasons.push(`Buyer match: ${returnRecord.buyerLoginName}`)
            } else if (typeof item.buyer === 'string' && item.buyer.length === 24) {
              // Item buyer might be an ObjectId, lower score but still possible
              score += 5
              reasons.push(`Buyer field format mismatch (ObjectId vs username)`)
            }
          }
          
          // ENHANCED: eBay Item ID bonus check
          if (returnRecord.itemId && item.ebayId && returnRecord.itemId === item.ebayId) {
            score += 30
            reasons.push(`eBay Item ID match: ${returnRecord.itemId}`)
          }
          
          // ENHANCED: Order ID bonus check (secondary verification)
          if (returnRecord.orderId && item.orderId && returnRecord.orderId === item.orderId) {
            score += 35
            reasons.push(`Order ID match: ${returnRecord.orderId}`)
          }
          
          // Report finding
          console.log(`   Candidate ${item.sku}: ${score}% - ${reasons.join(', ')}`)
          
          // If we have a high confidence match, use it
          if (score >= 80) {
            console.log(`✅ High confidence fuzzy match (${score}%): ${item.sku}`)
            return { 
              item, 
              matchStrategy: 'FuzzyMatch',
              confidence: score,
              matchDetails: reasons.join(', ')
            }
          }
          
          // Keep track of best match even if not high confidence
          if (score >= 65) {
            console.log(`🎯 Good fuzzy match (${score}%): ${item.sku} - ${reasons.join(', ')}`)
            return { 
              item, 
              matchStrategy: 'FuzzyMatchMedium',
              confidence: score,
              matchDetails: reasons.join(', ')
            }
          }
        }
      }
      
      matchStrategies.push(`FuzzyPrice (found ${allCandidates.length} candidates, no high confidence match)`)
    }
    
    // Strategy 5: Buyer name match with additional validation (fallback)
    if (returnRecord.buyerLoginName) {
      const buyerItems = await InventoryItem.find({ 
        userId, 
        buyer: returnRecord.buyerLoginName,
        sold: true // Only look at sold items
      }).sort({ dateSold: -1 }) // Most recent first
      
      if (buyerItems.length > 0) {
        console.log(`🔍 Found ${buyerItems.length} sold items for buyer: ${returnRecord.buyerLoginName}`)
        
        // Try to narrow down by date proximity and price
        for (const item of buyerItems) {
          let score = 60 // Base score for buyer match
          let reasons = [`Buyer match: ${returnRecord.buyerLoginName}`]
          
          // Check price match (within 5% tolerance)
          if (returnRecord.refundAmount && item.priceSold) {
            const priceDiff = Math.abs(returnRecord.refundAmount - item.priceSold)
            const priceThreshold = item.priceSold * 0.05 // 5% tolerance
            if (priceDiff <= priceThreshold) {
              score += 20
              reasons.push(`Price match: $${returnRecord.refundAmount} ≈ $${item.priceSold}`)
            } else {
              reasons.push(`Price mismatch: $${returnRecord.refundAmount} vs $${item.priceSold}`)
            }
          }
          
          // Check title similarity
          if (returnRecord.itemTitle && item.title) {
            const returnTitle = returnRecord.itemTitle.toLowerCase()
            const itemTitle = item.title.toLowerCase()
            
            // Simple word overlap check
            const returnWords = returnTitle.split(' ').filter(w => w.length > 3)
            const itemWords = itemTitle.split(' ').filter(w => w.length > 3)
            const commonWords = returnWords.filter(w => itemWords.includes(w))
            
            if (commonWords.length >= 2) {
              score += 15
              reasons.push(`Title similarity: ${commonWords.length} common words`)
            }
          }
          
          // Check date proximity (returns usually happen within 30 days of sale)
          if (returnRecord.creationDate && item.dateSold) {
            try {
              const returnDate = new Date(returnRecord.creationDate)
              const soldDate = new Date(item.dateSold)
              const daysDiff = Math.abs((returnDate - soldDate) / (1000 * 60 * 60 * 24))
              
              if (daysDiff <= 30) {
                score += 10
                reasons.push(`Return within 30 days of sale (${Math.round(daysDiff)} days)`)
              } else {
                reasons.push(`Return ${Math.round(daysDiff)} days after sale`)
              }
            } catch (error) {
              console.log(`⚠️ Date parsing error: ${error.message}`)
            }
          }
          
          // If we have a high confidence match, use it
          if (score >= 80) {
            console.log(`✅ High confidence buyer match (${score}%): ${item.sku}`)
            return { 
              item, 
              matchStrategy: 'BuyerMatch',
              confidence: score,
              matchDetails: reasons.join(', ')
            }
          }
          
          // Keep track of best match even if not high confidence
          if (score >= 70) {
            console.log(`🎯 Potential buyer match (${score}%): ${item.sku} - ${reasons.join(', ')}`)
            return { 
              item, 
              matchStrategy: 'BuyerMatchLowConfidence',
              confidence: score,
              matchDetails: reasons.join(', ')
            }
          }
        }
      }
      matchStrategies.push(`Buyer (found ${buyerItems.length} items, no high confidence match)`)
    }
    
    console.log(`❌ No match found using strategies: ${matchStrategies.join(', ')}`)
    return null
    
  } catch (error) {
    console.error(`Error finding inventory item for return ${returnRecord.ebayReturnId}:`, error)
    return null
  }
}

module.exports = {
  createOrUpdateReturn,
  getReturnsForItem,
  getReturnByEbayId,
  updateInventoryItemReturnFlags,
  getReturnStats,
  getReturnsByOrderId,
  getReturnsByItemId,
  getReturnsBySku,
  findMatchingInventoryItem,
  autoProcessOrUpdateReturn,
  isReturnProcessed,
  getUnprocessedReturns,
  determineReturnProcessing,
  smartProcessReturns,
  findInventoryItemForReturn
} 
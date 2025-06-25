const axios = require("axios")

/**
 * eBay Post-Order API Integration
 * Provides comprehensive return management with real-time status tracking
 */

const POST_ORDER_BASE_URL = "https://api.ebay.com/post-order/v2"

/**
 * Search for returns using the Post-Order API
 * @param {string} oAuthToken - eBay OAuth token
 * @param {Object} filters - Search filters
 * @returns {Array} Array of return objects
 */
async function searchReturns(oAuthToken, filters = {}) {
  try {
    const config = {
      headers: {
        Authorization: `IAF ${oAuthToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }

    // Build query parameters
    const params = new URLSearchParams()
    
    if (filters.creation_date_range_from) {
      params.append('creation_date_range_from', filters.creation_date_range_from)
    }
    if (filters.creation_date_range_to) {
      params.append('creation_date_range_to', filters.creation_date_range_to)
    }
    if (filters.return_status) {
      params.append('return_status', filters.return_status)
    }
    if (filters.limit) {
      params.append('limit', filters.limit)
    } else {
      params.append('limit', '200') // Default limit
    }

    const url = `${POST_ORDER_BASE_URL}/return/search?${params.toString()}`
    console.log(`🔍 Searching returns with URL: ${url}`)
    
    const response = await axios.get(url, config)
    console.log(`📊 Return search response status: ${response.status}`)
    
    if (response.data && response.data.members) {
      console.log(`✅ Found ${response.data.members.length} returns`)
      return {
        success: true,
        returns: response.data.members,
        total: response.data.total || response.data.members.length,
        failedOAuth: false
      }
    }
    
    console.log(`⚠️ No returns found in response`)
    return {
      success: true,
      returns: [],
      total: 0,
      failedOAuth: false
    }
    
  } catch (error) {
    console.error("Error searching returns:", error.message)
    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response data:", error.response.data)
    }
    
    if (error.response?.status === 401) {
      return {
        success: false,
        returns: [],
        total: 0,
        failedOAuth: true,
        error: "OAuth token expired"
      }
    }
    
    return {
      success: false,
      returns: [],
      total: 0,
      failedOAuth: false,
      error: error.message
    }
  }
}

/**
 * Get detailed information about a specific return
 * @param {string} oAuthToken - eBay OAuth token
 * @param {string} returnId - Return ID
 * @returns {Object} Detailed return information
 */
async function getReturnDetails(oAuthToken, returnId) {
  try {
    const config = {
      headers: {
        Authorization: `IAF ${oAuthToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }

    const url = `${POST_ORDER_BASE_URL}/return/${returnId}`
    const response = await axios.get(url, config)
    
    if (response.data) {
      return {
        success: true,
        returnData: response.data,
        failedOAuth: false
      }
    }
    
    return {
      success: false,
      returnData: null,
      failedOAuth: false,
      error: "No return data found"
    }
    
  } catch (error) {
    console.error(`Error getting return details for ${returnId}:`, error.message)
    
    if (error.response?.status === 401) {
      return {
        success: false,
        returnData: null,
        failedOAuth: true,
        error: "OAuth token expired"
      }
    }
    
    return {
      success: false,
      returnData: null,
      failedOAuth: false,
      error: error.message
    }
  }
}

/**
 * Get shipment tracking information for a return
 * @param {string} oAuthToken - eBay OAuth token
 * @param {string} returnId - Return ID
 * @param {string} carrierUsed - Shipping carrier
 * @param {string} trackingNumber - Tracking number
 * @returns {Object} Tracking information
 */
async function getReturnTracking(oAuthToken, returnId, carrierUsed, trackingNumber) {
  try {
    const config = {
      headers: {
        Authorization: `IAF ${oAuthToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }

    const params = new URLSearchParams()
    params.append('carrier_used', carrierUsed)
    params.append('tracking_number', trackingNumber)

    const url = `${POST_ORDER_BASE_URL}/return/${returnId}/tracking?${params.toString()}`
    const response = await axios.get(url, config)
    
    if (response.data) {
      return {
        success: true,
        trackingData: response.data,
        failedOAuth: false
      }
    }
    
    return {
      success: false,
      trackingData: null,
      failedOAuth: false,
      error: "No tracking data found"
    }
    
  } catch (error) {
    console.error(`Error getting tracking for return ${returnId}:`, error.message)
    
    if (error.response?.status === 401) {
      return {
        success: false,
        trackingData: null,
        failedOAuth: true,
        error: "OAuth token expired"
      }
    }
    
    return {
      success: false,
      trackingData: null,
      failedOAuth: false,
      error: error.message
    }
  }
}

/**
 * Search for cancellations using the Post-Order API
 * @param {string} oAuthToken - eBay OAuth token
 * @param {Object} filters - Search filters
 * @returns {Array} Array of cancellation objects
 */
async function searchCancellations(oAuthToken, filters = {}) {
  try {
    const config = {
      headers: {
        Authorization: `IAF ${oAuthToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }

    // Build query parameters
    const params = new URLSearchParams()
    
    if (filters.creation_date_range_from) {
      params.append('creation_date_range_from', filters.creation_date_range_from)
    }
    if (filters.creation_date_range_to) {
      params.append('creation_date_range_to', filters.creation_date_range_to)
    }
    if (filters.cancel_status) {
      params.append('cancel_status', filters.cancel_status)
    }
    if (filters.limit) {
      params.append('limit', filters.limit)
    } else {
      params.append('limit', '200') // Default limit
    }

    const url = `${POST_ORDER_BASE_URL}/cancellation/search?${params.toString()}`
    
    const response = await axios.get(url, config)
    
    if (response.data && response.data.cancellations) {
      return {
        success: true,
        cancellations: response.data.cancellations,
        total: response.data.total || response.data.cancellations.length,
        failedOAuth: false
      }
    }
    
    return {
      success: true,
      cancellations: [],
      total: 0,
      failedOAuth: false
    }
    
  } catch (error) {
    console.error("Error searching cancellations:", error.message)
    
    if (error.response?.status === 401) {
      return {
        success: false,
        cancellations: [],
        total: 0,
        failedOAuth: true,
        error: "OAuth token expired"
      }
    }
    
    return {
      success: false,
      cancellations: [],
      total: 0,
      failedOAuth: false,
      error: error.message
    }
  }
}

/**
 * Get detailed information about a specific cancellation
 * @param {string} oAuthToken - eBay OAuth token
 * @param {string} cancelId - Cancellation ID
 * @returns {Object} Detailed cancellation information
 */
async function getCancellationDetails(oAuthToken, cancelId) {
  try {
    const config = {
      headers: {
        Authorization: `IAF ${oAuthToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }

    const url = `${POST_ORDER_BASE_URL}/cancellation/${cancelId}`
    const response = await axios.get(url, config)
    
    if (response.data) {
      return {
        success: true,
        cancellationData: response.data,
        failedOAuth: false
      }
    }
    
    return {
      success: false,
      cancellationData: null,
      failedOAuth: false,
      error: "No cancellation data found"
    }
    
  } catch (error) {
    console.error(`Error getting cancellation details for ${cancelId}:`, error.message)
    
    if (error.response?.status === 401) {
      return {
        success: false,
        cancellationData: null,
        failedOAuth: true,
        error: "OAuth token expired"
      }
    }
    
    return {
      success: false,
      cancellationData: null,
      failedOAuth: false,
      error: error.message
    }
  }
}

/**
 * Extract buyer comments from return data with comprehensive fallbacks
 * @param {Object} returnData - Raw return data from API
 * @returns {String|null} Buyer comments or null if none found
 */
function extractBuyerComments(returnData) {
  if (!returnData) return null
  
  // Check multiple possible locations for buyer comments
  const possiblePaths = [
    returnData.summary?.creationInfo?.comments?.content,
    returnData.summary?.creationInfo?.comment?.content,
    returnData.summary?.creationInfo?.comments,
    returnData.summary?.comments?.content,
    returnData.summary?.comment?.content,
    returnData.summary?.comments,
    returnData.buyerComments,
    returnData.comments?.content,
    returnData.comment?.content,
    returnData.comments,
    returnData.detail?.buyerComments,
    returnData.detail?.comments?.content,
    returnData.detail?.comment?.content,
    returnData.detail?.comments
  ]
  
  for (const path of possiblePaths) {
    if (path && typeof path === 'string' && path.trim().length > 0) {
      console.log(`📝 Found buyer comments: "${path.trim()}"`)
      return path.trim()
    }
  }
  
  // Debug: Log the structure if no comments found but creation info exists
  if (returnData.summary?.creationInfo && !returnData.summary.creationInfo.comments) {
    console.log('🔍 No buyer comments found. CreationInfo structure:', 
      JSON.stringify(returnData.summary.creationInfo, null, 2))
  }
  
  return null
}

/**
 * Process and normalize return data from Post-Order API
 * @param {Object} returnData - Raw return data from API
 * @returns {Object} Normalized return data
 */
function normalizeReturnData(returnData) {
  if (!returnData) return null

  return {
    returnId: returnData.summary?.returnId || returnData.returnId,
    returnStatus: returnData.summary?.status || returnData.returnStatus,
    creationDate: returnData.summary?.creationInfo?.creationDate?.value || returnData.creationDate,
    lastModifiedDate: returnData.lastModifiedDate,
    returnReason: returnData.summary?.creationInfo?.reason || returnData.returnReason?.description || returnData.returnReason?.reasonCode,
    buyerComments: extractBuyerComments(returnData),
    sellerComments: returnData.sellerComments,
    
    // Order information
    orderId: returnData.orderLineItems?.[0]?.legacyOrderId,
    lineItemId: returnData.orderLineItems?.[0]?.lineItemId,
    itemId: returnData.orderLineItems?.[0]?.itemId,
    sku: returnData.orderLineItems?.[0]?.sku,
    title: returnData.orderLineItems?.[0]?.title,
    quantity: returnData.orderLineItems?.[0]?.quantity,
    
    // Financial information
    refundAmount: returnData.refund?.totalAmount?.value,
    refundCurrency: returnData.refund?.totalAmount?.currency,
    refundStatus: returnData.refund?.refundStatus,
    refundDate: returnData.refund?.refundDate,
    
    // Shipping information
    returnShippingCost: returnData.returnShippingCost?.value,
    carrierUsed: returnData.shipmentTracking?.carrierUsed,
    trackingNumber: returnData.shipmentTracking?.trackingNumber,
    trackingStatus: returnData.shipmentTracking?.trackingStatus,
    deliveryDate: returnData.shipmentTracking?.deliveryDate,
    
    // Buyer information
    buyerUserId: returnData.buyer?.userId,
    
    // Raw data for detailed view
    rawData: returnData
  }
}

/**
 * Sync returns with inventory items
 * @param {Array} returns - Returns from Post-Order API
 * @param {Array} inventoryItems - Current inventory items
 * @returns {Object} Sync results
 */
function syncReturnsWithInventory(returns, inventoryItems) {
  const syncResults = {
    matched: 0,
    unmatched: 0,
    updated: [],
    errors: []
  }

  const inventoryMap = new Map()
  inventoryItems.forEach(item => {
    if (item.sku) inventoryMap.set(item.sku, item)
    if (item.ebayId) inventoryMap.set(item.ebayId, item)
  })

  returns.forEach(returnData => {
    try {
      const normalized = normalizeReturnData(returnData)
      if (!normalized) {
        syncResults.errors.push(`Failed to normalize return data: ${returnData.returnId}`)
        return
      }

      // Try to match by SKU first, then by eBay item ID
      let matchedItem = null
      if (normalized.sku) {
        matchedItem = inventoryMap.get(normalized.sku)
      }
      if (!matchedItem && normalized.itemId) {
        matchedItem = inventoryMap.get(normalized.itemId)
      }

      if (matchedItem) {
        syncResults.matched++
        syncResults.updated.push({
          inventoryItemId: matchedItem._id,
          returnData: normalized,
          needsUpdate: !matchedItem.ebayReturnId || matchedItem.ebayReturnId !== normalized.returnId
        })
      } else {
        syncResults.unmatched++
        syncResults.errors.push(`No inventory match for return: ${normalized.returnId} (SKU: ${normalized.sku}, ItemID: ${normalized.itemId})`)
      }
    } catch (error) {
      syncResults.errors.push(`Error processing return: ${error.message}`)
    }
  })

  return syncResults
}

module.exports = {
  searchReturns,
  getReturnDetails,
  getReturnTracking,
  searchCancellations,
  getCancellationDetails,
  normalizeReturnData,
  syncReturnsWithInventory
} 
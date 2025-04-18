const axios = require("axios")

/**
 * Retrieve completed sales from eBay's Fulfillment API
 * @param {string} OAuthToken - The OAuth token for eBay API authentication
 * @param {number} daysBack - Optional number of days to look back (default: 90)
 * @returns {Array} Array of order objects from eBay
 */
async function getCompletedSales(OAuthToken, daysBack = 90) {
  const url = "https://api.ebay.com/sell/fulfillment/v1/order"
  
  // Calculate start date based on daysBack
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)
  const formattedStartDate = startDate.toISOString()
  
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${OAuthToken}`,
        "Content-Type": "application/json",
      },
      params: {
        filter: `creationdate:[${formattedStartDate}..]`,
        limit: 200  // eBay maximum per page
      }
    })
    
    const orders = response.data.orders || []
    return orders
  } catch (error) {
    console.error("Failed getting completed sales:", error.message)
    return []
  }
}

module.exports = getCompletedSales
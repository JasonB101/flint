const axios = require("axios")

async function getCompletedSales(OAuthToken) {
  const url = "https://api.ebay.com/sell/fulfillment/v1/order"

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${OAuthToken}`,
        "Content-Type": "application/json",
      },
    })
    const orders = response.data.orders
    // console.log(orders.filter(order => order.orderFulfillmentStatus !== "FULFILLED"))
    return orders
  } catch (error) {
    console.error("Failed getting completed sales", error)
    return []
  }
}

module.exports = getCompletedSales

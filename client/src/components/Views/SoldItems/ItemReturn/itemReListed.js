const itemReListed = (newValues) => {
const {dateListed, additionalCosts, expectedProfit, ebayId, itemId, returnDate, orderId} = newValues
const updates = {
    itemId: itemId,
    $unset: {
      priceSold: "", // delete
      dateSold: "", // delete
      ebayFees: "", // delete
      trackingNumber: "", // delete
      orderId: "", // delete
      shippingCost: "", // delete
      profit: "", // delete
      roi: "", // delete
      buyer: "", // delete
      daysListed: "", // delete
    },
    $set: {
      shipped: false,
      listed: true,
      sold: false,
      additionalCosts: additionalCosts,
      dateListed: dateListed,
      expectedProfit: expectedProfit,
      ebayId: ebayId,
      status: "active",
      listingAgent: "member",
      automaticReturn: false, // Mark as manual return
      returnDate: returnDate || new Date().toLocaleDateString(), // Use provided date or fallback
      lastReturnedOrder: orderId, // Track the returned order
    },
  }
  return updates
}

export default itemReListed
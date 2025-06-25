const itemReListed = (newValues) => {
const {dateListed, additionalCosts, expectedProfit, ebayId, itemId} = newValues
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
      returnDate: new Date().toLocaleDateString(), // Set return date
    },
  }
  return updates
}

export default itemReListed
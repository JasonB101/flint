const itemIsWaste = (newValues) => {
  const { additionalCosts, expectedProfit, roi, itemId, returnDate, orderId } = newValues
  
  console.log('🗑️ Processing item as waste with values:', newValues)
  
  const updates = {
    itemId: itemId,
    profit: expectedProfit,
    shipped: false,        // Item is no longer shipped (returned)
    listed: false,         // Item is not listed
    sold: false,           // Item is no longer sold (returned)
    additionalCosts: additionalCosts,
    status: "waste",
    roi: roi,
    automaticReturn: false, // Mark as manual return
    returnDate: returnDate || new Date().toLocaleDateString(), // Use provided date or fallback
    lastReturnedOrder: orderId, // Track the returned order
    
    // Clear sale data since item was returned
    priceSold: null,
    dateSold: null,
    ebayFees: null,
    trackingNumber: null,
    buyer: null,
    daysListed: null,
  }
  
  console.log('🗑️ Waste updates to be sent:', updates)
  return updates
}

export default itemIsWaste

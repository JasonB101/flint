const itemIsWaste = (newValues) => {
  const { additionalCosts, expectedProfit, roi, itemId, returnDate, orderId, buyer } = newValues
  
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
    dateWasted: new Date().toLocaleDateString(), // CRITICAL: Mark when item was wasted
    lastReturnedOrder: orderId, // Track the returned order
    
    // Clear most sale data since item was returned, but preserve buyer info
    priceSold: null,
    dateSold: null,
    ebayFees: null,
    trackingNumber: null,
    // Preserve buyer information instead of clearing it
    ...(buyer && { buyer: buyer }), // Keep buyer info if provided
    daysListed: null,
  }
  
  console.log('🗑️ Waste updates to be sent:', updates)
  return updates
}

export default itemIsWaste

const itemIsWaste = (newValues) => {
  const { additionalCosts, expectedProfit, roi, itemId } = newValues
  const updates = {
    itemId: itemId,
    profit: expectedProfit,
    shipped: true,
    listed: false,
    sold: true,
    additionalCosts: additionalCosts,
    status: "waste",
    roi: roi,
    automaticReturn: false, // Mark as manual return
    returnDate: new Date().toLocaleDateString(), // Set return date
  }
  return updates
}

export default itemIsWaste

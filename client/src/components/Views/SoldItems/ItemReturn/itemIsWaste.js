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
  }
  return updates
}

export default itemIsWaste

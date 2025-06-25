const updateAdditionalCosts = (
  originalAdditionalCosts,
  newReturnShippingCost,
  newShippingCost
) => {
  // Create a fresh copy of the original costs
  const updatedAdditionalCosts = [...originalAdditionalCosts]

  // Handle return shipping cost - ADD to existing if present
  const returnShippingIndex = updatedAdditionalCosts.findIndex(
    (cost) => cost.title === "returnShippingCost"
  )

  if (returnShippingIndex !== -1) {
    // Add to existing return shipping cost (for multiple returns)
    updatedAdditionalCosts[returnShippingIndex].amount += newReturnShippingCost
  } else if (newReturnShippingCost > 0) {
    // Create new return shipping cost entry
    updatedAdditionalCosts.push({
      title: "returnShippingCost",
      amount: newReturnShippingCost,
    })
  }

  // Handle original shipping cost - ADD to existing if present
  const shippingCostIndex = updatedAdditionalCosts.findIndex(
    (cost) => cost.title === "shippingCost"
  )

  if (shippingCostIndex !== -1) {
    // Add to existing shipping cost
    updatedAdditionalCosts[shippingCostIndex].amount += newShippingCost
  } else if (newShippingCost > 0) {
    // Create new shipping cost entry
    updatedAdditionalCosts.push({
      title: "shippingCost",
      amount: newShippingCost,
    })
  }

  return updatedAdditionalCosts
}

export default updateAdditionalCosts

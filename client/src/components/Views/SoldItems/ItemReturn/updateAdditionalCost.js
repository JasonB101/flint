const updateAdditionalCosts = (
  additionalCosts,
  returnShippingCost,
  shippingCost
) => {
  const updatedAdditionalCosts = [...additionalCosts]

  const returnShippingIndex = updatedAdditionalCosts.findIndex(
    (cost) => cost.title === "returnShippingCost"
  )

  if (returnShippingIndex !== -1) {
    updatedAdditionalCosts[returnShippingIndex].amount +=
      returnShippingCost
  } else {
    updatedAdditionalCosts.push({
      title: "returnShippingCost",
      amount: returnShippingCost,
    })
  }

  const shippingCostIndex = updatedAdditionalCosts.findIndex(
    (cost) => cost.title === "shippingCost"
  )

  if (shippingCostIndex !== -1) {
    updatedAdditionalCosts[shippingCostIndex].amount += shippingCost
  } else {
    updatedAdditionalCosts.push({
      title: "shippingCost",
      amount: shippingCost,
    })
  }

  return updatedAdditionalCosts
}

export default updateAdditionalCosts

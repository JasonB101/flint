const { figureExpectedProfit } = require("../inventoryMethods")

function priceReduction(item, settings, averageShippingCost, ebayFeePercent) {
  let newListedPrice = item.listedPrice
  let expectedProfit = item.expectedProfit
  //   console.log(item)

  const {
    manualListedPrice,
    priceReductionPercentage,
    maxPriceReduction,
    allowPriceReduction,
    daysListedUntilPriceReduction,
    allowNegativeProfit,
  } = settings
//   console.log(
//     manualListedPrice,
//     priceReductionPercentage,
//     maxPriceReduction,
//     allowPriceReduction,
//     daysListedUntilPriceReduction,
//     allowNegativeProfit
//   )

  if (!manualListedPrice) {
    const reductionInPrice = Math.min(
      +item.listedPrice * +priceReductionPercentage,
      +maxPriceReduction
    )

    const isEligibleForPriceReduction = () => {
      if (!allowPriceReduction || manualListedPrice) return false

      const timeSinceLastPriceReduction =
        new Date() - new Date(item.lastPriceReduction || item.dateListed)
      const isTimeEligible =
        timeSinceLastPriceReduction >= daysListedUntilPriceReduction * 86400000

      if (!allowNegativeProfit && expectedProfit < 3) return false

      return isTimeEligible
    }

    if (isEligibleForPriceReduction()) {
      newListedPrice = +(item.listedPrice - reductionInPrice).toFixed(2)
      expectedProfit = figureExpectedProfit(
        newListedPrice,
        item.purchasePrice,
        [], //additionalCosts
        averageShippingCost,
        ebayFeePercent
      )
    }
  } else {
    newListedPrice = manualListedPrice
    expectedProfit = figureExpectedProfit(
      newListedPrice,
      item.purchasePrice,
      [], //additionalCosts
      averageShippingCost,
      ebayFeePercent
    )
  }

  return [newListedPrice, expectedProfit]
}

module.exports = priceReduction

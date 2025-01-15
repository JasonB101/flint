const { figureExpectedProfit } = require("../inventoryMethods")

function priceReduction(item, settings, averageShippingCost, ebayFeePercent) {
  let newListedPrice = item.listedPrice
  let expectedProfit = item.expectedProfit

  const {
    manualListedPrice,
    priceReductionPercentage,
    maxPriceReduction,
    allowPriceReduction,
    daysListedUntilPriceReduction,
    allowNegativeProfit,
    ebayFeePercent,
    averageShippingCost,
  } = settings

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
      newListedPrice = item.listedPrice - reductionInPrice
      expectedProfit = figureExpectedProfit(
        newListedPrice,
        item.purchasePrice,
        averageShippingCost,
        ebayFeePercent
      )
    }
  } else {
    newListedPrice = manualListedPrice
    expectedProfit = figureExpectedProfit(
      newListedPrice,
      item.purchasePrice,
      averageShippingCost,
      ebayFeePercent
    )
  }

  return [newListedPrice, expectedProfit]
}

module.exports = priceReduction

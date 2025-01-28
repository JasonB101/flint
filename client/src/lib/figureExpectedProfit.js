function figureExpectedProfit(
    listedPrice,
    purchasePrice,
    additionalCosts = [],
    averageShippingCost,
    ebayFeePercent = 0.1135,
    estimatedTaxRate = 0.08
  ) {
    const extraCost = additionalCosts.reduce((acc, cost) => acc + cost.amount, 0);
    const taxOnListedPrice = +listedPrice * +estimatedTaxRate;
    const ebayFee = (+listedPrice + +taxOnListedPrice) * +ebayFeePercent;
    const expectedProfit = +listedPrice - +ebayFee - +averageShippingCost - +purchasePrice - +extraCost;
  
    return +expectedProfit.toFixed(2);
  }

  export default figureExpectedProfit
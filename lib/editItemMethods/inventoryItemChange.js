const InventoryItem = require("../../models/inventoryItem")

const inventoryItemChange = (
  item,
  changes,
  user
) => {
  //Changes is an array of strings with the fields to be updated
  const {averageShippingCost, ebayFeePercent} = user
  const { itemId } = item
  console.log(changes)

  const itemUpdates = {}

  changes.forEach((key) => {
    if (key === "listedPrice" || key === "purchasePrice") {
      itemUpdates.expectedProfit = calculateExpectedProfit(
        item.listedPrice,
        item.purchasePrice,
        averageShippingCost,
        ebayFeePercent
      )
    }
    itemUpdates[key] = item[key]
  })
  console.log(itemUpdates)
  try {
    InventoryItem.findOneAndUpdate(
      { _id: itemId },
      itemUpdates,
      (err, result) => {
        if (err) console.log(err)
      }
    )
  } catch (e) {
    console.log(e)
  }
}

function calculateExpectedProfit(
  listedPrice,
  purchasePrice,
  averageShippingCost,
  ebayFeePercent
) {
  //Need to find a way to determine what tier the user is on, and how much their eBay fees are.
  const ebayFee = listedPrice * ebayFeePercent
  //Need to get purchasePrice
  return +(listedPrice - ebayFee - averageShippingCost - purchasePrice).toFixed(
    2
  )
}

module.exports = inventoryItemChange

const InventoryItem = require("../../models/inventoryItem")

const inventoryItemChange = async (item, changes, user) => {
  //Changes is an array of strings with the fields to be updated
  const { averageShippingCost, ebayFeePercent } = user
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
  let success = { success: false, message: "Inventory Item change failed" } //This is an example, it will get overwritten no matter what
  try {
    let updatedItem = await InventoryItem.findOneAndUpdate(
      { _id: itemId },
      itemUpdates,
      { new: true } // Option to return the updated document
    )

    if (!updatedItem) {
      throw new Error("No item found with the provided ID")
    }

    success = { success: true }
  } catch (e) {
    console.log(e)
    success = {
      success: false,
      message: `Inventory Item change failed: ${e.message}`,
    }
  }
  return success
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

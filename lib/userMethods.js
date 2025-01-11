const InventoryItem = require("../models/inventoryItem")
const User = require("../models/user")

async function updateSellerAvgShipping(userId) {
  try {
    const result = await InventoryItem.aggregate([
      {
        $match: {
          userId: userId,
          shipped: true,
          shippingCost: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          averageShipping: { $avg: "$shippingCost" },
        },
      },
    ])

    const averageShipping = result[0]?.averageShipping || 0

    await User.findByIdAndUpdate(userId, {
      averageShippingCost: +averageShipping.toFixed(2),
    })

    return averageShipping
  } catch (error) {
    console.error("Error updating average shipping:", error)
    return 0
  }
}

module.exports = {
  updateSellerAvgShipping,
}

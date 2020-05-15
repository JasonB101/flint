const InventoryItem = require("../models/inventoryItem")
const User = require("../models/user")

async function updateSellerAvgShipping(userId) {
    const shippedItems = await InventoryItem.find({userId: userId, shipped: true})
    const avgShipping = shippedItems.reduce((avg, item) => {
        if (item.shippingCost > 0) {
            avg[0]++;
            avg[1] += item.shippingCost;
        }
        return avg;
    }, [0,0]);
    const averageShipping = (avgShipping[1] / avgShipping[0]).toFixed(2);
    User.findByIdAndUpdate(userId, {averageShippingCost: +averageShipping}, (err, result) => {
        if (err) console.log(err)
    });
}

module.exports = {
    updateSellerAvgShipping
}
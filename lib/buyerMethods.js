const Buyer = require("../models/buyer")

async function saveBuyer(buyerObject) {
    const { username, userId } = buyerObject;
    //check for buyer already, if exist, just add to "totalSales"
    const existingBuyer = await Buyer.findOne({ username: username, userId: userId })
    if (existingBuyer) {
        const updatedBuyer = await Buyer.findByIdAndUpdate(existingBuyer._id, { totalPurchases: existingBuyer.totalPurchases + 1 }, { new: true });
        return updatedBuyer;
    } else {
        const newBuyer = new Buyer(buyerObject);
        const buyer = await newBuyer.save()
        if (buyer) {
            return buyer
        } else {
            return null
        }

    }
}

module.exports = {
    saveBuyer
}
const express = require("express");
const ebayRouter = express.Router();
const User = require("../models/user");
const InventoryItem = require("../models/inventoryItem");
const {getNewListings, getCompletedSales} = require("../lib/ebayMethods")
const {updateInventoryWithSales, getInventoryItems} = require("../lib/inventoryMethods")

// GET EBAY NOW COMPLETES SALES, AND RETURNS NEW UPDATED ITEMS.
// NEED USE PAYPAL API TO GET SHIPPING COST getSaleInfo() in inventory methods.
// NEED TO HANDLE MULTIPLE QUANTITIES, use await between each itemUpdate. use InventoryItem.find() instead of findOne.
//Sort array based on the purchase date. Update the first item in the array, on the next iteration that item will now be
//set as "Sold" ;) Goodluck, ima play a video game :P Need to think about how to filter between transactions that have been recorded
//already. There may be more in inventory and the same part is counted more than once. Save the transaction ID to the item
//so when you retrieve transactions to merge, you filter the list by which transactions have not been merged. (I am your father)

ebayRouter.get("/getebay", async (req, res, next) => {
    const userId = req.user._id;
    const userInfo = await User.findById(userId);
    const user = userInfo.toObject();
    const ebayAuthToken = user.ebayToken;
    // const newListings = await getNewListings(ebayAuthToken, userId);
    const completedSales = await getCompletedSales(ebayAuthToken);
    const newSoldItems = await updateInventoryWithSales(userId, completedSales);
    const inventoryItems = await getInventoryItems(userId)
    const newListings = await getNewListings(ebayAuthToken, userId)
    const response = {
        newListings,
        newSoldItems,
        inventoryItems
    }
    res.send(response);

})

ebayRouter.put("/linkItem/:id", async (req, res, next) => {
    const { ItemID, BuyItNowPrice } = req.body;
    console.log(req.body)
    const user = await User.findById(req.user._id);
    const userObject = user.toObject();
    const { averageShippingCost } = userObject;
    const item = await InventoryItem.findById(req.params.id);
    const purchasePrice = item.toObject().purchasePrice;

    const updatedInfo = {
        listed: true,
        ebayId: ItemID,
        listedPrice: BuyItNowPrice,
        expectedProfit: figureProfit(BuyItNowPrice, purchasePrice, averageShippingCost),
        userId: req.user._id
    }
    InventoryItem.findByIdAndUpdate(req.params.id, updatedInfo, { new: true }, (err, updatedItem) => {
        if (err) {
            console.log(err)
            return res.status(500).send({ success: false, error: err })
        }
        res.send({ success: true, updatedItem })

    })

    function figureProfit(listedPrice, purchasePrice, averageShippingCost) {
        console.log(listedPrice, averageShippingCost)
        //Need to find a way to determine what tier the user is on, and how much their eBay fees are.
        const payPalFee = listedPrice * 0.029 + 0.3;
        const ebayFee = listedPrice * 0.1
        //Need to get purchasePrice
        return +(listedPrice - payPalFee - ebayFee - averageShippingCost - purchasePrice).toFixed(2);
    }
})





module.exports = ebayRouter;
const express = require("express");
const ebayRouter = express.Router();
const User = require("../models/user");
const InventoryItem = require("../models/inventoryItem");
const {updateSellerAvgShipping} = require("../lib/userMethods")
const {getEbayListings, getCompletedSales} = require("../lib/ebayMethods")
const {updateInventoryWithSales, getInventoryItems, updateAllZeroShippingCost, figureProfit, verifyCorrectPricesInInventoryItems} = require("../lib/inventoryMethods")

// GET EBAY NOW COMPLETES SALES, AND RETURNS NEW UPDATED ITEMS.
// NEED TO HANDLE MULTIPLE QUANTITIES, use await between each itemUpdate. use InventoryItem.find() instead of findOne.
//Sort array based on the purchase date. Update the first item in the array, on the next iteration that item will now be
//set as "Sold" ;) Goodluck, ima play a video game :P Need to think about how to filter between transactions that have been recorded
//already. There may be more in inventory and the same part is counted more than once. Save the transaction ID to the item
//so when you retrieve transactions to merge, you filter the list by which transactions have not been merged. (I am your father)

ebayRouter.get("/getebay", async (req, res, next) => {
    const userObject = await getUserObject(req.auth._id);
    const {_id: userId, averageShippingCost, ebayToken: ebayAuthToken, ebayOAuthToken = "0"} = userObject;
    updateAllZeroShippingCost(userId);
    updateSellerAvgShipping(userId);
    const inventoryItems = await getInventoryItems(userId);
    const ebayListings = await getEbayListings(ebayAuthToken, userId);
    //verifiedCorrectInfo is an action function, doesn't return anything usable atm
    const verifiedCorrectInfo = await verifyCorrectPricesInInventoryItems(inventoryItems, ebayListings, averageShippingCost);
    const completedSales = await getCompletedSales(ebayAuthToken);
    const newSoldItems = await updateInventoryWithSales(userId, completedSales);
    
    const response = {
        ebayListings,
        newSoldItems,
        inventoryItems,
    }
    res.send(response);

})

ebayRouter.put("/linkItem/:id", async (req, res, next) => {
    const { ItemID, BuyItNowPrice } = req.body;
    const {_id: userId, averageShippingCost} = req.user;
    console.log(req.body)
    const item = await InventoryItem.findById(req.params.id);
    const purchasePrice = item.toObject().purchasePrice;

    const updatedInfo = {
        listed: true,
        ebayId: ItemID,
        listedPrice: BuyItNowPrice,
        expectedProfit: figureProfit(BuyItNowPrice, purchasePrice, averageShippingCost),
        userId: req.auth._id
    }
    InventoryItem.findByIdAndUpdate(req.params.id, updatedInfo, { new: true }, (err, updatedItem) => {
        if (err) {
            console.log(err)
            return res.status(500).send({ success: false, error: err })
        }
        res.send({ success: true, updatedItem })

    })

})

async function getUserObject(userId){
    const userInfo = await User.findById(userId);
    return userInfo.toObject();
}




module.exports = ebayRouter;
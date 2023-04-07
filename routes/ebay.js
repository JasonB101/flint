const express = require("express");
const ebayRouter = express.Router();
const User = require("../models/user");
const InventoryItem = require("../models/inventoryItem");
const { updateSellerAvgShipping } = require("../lib/userMethods")
const { getEbayListings, getCompletedSales, getShippingTransactions } = require("../lib/ebayMethods")
const { getOAuthLink, refreshAccessToken } = require("../lib/oAuth")
const { updateInventoryWithSales, getInventoryItems, updateAllZeroShippingCost, figureProfit, verifyCorrectPricesInInventoryItems } = require("../lib/inventoryMethods")

// GET EBAY NOW COMPLETES SALES, AND RETURNS NEW UPDATED ITEMS.
// NEED TO HANDLE MULTIPLE QUANTITIES, use await between each itemUpdate. use InventoryItem.find() instead of findOne.
//Sort array based on the purchase date. Update the first item in the array, on the next iteration that item will now be
//set as "Sold" ;) Goodluck, ima play a video game :P Need to think about how to filter between transactions that have been recorded
//already. There may be more in inventory and the same part is counted more than once. Save the transaction ID to the item
//so when you retrieve transactions to merge, you filter the list by which transactions have not been merged.

ebayRouter.get("/getebay", async (req, res, next) => {
    let refreshAttempts = 0
    let data = await getEbayData() //This is clunky practice. But I think calling an async function and doing nothing afterward might be messing it up

    async function getEbayData() {
        
        const userObject = await getUserObject(req.auth._id);
        const { _id: userId, averageShippingCost, ebayToken: ebayAuthToken, ebayOAuthToken = "0", ebayRefreshOAuthToken } = userObject;
        
        try {
            let shippingTransactions = await getShippingTransactions(ebayOAuthToken)
            if (shippingTransactions.failedOAuth) throw new Error('Need to Update OAuth')
            shippingTransactions = shippingTransactions.transactions
            const [shippingUpdates, completedSales, ebayListings] = await Promise.all([
                updateAllZeroShippingCost(userId, shippingTransactions),
                getCompletedSales(ebayAuthToken),
                getEbayListings(ebayAuthToken, userId)
            ])
            // const shippingUpdates = await updateAllZeroShippingCost(userId, shippingTransactions);
            // const completedSales = await getCompletedSales(ebayAuthToken);
            const newSoldItems = await updateInventoryWithSales(userId, completedSales, shippingTransactions);
            // const ebayListings = await getEbayListings(ebayAuthToken, userId);

            let inventoryItems = await getInventoryItems(userId);

            const verifiedCorrectInfo = await verifyCorrectPricesInInventoryItems(inventoryItems, ebayListings, averageShippingCost);

            if (verifiedCorrectInfo) {
                updateSellerAvgShipping(userId);
                inventoryItems = await getInventoryItems(userId);
            }
            const response = {
                ebayListings,
                inventoryItems,
            }
            console.log("This is right before the send")
            res.send(response);
        } catch (e) {
            console.log("Access Token Expired")
            try {
                refreshAttempts++
                const newToken = await refreshAccessToken(ebayRefreshOAuthToken)
                const { success, token } = newToken
                if (!success) throw Error("Refresh Failed")
                console.log("Successfully fetched Access Token")
                User.findOneAndUpdate({ _id: userId }, { ebayOAuthToken: token }, (err, result) => {
                    if (err) console.log(err.message)
                    if (result && refreshAttempts < 2) getEbayData()
                })
            } catch (e) {
                res.send({ link: getOAuthLink() })
                console.log(e.message, 'Refresh OAUTH Error: Sending Link')

            }

        }

        return false
    }



})

ebayRouter.put("/linkItem/:id", async (req, res, next) => {
    const { ItemID, BuyItNowPrice } = req.body;
    const { _id: userId, averageShippingCost } = req.user;
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

async function getUserObject(userId) {
    const userInfo = await User.findById(userId);
    return userInfo.toObject();
}




module.exports = ebayRouter;
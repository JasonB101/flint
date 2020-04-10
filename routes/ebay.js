const express = require("express");
const ebayRouter = express.Router();
const User = require("../models/user");
const InventoryItem = require("../models/inventoryItem");
const {getNewListings, getCompletedSales} = require("../lib/ebayMethods")
const {updateInventoryWithSales} = require("../lib/inventoryMethods")

// GET EBAY NOW COMPLETES SALES, AND RETURNS NEW UPDATED ITEMS.
// NEED USE PAYPAL API TO GET SHIPPING COST getSaleInfo() in inventory methods.
// NEED TO HANDLE MULTIPLE QUANTITIES, use await between each itemUpdate. use InventoryItem.find() instead of findOne.
//Sort array based on the purchase date. Update the first item in the array, on the next iteration that item will now be
//set as "Sold" ;) Goodluck, ima play a video game :P
ebayRouter.get("/getebay", async (req, res, next) => {
    const userId = req.user._id;
    const userInfo = await User.findById(userId);
    const user = userInfo.toObject();
    const ebayAuthToken = user.ebayToken;
    // const newListings = await getNewListings(ebayAuthToken, userId);
    const completedSales = await getCompletedSales(ebayAuthToken);
    const newSoldItems = await updateInventoryWithSales(userId, completedSales);
    const inventoryItems = await InventoryItem.find({userId: userId})
    const newListings = await getNewListings(ebayAuthToken, userId)
    const response = {
        newListings,
        newSoldItems,
        inventoryItems
    }
    res.send(response);

})





module.exports = ebayRouter;
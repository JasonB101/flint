const express = require("express");
const inventoryRouter = express.Router();
const { getInventoryItems, figureProfit } = require("../lib/inventoryMethods");
const { createListing } = require("../lib/ebayMethods");
const InventoryItem = require("../models/inventoryItem");
const User = require("../models/user");



inventoryRouter.post("/", async (req, res, next) => {
    // console.log(req.body)
    const userRaw = await User.findOne({ _id: req.user._id })
    const user = userRaw.toObject();
    const { ebayToken, averageShippingCost } = user;
    const listingDetails = req.body;
    const listingResponse = await createListing(ebayToken, listingDetails)
    // console.log(listingResponse)
    const inventoryItemBody = parseInventoryObject(listingResponse, listingDetails, averageShippingCost)
    if (inventoryItemBody.ebayId) {
        let inventoryItem = new InventoryItem(inventoryItemBody);
        inventoryItem.userId = req.user._id;
        inventoryItem.save((err, item) => {
            if (err) {
                console.log(err.message)
                console.log(req.body)
                return res.status(500).send({ success: false, message: "Failed while trying to save item into database." })
            }
            else return res.send({ success: true, item })
        });
    }

    res.status(500).send({success: false, message: "Ebay listing was not created."})

});

inventoryRouter.post("/massImport", (req, res, next) => {
    let inventoryItem = new InventoryItem(req.body);
    inventoryItem.userId = req.user._id;
    inventoryItem.save((err, item) => {
        if (err) {
            console.log(err.message)
            console.log(req.body)
            return res.status(500).send({ success: false })
        }
        else res.send({ success: true, item })
    });

})



inventoryRouter.get("/", async (req, res, next) => {
    const userId = req.user._id
    try {
        const items = await getInventoryItems(userId)
        return res.send(items);
    } catch (e) {
        console.log(e)
        return res.status(500).send({ success: false, message: "Server Error" })
    }

})

inventoryRouter.put("/:id", (req, res, next) => {
    InventoryItem.findByIdAndUpdate({ _id: req.params.id }, { notify: req.body.value }, (err, item) => {
        if (err) res.status(503).send({ success: false, message: err.message })
        else res.send({ success: true })
    });

})

inventoryRouter.delete("/:id", (req, res, next) => {
    InventoryItem.findByIdAndDelete({ _id: req.params.id }, (err, item) => {
        if (err) res.status(503).send({ success: false, message: "Server Error" })
        else res.send({ success: true })
    })
})

function parseInventoryObject(listingResponse, listingDetails, averageShipping) {
    const { title, partNo, sku, listPrice: listedPrice, location,
        datePurchased, purchasePrice, purchaseLocation } = listingDetails;
    const { AddFixedPriceItemResponse: { ItemID: ebayId } } = listingResponse;
    //may have to suck the listing fees out of this object someday as well
    const inventoryItemBody = {
        title, partNo, sku, listedPrice, location, datePurchased, purchasePrice,
        purchaseLocation,
        ebayId,
        listed: true,
        expectedProfit: figureProfit(listedPrice, purchasePrice, averageShipping),

    }
    return inventoryItemBody
}

module.exports = inventoryRouter
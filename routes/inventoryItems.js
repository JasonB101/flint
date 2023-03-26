const express = require("express");
const inventoryRouter = express.Router();
const { getInventoryItems, figureProfit, updateUnlisted } = require("../lib/inventoryMethods");
const { createListing } = require("../lib/ebayMethods");
const InventoryItem = require("../models/inventoryItem");
const User = require("../models/user");



inventoryRouter.post("/", async (req, res, next) => {
    // console.log(req.body)
    const userRaw = await User.findOne({ _id: req.auth._id })
    const user = userRaw.toObject();
    const { ebayToken, averageShippingCost } = user;
    const listingDetails = req.body;
    const listingResponse = await createListing(ebayToken, listingDetails)
    // console.log(listingResponse)
    const inventoryItemBody = parseInventoryObject(listingResponse, listingDetails, averageShippingCost)
    if (inventoryItemBody.ebayId) {
        let inventoryItem = new InventoryItem(inventoryItemBody);
        inventoryItem.userId = req.auth._id;
        inventoryItem.save((err, item) => {
            if (err) {
                console.log(err.message)
                console.log(req.body)
                res.status(500).send({ success: false, message: "Failed while trying to save item into database." })
            }
            else res.send({ success: true, item })
        });
    } else {
        return res.status(500).send({ success: false, message: "Ebay listing was not created." })
    }

});

inventoryRouter.put("/update", (req, res, next) => {
    const {id, updates} = req.body
    InventoryItem.findOneAndUpdate({_id: id}, updates, (err, result)=>{
        if (err) res.send({success: false, message: err.message})
        if (result) res.send({success: true, result})
    })
})

inventoryRouter.post("/updateUnlisted", (req, res, next) => {
    let ebayIds = req.body.ids
    updateUnlisted(ebayIds)
})


inventoryRouter.post("/massImport", (req, res, next) => {
    let inventoryItem = new InventoryItem(req.body);
    inventoryItem.userId = req.auth._id;
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
    const userId = req.auth._id
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
        datePurchased, purchasePrice, purchaseLocation, categoryId, brand } = listingDetails;
    const { AddFixedPriceItemResponse: { ItemID: ebayId } } = listingResponse;
    //may have to suck the listing fees out of this object someday as well
    const inventoryItemBody = {
        title, partNo, sku, listedPrice, location, datePurchased, purchasePrice,
        purchaseLocation,
        categoryId,
        ebayId,
        brand,
        shippingService,
        listed: true,
        expectedProfit: figureProfit(listedPrice, purchasePrice, averageShipping),

    }
    return inventoryItemBody
}

module.exports = inventoryRouter
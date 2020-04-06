const express = require("express")
const inventoryRouter = express.Router()
const InventoryItem = require("../models/inventoryItem")



inventoryRouter.post("/", (req, res, next) => {
    let inventoryItem  = new InventoryItem(req.body);
    inventoryItem.userId = req.user._id;
    inventoryItem.save((err, item) => {
        if (err) console.log(err.message)
        else res.send({ success: true, item })
    });

})

inventoryRouter.get("/", (req, res, next) => {
    let userId = req.user._id;
    InventoryItem.find({ userId: userId }, (err, list) => {
        if (err) res.status(503).send({ success: false, message: "Server Error" })
        else res.send(list)
    })
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

module.exports = inventoryRouter
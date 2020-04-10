const express = require("express")
const inventoryRouter = express.Router()
const InventoryItem = require("../models/inventoryItem")
const Buyer = require("../models/buyer")


inventoryRouter.post("/", (req, res, next) => {
    let inventoryItem = new InventoryItem(req.body);
    inventoryItem.userId = req.user._id;
    inventoryItem.save((err, item) => {
        if (err) console.log(err.message)
        else res.send({ success: true, item })
    });

})

inventoryRouter.get("/", async (req, res, next) => {
    try {
        const userId = req.user._id;
        const inventoryList = await InventoryItem.find({ userId: userId }); //array
        const buyers = await Buyer.find(); //array
        const modifiedList = inventoryList.map(item => {
            let buyer = buyers.find(x => {
                return (String(x._id) === String(item.buyer) && String(x.userId) === String(userId))
            })
            if (buyer) {
                item.buyer = buyer;
            }
            return item;
        })
        return res.send(modifiedList);
    } catch (e) {
        console.log(e)
        return res.status(500).send({success: false, message: "Server Error"})
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

module.exports = inventoryRouter
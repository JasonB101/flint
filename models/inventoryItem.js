const mongoose = require("mongoose")
const Schema = mongoose.Schema

const inventoryItemSchema = new Schema({
    item: {
        type: String,
        required: true
    },
    partNo: String,
    sku: String,
    listed: {
        type: Boolean,
        default: false
    },
    ebayId: {
        type: String,
        default: ""
    },
    location: String,
    datePurchased: {
        type: String,
        required: true
    },
    purchaseLocation: {
        type: String,
        required: true
    },
    purchasePrice: {
        type: Number,
        required: true
    },
    listedPrice: {
        type: Number,
        default: 0
    },
    expectedProfit: {
        type: Number,
        default: 0
    },
    priceSold: {
        type: String,
        default: 0
    },
    dateSold: String,
    shippingCost: Number,
    ebayFees: Number,
    payPalFees: Number,
    profit: Number,
    status:{
        type: String,
        default: "active"
        //sold
        //active
        //waste
    },
    imgUrl: String,
    trackingNumber: {
        type: String
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }

})

module.exports = mongoose.model("InventoryItem", inventoryItemSchema)
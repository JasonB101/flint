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
    priceSold: {
        type: String,
        default: 0
    },
    dateSold: String,
    shippingCost:{
        type: Number,
        default: 0
    },
    ebayFees: Number,
    payPalFees: Number,
    profit: Number,
    shipped: {
        type: Boolean,
        default: false
    },
    sold: {
        type: Boolean,
        default: false
    },
    status:{
        type: String,
        default: "active"
        //sold
        //active
        //waste
    },
    imgUrl: String,
    trackingNumber: String,
    buyer: {
        type: Schema.Types.ObjectId,
        ref: 'Buyer'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }

})

module.exports = mongoose.model("InventoryItem", inventoryItemSchema)
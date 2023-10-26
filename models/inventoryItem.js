const mongoose = require("mongoose")
const Schema = mongoose.Schema

const inventoryItemSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    partNo: String,
    sku: String,
    listed: {
        type: Boolean,
        default: false
    },
    brand: String,
    ebayId: {
        type: String,
        default: ""
    },
    location: String,
    datePurchased: {
        type: String,
        required: true
    },
    categoryId: String,
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
        type: Number,
        default: 0
    },
    dateSold: String,
    shippingCost:{
        type: Number,
        default: 0
    },
    shippingService: String,
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
    dateListed: String,
    dateReListed: String,
    imgUrl: String,
    trackingNumber: String,
    orderId: String,
    buyer: {
        type: Schema.Types.ObjectId,
        //need to only collect username
        ref: 'Buyer'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }

})

module.exports = mongoose.model("InventoryItem", inventoryItemSchema)
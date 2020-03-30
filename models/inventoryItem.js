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
    location: String,
    datePurchased: {
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
    userId: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }
    
})

module.exports = mongoose.model("InventoryItem", inventoryItemSchema)
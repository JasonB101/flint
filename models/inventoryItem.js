const mongoose = require("mongoose")
const Schema = mongoose.Schema

const inventoryItemSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  partNo: String,
  sku: String,
  listed: {
    type: Boolean,
    default: false,
  },
  brand: {
    type: String,
    default: ""
  },
  ebayId: {
    type: String,
    default: "",
  },
  location: String,
  datePurchased: {
    type: String,
    required: true,
  },
  categoryId: {
    type: String,
    default: ""
  },
  conditionId:{
    type: String,
    default: "3000"
  },
  conditionDescription:{
    type: String,
    default: ""
  },
  purchaseLocation: {
    type: String,
    required: true,
  },
  watchers: {
    type: Number,
    default: 0
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  listedPrice: {
    type: Number,
    default: 0,
  },
  acceptOfferHigh: {
    type: Number,
    default: 0
  },
  declineOfferLow: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: "",
  },
  dateListed: String,
  dateReListed: String,
  imgUrl: String,
  expectedProfit: {
    type: Number,
    default: 0,
  },
  priceSold: {
    type: Number,
    default: 0,
  },
  dateSold: String,
  shippingCost: {
    type: Number,
    default: 0,
  },
  shippingService: {
    type: String,
    defaut: ""
  },
  ebayFees: Number,
  additionalCosts: Number, //Return cost, 1st time shipping cost etc
  payPalFees: Number,
  profit: Number,
  roi: Number,
  shipped: {
    type: Boolean,
    default: false,
  },
  sold: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "active",
    //sold
    //active
    //waste
  },
  trackingNumber: String,
  orderId: String,
  buyer: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
})


module.exports = mongoose.model("InventoryItem", inventoryItemSchema)

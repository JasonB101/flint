const mongoose = require("mongoose")
const Schema = mongoose.Schema

const churnSettingsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priceReductionPercentage: {
    type: Number,
    default: 0.1,
    min: 0.01,
    max: 0.5
  },
  daysListedUntilPriceReduction: {
    type: Number,
    default: 50,
    min: 1,
    max: 90
  },
  churnEnabled: {
    type: Boolean,
    default: true
  },
  allowPriceReduction: {
    type: Boolean,
    default: true
  },
  allowNegativeProfit: {
    type: Boolean,
    default: false
  },
  allowReListWithWatchers: {
    type: Boolean,
    default: false
  },
  quantityToReList: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  maxPriceReduction: {
    type: Number,
    default: 30,
    min: 5,
    max: 100
  },
  listingAgent: {
    type: String,
    default: 'churn'
  }
}, {
  timestamps: true
})

module.exports = mongoose.model("ChurnSettings", churnSettingsSchema)
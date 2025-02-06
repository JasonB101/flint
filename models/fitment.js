const mongoose = require("mongoose")
const Schema = mongoose.Schema

const fitmentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  partNumber: {
    type: String,
    required: true
  },
  compatibilityList: {
    type: Array,
    required: true
  }
})

module.exports = mongoose.model("Fitment", fitmentSchema)
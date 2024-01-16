const mongoose = require("mongoose")
const Schema = mongoose.Schema

const huntedKeywordScheme = new Schema({
   date: String,
   keyword: String,
   maxWilling: Number,
   userId: {
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
},
})

module.exports = mongoose.model("HuntedKeyword", huntedKeywordScheme)

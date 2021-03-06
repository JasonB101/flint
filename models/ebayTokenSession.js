const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ebayTokenSessionSchema = new Schema({
    sessionId: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        unique: true
    },
    date: String
})

module.exports = mongoose.model("EbayTokenSession", ebayTokenSessionSchema)
const mongoose = require("mongoose")
const Schema = mongoose.Schema

const buyerSchema = new Schema({
    username: { //<UserID>marcmoren_152</UserID>
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    buyerFirstName: String,
    buyerLastName: String,
    email: String,
    feedbackScore: Number,
    feedbackPercent: Number,
    memberSince: String, //<RegistrationDate>2018-01-28T20:29:23.000Z</RegistrationDate>
    phone: String,
    totalPurchases: {
        type: Number,
        default: 1
    },
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        state: String,
        country: String, //<CountryName>United States</CountryName>
        zip: String
    }


})

module.exports = mongoose.model("Buyer", buyerSchema)

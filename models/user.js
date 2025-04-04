const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require("bcrypt")

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: Number
    },
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    averageShippingCost: {
        type: Number,
        default: 14
    },
    syncedWithEbay: {
        type: Boolean,
        default: false
    },
    ebayFeePercent: {
        type: Number,
        default: 0.1
    },
    userDescriptionTemplate: String,
    postalCode: Number,
    notifications: Array,
    ebayToken: String,
    ebayOAuthToken: String,
    ebayRefreshOAuthToken: String,
    OAuthActive: Boolean,
})

userSchema.pre("save", function (next) {
    const user = this
    if (!user.isModified("password")) return next()
bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) return next(err)
    user.password = hash
    next()
})
})

userSchema.methods.withoutSensitiveInfo = function () {
    const user = this.toObject()
    delete user.password
    delete user.email
    delete user.lname
    delete user.ebayToken
    delete user.ebayOAuthToken
    delete user.ebayRefreshOAuthToken
    return user
}

userSchema.methods.checkPassword = function (passwordAttempt, callback) {
    bcrypt.compare(passwordAttempt, this.password, (err, isMatch) => {
        if (err) return callback(err)
        callback(null, isMatch)
    })
}

module.exports = mongoose.model("User", userSchema)
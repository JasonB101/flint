const express = require("express");
const syncPayPalRouter = express.Router();
const {getAccessToken} = require("../lib/payPalMethods")

syncPayPalRouter.get("/getAccessToken", (req, res, next) => {
    getAccessToken(req, res)
})
module.exports = syncPayPalRouter
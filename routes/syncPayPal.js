const express = require("express");
const syncPayPalRouter = express.Router();
const { setAccessToken } = require("../lib/payPalMethods")

syncPayPalRouter.get("/setAccessToken", async (req, res, next) => {
    const data = await setAccessToken(req.auth._id);
    if (data.success) {
        return res.send(data)
    } else {
        return res.status(500).send(data)
    }
})
module.exports = syncPayPalRouter
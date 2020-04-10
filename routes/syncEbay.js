const express = require("express");
const syncRouter = express.Router();
const axios = require('axios');
const parseString = require('xml2js').parseString;
const InventoryItem = require("../models/inventoryItem");
const User = require("../models/user");
const EbayTokenSession = require("../models/ebayTokenSession");

const {saveBuyer} = require("../lib/buyerMethods")
require("dotenv").config()

syncRouter.get("/gettokenlink", async (req, res, next) => {
    //Check to see if there is already a session open and remove it for this user.
    await EbayTokenSession.findOneAndRemove({ userId: req.user._id }, (err, result) => {
        if (err) console.log(err)
        console.log(result)
    })
    const queryString = `<?xml version="1.0" encoding="utf-8"?>
    <GetSessionIDRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RuName>${process.env.RU_NAME}</RuName>
    </GetSessionIDRequest>`;

    const config = {
        headers: {
            'X-EBAY-API-APP-NAME': process.env.EBAY_API_APP_NAME,
            'X-EBAY-API-DEV-NAME': process.env.EBAY_API_DEV_NAME,
            'X-EBAY-API-CERT-NAME': process.env.EBAY_API_CERT_NAME,
            'Content-Type': 'text/xml',
            'X-EBAY-API-COMPATIBILITY-LEVEL': 967,
            'X-EBAY-API-CALL-NAME': 'GetSessionID',
            'X-EBAY-API-SITEID': 0
        }
    }

    const ebayRequest = await axios.post(process.env.EBAY_API_URL, queryString, config);
    const data = ebayRequest.data;

    try {
        parseString(data, { explicitArray: false, ignoreAttrs: true }, async function (err, result) {
            if (err) res.status(500).send(err);
            const sessionId = result.GetSessionIDResponse.SessionID;
            const signInLink = `https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&runame=${process.env.RU_NAME}&SessID=${sessionId}`;
            const newSession = new EbayTokenSession({
                sessionId: sessionId,
                userId: req.user._id,
                date: new Date().toLocaleDateString()
            })
            newSession.save((err, session) => {
                if (err) return res.status(500).send({ success: false, err })
                return res.status(200).send(signInLink)
            })
        })
    } catch (e) {

        console.log(e)
        return res.status(500).send(e)
    }


})

syncRouter.put("/linkItem/:id", async (req, res, next) => {
    const { ItemID, BuyItNowPrice } = req.body;
    console.log(req.body)
    const user = await User.findById(req.user._id);
    const userObject = user.toObject();
    const { averageShippingCost } = userObject;
    const item = await InventoryItem.findById(req.params.id);
    const purchasePrice = item.toObject().purchasePrice;

    const updatedInfo = {
        listed: true,
        ebayId: ItemID,
        listedPrice: BuyItNowPrice,
        expectedProfit: figureProfit(BuyItNowPrice, purchasePrice, averageShippingCost),
        userId: req.user._id
    }
    InventoryItem.findByIdAndUpdate(req.params.id, updatedInfo, { new: true }, (err, updatedItem) => {
        if (err) {
            console.log(err)
            return res.status(500).send({ success: false, error: err })
        }
        res.send({ success: true, updatedItem })

    })

    function figureProfit(listedPrice, purchasePrice, averageShippingCost) {
        console.log(listedPrice, averageShippingCost)
        //Need to find a way to determine what tier the user is on, and how much their eBay fees are.
        const payPalFee = listedPrice * 0.029 + 0.3;
        const ebayFee = listedPrice * 0.1
        //Need to get purchasePrice
        return +(listedPrice - payPalFee - ebayFee - averageShippingCost - purchasePrice).toFixed(2);
    }
})

syncRouter.post("/setebaytoken", async (req, res, next) => {
    //This does a post request with no data, uses the req.user._id to get the sessionId for current user. Then does the request
    //to ebay to get the ebayToken, and then saves that ebay token in the user's collection. Need to design all this ish better. 
    const userId = req.user._id

    try {
        const session = await EbayTokenSession.find({ userId: userId })
        const sessionId = session[0].sessionId;
        const ebaySessionsId = session[0]._id;
        const tokenData = await requestEbayToken(sessionId);
        if (tokenData) {

            parseString(tokenData, { explicitArray: false, ignoreAttrs: true }, async function (err, result) {
                if (err) {
                    console.log(err)
                    return res.status(500).send(err)
                }

                const ebayToken = result.FetchTokenResponse.eBayAuthToken;
                User.findByIdAndUpdate(userId, { ebayToken: ebayToken, syncedWithEbay: true }, { new: true }, (err, result) => {
                    if (err) console.log(err);
                    EbayTokenSession.findByIdAndRemove(ebaySessionsId, (err, result) => {
                        if (err) console.log(err)
                    })
                    return res.send({ success: true, user: result })
                })
            })
        } else {
            return res.status(500).send({ success: false, message: "tokenData is null, sessionId may be expired" })
        }

    } catch (e) {
        console.log(e)
        res.status(500).send({ success: false, message: "Failed in the try catch block" })
    }

})

async function requestEbayToken(sessionId) {
    const queryString = `<?xml version="1.0" encoding="utf-8"?>
<FetchTokenRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <SessionID>${sessionId}</SessionID>
</FetchTokenRequest>`
    const callName = "FetchToken";
    const tokenRequest = await ebayApplicationRequest(callName, queryString);
    return tokenRequest;
}


async function ebayApplicationRequest(callName, query) {
    try {
        const config = {
            headers: {
                'X-EBAY-API-APP-NAME': process.env.EBAY_API_APP_NAME,
                'X-EBAY-API-DEV-NAME': process.env.EBAY_API_DEV_NAME,
                'X-EBAY-API-CERT-NAME': process.env.EBAY_API_CERT_NAME,
                'Content-Type': 'text/xml',
                'X-EBAY-API-COMPATIBILITY-LEVEL': 967,
                'X-EBAY-API-CALL-NAME': callName,
                'X-EBAY-API-SITEID': 0
            }
        }

        const ebayRequest = await axios.post(process.env.EBAY_API_URL, query, config);
        const data = ebayRequest.data;
        return data;
    } catch (e) {
        console.log(e)
        return null;
    }

}






module.exports = syncRouter

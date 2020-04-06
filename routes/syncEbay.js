const express = require("express");
const syncRouter = express.Router();
const axios = require('axios');
const parseString = require('xml2js').parseString;
const InventoryItem = require("../models/inventoryItem");
const User = require("../models/user");
const EbayTokenSession = require("../models/ebayTokenSession");
require("dotenv").config()

syncRouter.get("/gettokenlink", async (req, res, next) => {
    if (req.user) {

    }
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
            const signInLink = `https://www.ebay.com/ws/eBayISAPI.dll?SignIn&runame=${process.env.RU_NAME}&SessID=${sessionId}`;

            const newSession = new EbayTokenSession({
                sessionId: sessionId,
                userId: req.user._id
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

syncRouter.get("/getNewListings", async (req, res, next) => {
    //Need to get this token
    const ebayAuthToken = "AgAAAA**AQAAAA**aAAAAA**m3qBXg**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6AGl4OgDJaBpw6dj6x9nY+seQ**aa8FAA**AAMAAA**Lwzxzmaa/bfkcjTMolhW3z34n7PDdh2lgSMzJj5UUFjvCGLxa6wjn4vPYOUXO8HSEGjPOl0ZiB72Kr0YD4ndz8BbTqzXptlrFHmM9tNUq/uSzjB1rbzzeaYV5XcqLw0BBBxadmhozzBeICOypB2ghmusPH76N22WDEoQMMJuhATBoIuUuOBam2gyavzQMyFHwiZISGVGTmS28qr/sqK/MUTt4Ris4MhXDinTZvfzdBOOV92qP62y2nPi87T1BU/oYE9DywHVF99MRqJAL9FLunZMaRbOkY1Dj81zCbegyQUeYjZWnRzcp/+nxwhwgDIZPpFJtC/0Yy8VAwRO4vWO+3CR/0CbYAku6d+dNAWGCZPITpO737XiH458dzopD2VVgn9YC0catxFG8AcQoQl7JrpMAsirsTwTbuy68DWi3ulquxUZ5quf4ivtIhkJm0aFXR3hOT1IvzSmcAHkZ12HND5Dxs6K9rP26dacNxKFaP2ucjbplpNnLoSnZEJSKq8lZlAzYv/QDgBCWQ9NL6r9oQ3FZrcmeIkk2EL+4+YgkYSzpOEWl33sRKiiXQqSIlRqDIalUe5PPtoAIa5/pKZrCrFa8sorF4YgIby1zX+DxsJp/p7Yhg+Lvel6AfA7ZWth0DdvnSPX0nFa02RRFOwhpW1dm/cx2Z3DLmpd+wNZXvAOJSX3EQw9Oj8QvH4T6jTvvdDCP+mo6tqVHnHlq1UnWduCfgK33VAUZdTnwqJSs4wGxN2pjBVT0QeZM2fbk0bf"
    const queryString = `<?xml version="1.0" encoding="utf-8"?>
    <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${ebayAuthToken}</eBayAuthToken>
      </RequesterCredentials>
        <ErrorLanguage>en_US</ErrorLanguage>
        <WarningLevel>High</WarningLevel>
      <ActiveList>
        <Sort>TimeLeft</Sort>
        <Pagination>
          <EntriesPerPage>200</EntriesPerPage>
          <PageNumber>1</PageNumber>
        </Pagination>
      </ActiveList>
    </GetMyeBaySellingRequest>`

    const config = {
        headers: {
            'Content-Type': 'text/xml',
            'X-EBAY-API-COMPATIBILITY-LEVEL': 967,
            'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
            'X-EBAY-API-SITEID': 0
        }
    }

    const ebayRequest = await axios.post(process.env.EBAY_API_URL, queryString, config);
    const data = ebayRequest.data;

    try {
        parseString(data, { explicitArray: false, ignoreAttrs: true }, async function (err, result) {
            if (err) res.status(500).send(err);
            const ebayItems = result.GetMyeBaySellingResponse.ActiveList.ItemArray.Item;
            const inventoryItems = await InventoryItem.find({ userId: req.user._id });
            const ebayIds = inventoryItems.map(x => x.ebayId);
            const newEbayListings = ebayItems.filter(x => {
                return ebayIds.indexOf(x.ItemID) === -1
            });

            res.status(200).send(newEbayListings)

        })
    } catch (e) {
        res.status(500).send(e)
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
        return listedPrice - payPalFee - ebayFee - averageShippingCost - purchasePrice;
    }
})


module.exports = syncRouter

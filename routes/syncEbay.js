const express = require("express")
const syncRouter = express.Router()
const axios = require('axios')
const parseString = require('xml2js').parseString;
const InventoryItem = require("../models/inventoryItem")


syncRouter.get("/getNewListings", async (req, res, next) => {

    const url = "https://api.ebay.com/ws/api.dll"
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

    const ebayRequest = await axios.post(url, queryString, config);
    const data = ebayRequest.data;

    try {
        parseString(data, { explicitArray: false, ignoreAttrs: true }, async function (err, result) {
            if (err) res.status(500).send(err);
            const ebayItems = result.GetMyeBaySellingResponse.ActiveList.ItemArray.Item;
            const inventoryItems = await InventoryItem.find({userId: req.user._id});
            const ebayIds = inventoryItems.map(x => x.ebayId);
            const newEbayListings = ebayItems.filter(x => {
                return ebayIds.indexOf(x.ItemID) === -1
            });

            res.status(200).send(newEbayListings)

            //update Inventory with 
        })
    } catch (e) {
        res.status(500).send(e)
    }
})


module.exports = syncRouter

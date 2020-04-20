const InventoryItem = require("../models/inventoryItem");
const { ebayXMLRequest } = require("../lib/ebayCallAndParse");

async function getCompletedSales(ebayAuthToken) {
    const config = {
        headers: {
            'Content-Type': 'text/xml',
            'X-EBAY-API-COMPATIBILITY-LEVEL': 967,
            'X-EBAY-API-CALL-NAME': 'GetSellerTransactions',
            'X-EBAY-API-SITEID': 0
        }
    }
    const queryString = `<?xml version="1.0" encoding="utf-8"?>
    <GetSellerTransactionsRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${ebayAuthToken}</eBayAuthToken>
      </RequesterCredentials>
        <ErrorLanguage>en_US</ErrorLanguage>
        <WarningLevel>High</WarningLevel>
      <IncludeFinalValueFee>True</IncludeFinalValueFee>
      <IncludeContainingOrder>True</IncludeContainingOrder>
      <DetailLevel>ReturnAll</DetailLevel>
      <NumberOfDays>3</NumberOfDays>
      <Pagination>
        <EntriesPerPage>200</EntriesPerPage>
        <PageNumber>1</PageNumber>
      </Pagination>
    </GetSellerTransactionsRequest>`;
    //Can only get up to 30 days ago. Items returned in array should be sold and paid for.
    //Ebay Request is returned parsed and cleaned
    try {
        const data = await ebayXMLRequest(process.env.EBAY_API_URL, queryString, config);
        if (data) {
            return data.GetSellerTransactionsResponse.TransactionArray.Transaction
        }

    } catch (e) {
        console.log(e)
        return [];
    }


    //Oneday I need to worry about "HasMoreTransactions" for more than 200 entries per page


}

async function getNewListings(ebayAuthToken, userId) {
    const config = {
        headers: {
            'Content-Type': 'text/xml',
            'X-EBAY-API-COMPATIBILITY-LEVEL': 967,
            'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
            'X-EBAY-API-SITEID': 0
        }
    }
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
 </GetMyeBaySellingRequest>`;
    // NEED TO REMEMBER, this will only send 200 active listings in one request. Need to setup a system for paganation.


    //Ebay Request is returned parsed and cleaned
    try {
        const data = await ebayXMLRequest(process.env.EBAY_API_URL, queryString, config);

        //Then I check all of the user's inventory and find new ebay id.
        const ebayItems = data.GetMyeBaySellingResponse.ActiveList.ItemArray.Item;
        const inventoryItems = await InventoryItem.find({ userId: userId });
        const ebayIds = inventoryItems.map(x => x.ebayId);
        const newEbayListings = ebayItems.filter(x => {
            return ebayIds.indexOf(x.ItemID) === -1
        });
        const modifiedEbayListings = newEbayListings.map(x => {
            x.BuyItNowPrice = x.BuyItNowPrice["$t"];
            return x;
        })

        return modifiedEbayListings;
    } catch (e) {
        console.log(e);
        return [];
    }


}


module.exports = {
    getCompletedSales,
    getNewListings
}
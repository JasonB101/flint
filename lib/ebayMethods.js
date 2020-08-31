const InventoryItem = require("../models/inventoryItem");
const createEbayListingTemplate = require("../lib/createEbayListingTemplate")
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


    //Oneday I need to worry about "HasMoreTransactions" for more than 200 listings returned.


}

async function getEbayListings(ebayAuthToken) {
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
        console.log(data);
        const ebayItems = data.GetMyeBaySellingResponse.ActiveList.ItemArray.Item;
        const modifiedEbayListings = ebayItems.map(x => {
            x.BuyItNowPrice = x.BuyItNowPrice["$t"];
            return x;
        })

        return modifiedEbayListings;
    } catch (e) {
        console.log(e);
        return [];
    }


}

async function createListing(ebayAuthToken, listingDetails) {
    const returnPolicyDays = 30;
    const payPalAddress = 'jason.brown91@outlook.com';
    const postalCode = 84067;
    const quantity = 1;
    const { title, brand, mpn, sku, listPrice, conditionId, conditionDescription, acceptOfferHigh, declineOfferLow, description,
        categoryId, partNo } = listingDetails;
    const config = {
        headers: {
            'Content-Type': 'text/xml',
            'X-EBAY-API-SITEID': 100,
            'X-EBAY-API-COMPATIBILITY-LEVEL': 967,
            'X-EBAY-API-CALL-NAME': 'AddFixedPriceItem'
        }
    }
    const queryString = `<?xml version="1.0" encoding="utf-8"?>
    <AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${ebayAuthToken}</eBayAuthToken>
      </RequesterCredentials>
        <ErrorLanguage>en_US</ErrorLanguage>
        <WarningLevel>High</WarningLevel>
        <Item>
            <Title>${title}</Title>
            <SKU>${sku}</SKU>
            <BestOfferDetails>
                <BestOfferEnabled>true</BestOfferEnabled>
            </BestOfferDetails>
            <ConditionDescription>${conditionDescription}</ConditionDescription>
            <ListingDetails>
                <BestOfferAutoAcceptPrice>${acceptOfferHigh}</BestOfferAutoAcceptPrice>
                <MinimumBestOfferPrice>${declineOfferLow}</MinimumBestOfferPrice>
            </ListingDetails>
            <ItemSpecifics>
                <NameValueList>
                    <Name>Brand</Name>
                    <Value>${brand}</Value>
                </NameValueList>
                <NameValueList>
                    <Name>Manufacturer Part Number</Name>
                    <Value>${mpn}</Value>
                </NameValueList>
            </ItemSpecifics>
            <PrimaryCategory>
                <CategoryID>${categoryId}</CategoryID> 
            </PrimaryCategory>			
            <StartPrice>${listPrice}</StartPrice>
            <Description><![CDATA[${createEbayListingTemplate(title, partNo, description)}]]></Description>
            <CategoryMappingAllowed>true</CategoryMappingAllowed>
            <ConditionID>${conditionId}</ConditionID>
            <Country>US</Country>
            <Currency>USD</Currency>
            <DispatchTimeMax>1</DispatchTimeMax>
            <ListingDuration>GTC</ListingDuration>
            <ListingType>FixedPriceItem</ListingType>
            <PaymentMethods>PayPal</PaymentMethods>
            <PayPalEmailAddress>${payPalAddress}</PayPalEmailAddress>
            <PostalCode>${postalCode}</PostalCode>
            <ProductListingDetails>
                <UPC></UPC>
                <IncludeStockPhotoURL>false</IncludeStockPhotoURL>
                <IncludeeBayProductDetails>true</IncludeeBayProductDetails>
                <UseFirstProduct>false</UseFirstProduct>
                <UseStockPhotoURLAsGallery>false</UseStockPhotoURLAsGallery>
                <ReturnSearchResultOnDuplicates>true</ReturnSearchResultOnDuplicates>
            </ProductListingDetails>
            <Quantity>${quantity}</Quantity>
            <ReturnPolicy>
                <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
                <RefundOption>MoneyBack</RefundOption>
                <ReturnsWithinOption>Days_${returnPolicyDays}</ReturnsWithinOption>
                <Description></Description>
                <ShippingCostPaidByOption>Buyer</ShippingCostPaidByOption>
            </ReturnPolicy>
            <ShippingDetails>
                <ShippingType>Flat</ShippingType>
                <ShippingServiceOptions>
                    <ShippingServicePriority>1</ShippingServicePriority>
                    <ShippingService>USPSPriority</ShippingService>
                    <FreeShipping>true</FreeShipping>
                    <ShippingServiceAdditionalCost currencyID="USD">0.00</ShippingServiceAdditionalCost>
                </ShippingServiceOptions>
            </ShippingDetails>
            <Site>US</Site>
        </Item>
    </AddFixedPriceItemRequest>`;
    try {
        const data = await ebayXMLRequest(process.env.EBAY_API_URL, queryString, config);
        if (data) {
            console.log(data)
            if (data.AddFixedPriceItemResponse.Errors){
                console.log(data.AddFixedPriceItemResponse.Errors)
            }
            return data;
        }

    } catch (e) {
        console.log(e)
        return {};
    }

}


module.exports = {
    getCompletedSales,
    getEbayListings,
    createListing
}
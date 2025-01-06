const InventoryItem = require("../models/inventoryItem")
const createEbayDescriptionTemplate = require("./createEbayDescriptionTemplate")
const { ebayXMLRequest } = require("./ebayCallAndParse")
const axios = require("axios")

async function getCompletedSales(ebayAuthToken) {
  console.log("Getting completed sales.") //THIS FUNCTION IS NO LONGER BEING USE, I HAD TO MOVE TO A RESTFUL API

  //Need to use Oatuh in param
  //Keep this function and make a new one

  const config = {
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": 967,
      "X-EBAY-API-CALL-NAME": "GetSellerTransactions",
      "X-EBAY-API-SITEID": 0,
    },
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
      <NumberOfDays>30</NumberOfDays>
      <Pagination>
        <EntriesPerPage>200</EntriesPerPage>
        <PageNumber>1</PageNumber>
      </Pagination>
    </GetSellerTransactionsRequest>`
  //Can only get up to 30 days ago. Items returned in array should be sold and paid for.
  //Ebay Request is returned parsed and cleaned
  try {
    const data = await ebayXMLRequest(
      process.env.EBAY_API_URL,
      queryString,
      config
    )
    if (data) {
      let response = data.GetSellerTransactionsResponse
      let array = response.TransactionArray.Transaction

      // Ensuring it's always an array
      let transactions = Array.isArray(array) ? array : [array]

      // Log the transactions to see the actual structure
      console.log("All Transactions:", transactions)

      // Filtering out canceled transactions
      const activeTransactions = transactions.filter((transaction) => {
        // Log each transaction's cancel status to ensure it's there
        console.log("Cancel Status:", transaction.cancelStatus)

        return transaction.cancelStatus?.cancelState !== "CANCELED"
      })

      console.log("Filtered Transactions:", activeTransactions)
      return activeTransactions
    }
  } catch (e) {
    console.log(e)
  }
  return []

  //One day I need to worry about "HasMoreTransactions" for more than 200 listings returned.
}

async function getEbayListings(ebayAuthToken) {
  const config = {
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": 967,
      "X-EBAY-API-CALL-NAME": "GetMyeBaySelling",
      "X-EBAY-API-SITEID": 0,
    },
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
 </GetMyeBaySellingRequest>`
  // NEED TO REMEMBER, this will only send 200 active listings in one request. Need to setup a system for paganation.

  //Ebay Request is returned parsed and cleaned
  try {
    const data = await ebayXMLRequest(
      process.env.EBAY_API_URL,
      queryString,
      config
    )

    //Then I check all of the user's inventory and find new ebay id.
    if (!data.GetMyeBaySellingResponse.ActiveList) {
      console.log(data)
      return []
    }
    const ebayItems = data.GetMyeBaySellingResponse.ActiveList.ItemArray.Item
    const modifiedEbayListings = ebayItems.map((x) => {
      x.BuyItNowPrice = x.BuyItNowPrice["$t"]
      return x
    })

    return modifiedEbayListings
  } catch (e) {
    console.log(e)
    return []
  }
}

async function createListing(
  ebayAuthToken,
  listingDetails,
  userDescriptionTemplate,
  imageUrls = []
) {
  const returnPolicyDays = 30
  const payPalAddress = "jason.brown91@outlook.com"
  const postalCode = 84067
  const quantity = 1
  const {
    title,
    brand,
    sku,
    listedPrice,
    conditionId,
    conditionDescription,
    acceptOfferHigh,
    declineOfferLow,
    description,
    categoryId,
    partNo,
    shippingService,
  } = listingDetails
  const config = {
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-SITEID": 100,
      "X-EBAY-API-COMPATIBILITY-LEVEL": 967,
      "X-EBAY-API-CALL-NAME": "AddFixedPriceItem",
    },
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
                    <Value>${partNo}</Value>
                </NameValueList>
            </ItemSpecifics>
            <PrimaryCategory>
                <CategoryID>${categoryId}</CategoryID> 
            </PrimaryCategory>			
            <StartPrice>${listedPrice}</StartPrice>
            <Description><![CDATA[${createEbayDescriptionTemplate(
              title,
              partNo,
              description,
              shippingService,
              userDescriptionTemplate
            )}]]></Description>
            <CategoryMappingAllowed>true</CategoryMappingAllowed>
            <ConditionID>${conditionId}</ConditionID>
            <PictureDetails>
              ${imageUrls.map((url) => `<PictureURL>${url}</PictureURL>`).join("")}
            </PictureDetails>
            <Country>US</Country>
            <Currency>USD</Currency>
            <DispatchTimeMax>1</DispatchTimeMax>
            <ListingDuration>GTC</ListingDuration>
            <ListingType>FixedPriceItem</ListingType>
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
                <ShippingCostPaidByOption>Seller</ShippingCostPaidByOption>
            </ReturnPolicy>
            <ShippingDetails>
                <ShippingType>Flat</ShippingType>
                <ShippingServiceOptions>
                    <ShippingServicePriority>1</ShippingServicePriority>
                    <ShippingService>${shippingService}</ShippingService>
                    <FreeShipping>true</FreeShipping>
                    <ShippingServiceAdditionalCost currencyID="USD">0.00</ShippingServiceAdditionalCost>
                </ShippingServiceOptions>
            </ShippingDetails>
            <Site>US</Site>
        </Item>
    </AddFixedPriceItemRequest>`
  //Need to make an input on the new item form to choose who pays return shipping
  try {
    const data = await ebayXMLRequest(
      process.env.EBAY_API_URL,
      queryString,
      config
    )
    if (data) {
      console.log(data)
      if (data.AddFixedPriceItemResponse.Errors) {
        console.log(data.AddFixedPriceItemResponse.Errors)
      }
      return data
    }
  } catch (e) {
    console.log(e)
    return {}
  }
}

async function endListing(ebayAuthToken, itemId) {
  const endpoint = "https://api.ebay.com/ws/api.dll" // eBay Trading API endpoint
  const headers = {
    "Content-Type": "text/xml",
    "X-EBAY-API-CALL-NAME": "EndItem",
    "X-EBAY-API-SITEID": 100,
    "X-EBAY-API-COMPATIBILITY-LEVEL": 967,
    "X-EBAY-API-IAF-TOKEN": ebayAuthToken,
  }

  const body = `<?xml version="1.0" encoding="utf-8"?>
    <EndItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${ebayAuthToken}</eBayAuthToken>
      </RequesterCredentials>
      <ItemID>${itemId}</ItemID>
      <EndingReason>NotAvailable</EndingReason>
    </EndItemRequest>`

  try {
    const response = await axios.post(endpoint, body, { headers })
    const { data } = response

    // Log or parse the response data
    console.log("eBay Response:", data)

    // Check for success
    if (data.includes("<Ack>Success</Ack>")) {
      return { success: true, message: "Item ended successfully." }
    } else {
      // Extract error message from the response (if applicable)
      const errorMatch = data.match(/<ShortMessage>(.*?)<\/ShortMessage>/)
      const errorMessage = errorMatch
        ? errorMatch[1]
        : "Unknown error occurred."
      return { success: false, message: errorMessage }
    }
  } catch (error) {
    console.error("Error ending item:", error)
    return { success: false, message: error.message }
  }
}

async function getListingImages(ebayAuthToken, itemId) {
  const endpoint = "https://api.ebay.com/ws/api.dll" // eBay Trading API endpoint
  const headers = {
    "Content-Type": "text/xml",
    "X-EBAY-API-CALL-NAME": "GetItem",
    "X-EBAY-API-SITEID": 100, // Use appropriate site ID
    "X-EBAY-API-COMPATIBILITY-LEVEL": 967, // Use the latest version
    "X-EBAY-API-IAF-TOKEN": ebayAuthToken,
  }

  const body = `<?xml version="1.0" encoding="utf-8"?>
    <GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${ebayAuthToken}</eBayAuthToken>
      </RequesterCredentials>
      <ItemID>${itemId}</ItemID>
      <DetailLevel>ReturnAll</DetailLevel>
    </GetItemRequest>`

  try {
    const response = await axios.post(endpoint, body, { headers })
    const { data } = response

    // Parse the response to extract Picture URLs
    const matches = data.match(/<PictureURL>(.*?)<\/PictureURL>/g)
    const imageUrls = matches
      ? matches.map((url) => url.replace(/<\/?PictureURL>/g, ""))
      : []

    if (imageUrls.length > 0) {
      return { success: true, images: imageUrls }
    } else {
      return { success: false, message: "No images found for the listing." }
    }
  } catch (error) {
    console.error("Error fetching item images:", error)
    return { success: false, message: error.message }
  }
}

async function getShippingTransactions(ebayOAuthToken) {
  const config = {
    headers: {
      Authorization: `Bearer ${ebayOAuthToken}`,
    },
  }

  try {
    const transactions = await axios.get(
      `https://apiz.ebay.com/sell/finances/v1/transaction?filter=transactionType:{SHIPPING_LABEL}&filter=transactionDate:[${new Date(
        new Date() - 30 * 86400000
      ).toISOString()}]`,
      config
    )

    let shippingTransactions = transactions.data
      ? transactions.data.transactions
      : [] //May go away

    return { transactions: shippingTransactions, failedOAuth: false }
  } catch (e) {
    console.log(e)
    return { transactions: [], failedOAuth: true }
  }
}

module.exports = {
  getCompletedSales,
  getEbayListings,
  createListing,
  getShippingTransactions,
  endListing,
  getListingImages,
}

const createEbayDescriptionTemplate = require("../createEbayDescriptionTemplate")
const { ebayXMLRequest } = require("./ebayCallAndParse")
const axios = require("axios")
const parser = require("xml2json")

// async function getCompletedSales(ebayAuthToken) {
//   console.log("Getting completed sales.") //THIS FUNCTION IS NO LONGER BEING USE, I HAD TO MOVE TO A RESTFUL API

//   //Need to use Oatuh in param
//   //Keep this function and make a new one

//   const config = {
//     headers: {
//       "Content-Type": "text/xml",
//       "X-EBAY-API-COMPATIBILITY-LEVEL": 967,
//       "X-EBAY-API-CALL-NAME": "GetSellerTransactions",
//       "X-EBAY-API-SITEID": 0,
//     },
//   }
//   const queryString = `<?xml version="1.0" encoding="utf-8"?>
//     <GetSellerTransactionsRequest xmlns="urn:ebay:apis:eBLBaseComponents">
//       <RequesterCredentials>
//         <eBayAuthToken>${ebayAuthToken}</eBayAuthToken>
//       </RequesterCredentials>
//         <ErrorLanguage>en_US</ErrorLanguage>
//         <WarningLevel>High</WarningLevel>
//       <IncludeFinalValueFee>True</IncludeFinalValueFee>
//       <IncludeContainingOrder>True</IncludeContainingOrder>
//       <DetailLevel>ReturnAll</DetailLevel>
//       <NumberOfDays>30</NumberOfDays>
//       <Pagination>
//         <EntriesPerPage>200</EntriesPerPage>
//         <PageNumber>1</PageNumber>
//       </Pagination>
//     </GetSellerTransactionsRequest>`
//   //Can only get up to 30 days ago. Items returned in array should be sold and paid for.
//   //Ebay Request is returned parsed and cleaned
//   try {
//     const data = await ebayXMLRequest(
//       process.env.EBAY_API_URL,
//       queryString,
//       config
//     )
//     if (data) {
//       let response = data.GetSellerTransactionsResponse
//       let array = response.TransactionArray.Transaction

//       // Ensuring it's always an array
//       let transactions = Array.isArray(array) ? array : [array]

//       // Log the transactions to see the actual structure
//       console.log("All Transactions:", transactions)

//       // Filtering out canceled transactions
//       const activeTransactions = transactions.filter((transaction) => {
//         // Log each transaction's cancel status to ensure it's there
//         console.log("Cancel Status:", transaction.cancelStatus)

//         return transaction.cancelStatus?.cancelState !== "CANCELED"
//       })

//       console.log("Filtered Transactions:", activeTransactions)
//       return activeTransactions
//     }
//   } catch (e) {
//     console.log(e)
//   }
//   return []

//   //One day I need to worry about "HasMoreTransactions" for more than 200 listings returned.
// }

async function getEbayListings(ebayAuthToken) {
  const config = {
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": 967,
      "X-EBAY-API-CALL-NAME": "GetMyeBaySelling",
      "X-EBAY-API-SITEID": 0,
    },
  }

  let allListings = []
  let pageNumber = 1
  let hasMorePages = true

  while (hasMorePages) {
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
          <PageNumber>${pageNumber}</PageNumber>
        </Pagination>
      </ActiveList>
    </GetMyeBaySellingRequest>`

    try {
      const data = await ebayXMLRequest(
        process.env.EBAY_API_URL,
        queryString,
        config
      )

      // If no ActiveList is returned, break out of the loop
      if (!data.GetMyeBaySellingResponse.ActiveList) {
        console.log("No active listings found on page", pageNumber)
        break
      }

      // Extract the pagination data to determine if there are more pages
      const paginationResult =
        data.GetMyeBaySellingResponse.ActiveList.PaginationResult
      const totalPages = paginationResult.TotalNumberOfPages
      const totalEntries = paginationResult.TotalNumberOfEntries

      console.log(
        `Page ${pageNumber}/${totalPages}, Total Items: ${totalEntries}`
      )

      // Process items for this page
      let ebayItems = []
      if (
        data.GetMyeBaySellingResponse.ActiveList.ItemArray &&
        data.GetMyeBaySellingResponse.ActiveList.ItemArray.Item
      ) {
        // Handle case where only one item is returned (not an array)
        if (
          !Array.isArray(
            data.GetMyeBaySellingResponse.ActiveList.ItemArray.Item
          )
        ) {
          ebayItems = [data.GetMyeBaySellingResponse.ActiveList.ItemArray.Item]
        } else {
          ebayItems = data.GetMyeBaySellingResponse.ActiveList.ItemArray.Item
        }

        // Process the items and add to our collection
        const modifiedItems = ebayItems.map((x) => {
          if (x.BuyItNowPrice) {
            x.BuyItNowPrice = x.BuyItNowPrice["$t"]
          }
          return x
        })

        allListings = [...allListings, ...modifiedItems]
      }

      // Check if we've reached the last page
      if (pageNumber >= totalPages) {
        hasMorePages = false
      } else {
        pageNumber++
      }
    } catch (e) {
      console.log("Error fetching listings for page", pageNumber, e)
      hasMorePages = false // Stop on error
    }
  }

  console.log(`Retrieved ${allListings.length} total listings`)
  return allListings
}

async function createListing(
  ebayAuthToken,
  listingDetails,
  userDescriptionTemplate,
  postalCode,
  imageUrls = []
) {
  const returnPolicyDays = 30
  const quantity = 1
  const {
    title,
    brand,
    sku,
    listedPrice,
    conditionId = "3000",
    conditionDescription = "",
    acceptOfferHigh,
    declineOfferLow,
    description,
    categoryId,
    partNo,
    shippingService,
    compatibilities = [],
  } = listingDetails
  const config = {
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-SITEID": 100,
      "X-EBAY-API-COMPATIBILITY-LEVEL": 967,
      "X-EBAY-API-CALL-NAME": "AddFixedPriceItem",
    },
  }
  console.log(compatibilities)
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
                <BestOfferEnabled>${Boolean(
                  acceptOfferHigh || declineOfferLow
                )}</BestOfferEnabled>
            </BestOfferDetails>
            <ConditionDescription>${conditionDescription}</ConditionDescription>
            <ListingDetails>
    ${
      acceptOfferHigh
        ? `<BestOfferAutoAcceptPrice>${acceptOfferHigh}</BestOfferAutoAcceptPrice>`
        : ""
    }
    ${
      declineOfferLow
        ? `<MinimumBestOfferPrice>${declineOfferLow}</MinimumBestOfferPrice>`
        : ""
    }
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
            ${
              imageUrls && imageUrls.length > 0
                ? `<PictureDetails>
                     ${imageUrls
                       .map((url) => `<PictureURL>${url}</PictureURL>`)
                       .join("")}
                   </PictureDetails>`
                : ""
            }
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
            ${
              compatibilities.length !== 0
                ? `<ItemCompatibilityList>${buildCompatibilityList(
                    compatibilities
                  )}</ItemCompatibilityList>`
                : ""
            }
        </Item>
    </AddFixedPriceItemRequest>`
  //Need to make an input on the new item form to choose who pays return shipping
  console.log(queryString)
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
        return {
          success: false,
          message: data.AddFixedPriceItemResponse.Errors,
        }
        //Right here is when I need to catch the compatibility errors and handle them properly
        //THe lisitng is still created but the compatibility is not added
      }
      return { success: true, listingData: data }
    }
  } catch (e) {
    console.log(e)
    return { success: false, message: e.message }
  }
}

function buildCompatibilityList(compatibilities) {
  // Map each compatibility object to an XML <Compatibility> block
  const compatibilityList = compatibilities.map((item) => {
    return `
      <Compatibility>
        <NameValueList>
          <Name>Year</Name>
          <Value>${item.Year}</Value>
        </NameValueList>
        <NameValueList>
          <Name>Make</Name>
          <Value>${item.Make}</Value>
        </NameValueList>
        <NameValueList>
          <Name>Model</Name>
          <Value>${item.Model}</Value>
        </NameValueList>
        <NameValueList>
          <Name>Trim</Name>
          <Value>${item.Trim || ""}</Value>
        </NameValueList>
        <NameValueList>
          <Name>Engine</Name>
          <Value>${item.Engine || ""}</Value>
        </NameValueList>
      </Compatibility>
    `
  })

  // Combine all the individual <Compatibility> blocks into a single string
  const compatibilityListString = compatibilityList.join("")

  // Return the full XML section for compatibility
  return compatibilityListString
}

async function endListing(ebayAuthToken, ebayId) {
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
      <ItemID>${ebayId}</ItemID>
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
      // Extract error message and error code from the response
      const errorMatch = data.match(/<ShortMessage>(.*?)<\/ShortMessage>/)
      const errorCodeMatch = data.match(/<ErrorCode>(\d+)<\/ErrorCode>/)
      const errorMessage = errorMatch ? errorMatch[1] : "Unknown error occurred."
      const errorCode = errorCodeMatch ? errorCodeMatch[1] : null

      // Check if this is error 1047 (auction already closed) - treat as success
      if (errorCode === "1047" || 
          errorMessage.toLowerCase().includes("already been closed") ||
          errorMessage.toLowerCase().includes("auction has already been closed")) {
        console.log(`eBay listing ${ebayId} is already closed (Error ${errorCode}: ${errorMessage}) - treating as success`)
        return { success: true, message: "Item was already closed.", alreadyClosed: true }
      }

      return { success: false, message: errorMessage, errorCode: errorCode }
    }
  } catch (error) {
    console.error("Error ending item:", error)
    return { success: false, message: error.message }
  }
}

async function getListing(ebayAuthToken, itemId) {
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
    function parseXMLResponse(response) {
        const options = {
            coerce: false,
            sanitize: true,
            trim: true,
            arrayNotation: false
        }
        const result = parser.toJson(response, options);
        return result;
    }

    return { success: true, data: JSON.parse(parseXMLResponse(data)) } // Parse the XML response to JSON
  } catch (error) {
    console.error("Error fetching item:", error)
    return { success: false, message: error.message }
  }
}

async function getListingImages(ebayAuthToken, itemId) {
  try {
    // Reuse the getListing function to get the full item data
    const listingResponse = await getListing(ebayAuthToken, itemId)

    if (!listingResponse.success) {
      return listingResponse // Return the error from getListing
    }

    const { data } = listingResponse

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
    console.error("Error processing listing images:", error)
    return { success: false, message: error.message }
  }
}

async function getShippingTransactions(ebayOAuthToken) {
  const config = {
    headers: {
      Authorization: `Bearer ${ebayOAuthToken}`,
    },
  }
  // &filter=transactionDate:[${new Date(new Date() - 90 * 86400000).toISOString()}]
  try {
    const transactions = await axios.get(
      `https://apiz.ebay.com/sell/finances/v1/transaction?limit=200&filter=transactionType:{SHIPPING_LABEL}`,
      config
    )
    let shippingTransactions = transactions.data
      ? transactions.data.transactions
      : [] //May go away

    // Log a sample transaction to see the actual field structure
    if (shippingTransactions.length > 0) {
      console.log(`📦 Raw eBay Finance API transaction sample:`, JSON.stringify(shippingTransactions[0], null, 2))
    }

    return { transactions: shippingTransactions, failedOAuth: false }
  } catch (e) {
    console.log(e)
    return { transactions: [], failedOAuth: true }
  }
}

module.exports = {
  // getCompletedSales,
  getEbayListings,
  createListing,
  getShippingTransactions,
  endListing,
  getListingImages,
  getListing
}

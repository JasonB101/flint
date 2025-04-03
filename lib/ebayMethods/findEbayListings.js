const axios = require("axios")
require("dotenv").config()

// Sleep helper function for delays between retries
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const simplifyItemData = (item) => ({
  itemId: item.itemId[0],
  title: item.title[0],
  price: parseFloat(item.sellingStatus[0].currentPrice[0].__value__).toFixed(2),
  location: item.location[0],
  shippingType: item.shippingInfo[0].shippingType[0],
  listedOn: new Date(item.listingInfo[0].startTime[0]).toLocaleDateString(),
  viewItemURL: item.viewItemURL[0],
  galleryURL: item.galleryURL[0],
  condition: item.condition
    ? item.condition[0].conditionDisplayName[0]
    : "Unknown",
})

const findEbayListings = async (keyword) => {
  try {
    // Properly encode the keyword for URL
    const encodedKeyword = encodeURIComponent(keyword)

    console.log(`Searching eBay for keyword: ${keyword}`)

    // Implement retry logic with exponential backoff
    let retries = 3
    let delay = 2000 // Start with 2 second delay
    let lastError = null

    while (retries >= 0) {
      try {
        const response = await axios.get(
          `https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsByKeywords&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=${process.env.EBAY_API_APP_NAME}&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&sortOrder=EndTime&paginationInput.entriesPerPage=100&keywords=${encodedKeyword}`,
          {
            timeout: 15000, // 15 second timeout
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        )

        // Validate response structure
        if (
          !response.data ||
          !response.data.findItemsByKeywordsResponse ||
          !response.data.findItemsByKeywordsResponse[0]
        ) {
          console.error("Invalid eBay API response structure")
          return []
        }

        const searchResult =
          response.data.findItemsByKeywordsResponse[0].searchResult[0]

        // Check if any items were returned
        if (
          !searchResult ||
          !searchResult.item ||
          !Array.isArray(searchResult.item) ||
          searchResult.item.length === 0
        ) {
          console.log(`No items found for keyword: ${keyword}`)
          return []
        }

        const items = searchResult.item

        // Safely map items, skipping any that might cause errors
        const simplifiedItems = items
          .filter((item) => {
            try {
              // Verify the item has all required properties before processing
              return (
                item &&
                item.itemId &&
                item.title &&
                item.sellingStatus &&
                item.sellingStatus[0].currentPrice
              )
            } catch (e) {
              console.warn("Skipping invalid item:", e.message)
              return false
            }
          })
          .map((item) => {
            try {
              return simplifyItemData(item)
            } catch (e) {
              console.warn(
                `Error simplifying item ${item.itemId?.[0] || "unknown"}:`,
                e.message
              )
              return null
            }
          })
          .filter(Boolean) // Remove any null items

        // Filter by keyword presence in title
        const filteredItems = simplifiedItems.filter((item) => {
          const { title } = item
          const keywordSimple = keyword.replace(/[- ]/g, "")
          return (
            title.toLowerCase().includes(keyword.toLowerCase()) ||
            title.toLowerCase().includes(keywordSimple.toLowerCase())
          )
        })

        console.log(
          `Found ${filteredItems.length} items matching keyword: ${keyword}`
        )
        return filteredItems
      } catch (error) {
        lastError = error

        // Check if this is a rate limit error
        const isRateLimit =
          error.response?.status === 500 &&
          error.response?.data?.errorMessage?.[0]?.error?.[0]?.errorId?.[0] ===
            "10001"

        if (isRateLimit && retries > 0) {
          console.log(
            `Rate limit hit. Retrying in ${
              delay / 1000
            } seconds... (${retries} retries left)`
          )
          await sleep(delay)
          delay *= 2 // Exponential backoff
          retries--
          continue
        }

        // Not a rate limit error or we're out of retries, rethrow
        throw error
      }
    }

    // If we get here, we've exhausted retries
    throw lastError
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error(`eBay API ERROR DETAILS:`)
      console.error(`Status: ${error.response.status}`)
      console.error(
        `Headers: ${JSON.stringify(error.response.headers, null, 2)}`
      )

      if (error.response.data) {
        console.error("FULL ERROR RESPONSE:")
        console.error(JSON.stringify(error.response.data, null, 2))

        // Check for specific rate limit error
        if (error.response.status === 500) {
          const errorData = error.response.data
          if (
            errorData?.errorMessage?.[0]?.error?.[0]?.errorId?.[0] === "10001"
          ) {
            const fullMessage =
              errorData?.errorMessage?.[0]?.error?.[0]?.message?.[0] ||
              "Rate limit exceeded"
            console.error(`RATE LIMIT ERROR: ${fullMessage}`)

            // Verify your API key
            if (process.env.EBAY_API_APP_NAME) {
              console.error(
                `API Key used: ${process.env.EBAY_API_APP_NAME.substring(
                  0,
                  5
                )}...`
              )
            } else {
              console.error(
                "WARNING: EBAY_API_APP_NAME environment variable not found"
              )
            }
          }
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error(
        "eBay API request failed - no response received:",
        error.message
      )
    } else {
      // Something else caused the error
      console.error("eBay API request setup error:", error.message)
    }

    // Add more info to the error for debugging
    const enhancedError = new Error(`eBay API error: ${error.message}`)
    enhancedError.originalError = error
    enhancedError.keyword = keyword
    throw enhancedError
  }
}

module.exports = findEbayListings

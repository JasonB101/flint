const axios = require("axios")
require("dotenv").config()

const simplifyItemData = (item) => ({
  itemId: item.itemId[0],
  title: item.title[0],
  price: parseFloat(item.sellingStatus[0].currentPrice[0].__value__).toFixed(2),
  location: item.location[0],
  shippingType: item.shippingInfo[0].shippingType[0],
  listedOn: new Date(item.listingInfo[0].startTime[0]).toLocaleString(),
  viewItemURL: item.viewItemURL[0],
  galleryURL: item.galleryURL[0],
})

const findEbayListings = async (keyword) => {
  try {
    const response = await axios.get(
      `https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsByKeywords&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=${process.env.EBAY_API_APP_NAME}&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&sortOrder=EndTime&paginationInput.entriesPerPage=100&keywords=${keyword}`
    )
    const items =
      response.data.findItemsByKeywordsResponse[0].searchResult[0].item
    const simplifiedItems = items.map(simplifyItemData)

    return simplifiedItems
  } catch (error) {
    console.error("Error fetching eBay listings:", error.message)
    throw error
  }
}

module.exports = findEbayListings


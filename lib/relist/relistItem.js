const { createListing, endListing, getListingImages } = require("../ebayApi")
const priceReduction = require("./priceReduction")
const inventoryItemChange = require("../editItemMethods/inventoryItemChange")
const isValidEbayImage = (url) => {
  return url && typeof url === "string" && url.includes("ebayimg.com")
}

const relistItem = async (item, user, settings) => {
  //settings will be either the {newListedPrice} if it was done manually, or the {...churn settings} to use for relisting.
  const {
    ebayToken: ebayAuthToken,
    userDescriptionTemplate,
    postalCode,
    averageShippingCost,
    ebayFeePercent,
  } = user

  const { listingAgent } = settings

  console.log(item, ebayAuthToken, item.ebayId)

  let listingImages = await getListingImages(ebayAuthToken, item.ebayId)
  if (listingImages.success) {
    listingImages = listingImages.images.filter(isValidEbayImage)
    if (listingImages.length === 0) {
      return {
        success: false,
        message: "No valid eBay images found for listing",
      }
    }
  } else {
    return listingImages
  }

  const listingEnded = await endListing(ebayAuthToken, item.ebayId)

  if (!listingEnded.success) return listingEnded

  let [newListedPrice, expectedProfit] = priceReduction(
    item,
    settings,
    averageShippingCost,
    ebayFeePercent
  )

  const listingDetails = {
    title: item.title,
    brand: item.brand,
    sku: item.sku,
    purchasePrice: item.purchasePrice,
    listedPrice: newListedPrice, //0.1
    conditionId: item.conditionId,
    conditionDescription: item.conditionDescription,
    acceptOfferHigh:
      expectedProfit < 20 && expectedProfit > 10
        ? (+newListedPrice - 4.99).toFixed(2)
        : expectedProfit < 10
        ? null
        : (+newListedPrice - 9.99).toFixed(2),
    declineOfferLow: (+newListedPrice - 19.99).toFixed(2),
    description: item.description,
    categoryId: item.categoryId,
    partNo: item.partNo,
    shippingService: item.shippingService,
    expectedProfit: expectedProfit,
    dateReListed: new Date().toLocaleDateString(),
    lastPriceReduction:
      newListedPrice !== item.listedPrice
        ? new Date().toLocaleDateString()
        : item.lastPriceReduction,
    listingAgent: listingAgent,
    ebayId: item.ebayId,
    itemId: item._id,
  }

  console.log(listingDetails, listingImages)

  const listingResponse = await createListing(
    ebayAuthToken,
    listingDetails,
    userDescriptionTemplate,
    postalCode,
    listingImages
  )
  if (!listingResponse.success) return listingResponse
  const {
    listingData: {
      AddFixedPriceItemResponse: { ItemID: ebayId },
    },
  } = listingResponse

  listingDetails.ebayId = ebayId

  const inventoryChanges = [
    "listedPrice",
    "dateReListed",
    "ebayId",
    "lastPriceReduction",
    "listingAgent",
  ]

  itemUpdatedSuccessfully = await inventoryItemChange(
    listingDetails,
    inventoryChanges,
    user
  )

  return itemUpdatedSuccessfully

  //update the inventory item with the new listedPrice, and the new date for dateReListed, and expected profit
}

const testRelistItem = async () => {
  const connectDB = require("../../config/db")
  try {
    console.log("Starting relist test...")
    await connectDB()

    const testData = {
      itemId: "63bc9dbfabaa40d1f0ecea2c",
      user: {
        _id: "5eb9d103e124100017a09da9",
        postalCode: 84067,
        ebayAuthToken:
          "v^1.1#i^1#I^3#r^1#f^0#p^3#t^Ul4xMF81OkZGQUU1RkY2MTg1ODJGODBGODREOUVENERCNDhCQzAzXzBfMSNFXjI2MA==",
        userDescriptionTemplate: "Test Description",
        averageShippingCost: 13.33,
        ebayFeePercent: 0.1135,
      },
      settings: {
        // manualListedPrice: 55.99,
        priceReductionPercentage: 0.1,
        daysListedUntilPriceReduction: 50,
        allowPriceReduction: true,
        allowNegativeProfit: false,
        allowReListWithWatchers: true,
        quantityToReList: 1,
        maxPriceReduction: 30,
        listingAgent: "churn",
      },
    }

    console.log("Test data:", testData)

    const result = await relistItem(
      testData.itemId,
      testData.user,
      testData.settings
    )

    console.log("Test result:", result)
    return result
  } catch (error) {
    console.error("Test failed:", error)
    throw error
  }
}

// testRelistItem()
module.exports = relistItem

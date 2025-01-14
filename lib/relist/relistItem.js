const InventoryItem = require("../../models/inventoryItem")
const { createListing, endListing, getListingImages } = require("../ebayApi")
const { figureExpectedProfit } = require("../inventoryMethods")

const isValidEbayImage = (url) => {
  return url && typeof url === "string" && url.includes("ebayimg.com")
}

const relistItem = async (itemId, user, settings) => {
//settings will be either the {newListedPrice} if it was done manually, or the {...churn settings} to use for relisting.
  const {
    _id: userId,
    ebayAuthToken,
    userDescriptionTemplate,
    postalCode,
    averageShippingCost,
    ebayFeePercent,
  } = user

  const priceReductionPercentage = settings?.priceReductionPercentage || 0

  let item = await InventoryItem.findOne({
    _id: itemId,
    userId: userId,
  })
  if (!item)
    return {
      success: false,
      message: `Did not find id: ${itemId} in the inventory`,
    }

  console.log(item)

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
  const newListedPrice = settings?.newListedPrice || +(
    +item.listedPrice -
    +item.listedPrice * +priceReductionPercentage
  ).toFixed(2)
  const listingDetails = {
    title: item.title,
    brand: item.brand,
    sku: item.sku,
    listedPrice: newListedPrice, //0.1
    conditionId: item.conditionId,
    conditionDescription: item.conditionDescription,
    acceptOfferHigh: item.acceptOfferHigh,
    declineOfferLow: item.declineOfferLow,
    description: item.description,
    categoryId: item.categoryId,
    partNo: item.partNo,
    shippingService: item.shippingService,
    expectedProfit: figureExpectedProfit(newListedPrice, item.purchasePrice, averageShippingCost, ebayFeePercent),
    reListedDate: new Date().toLocaleDateString()
  }


  //Right here is where I would check rules from churn settings to determine if an item should have the price reduced,
  //depending on how long its been in the inventory, how many watchers it has, etc.
  if (listingDetails.expectedProfit <= 10) {
    delete listingDetails.acceptOfferHigh
    delete listingDetails.declineOfferLow
  }

  console.log(listingDetails, listingImages)
  const itemListed = await createListing(
    ebayAuthToken,
    listingDetails,
    userDescriptionTemplate,
    postalCode,
    listingImages
  )
  if (!itemListed.success) return itemListed
  return itemListed
  // itemUpdatedSuccessfully = await inventoryItemChange(
  //   item,
  //   inventoryChanges,
  //   user
  // )

  //find item to relist, in order to get the details.
  //end the ebay listing, if that is successful then move on
  //create a new listing with a reduction in price, if that is successful move on
  //update the inventory item with the new listedPrice, and the new date for dateReListed, and expected profit
  //createListing(ebayAuthToken, listingDetails, userDescriptionTemplate)
}

const testRelistItem = async () => {
  const connectDB = require("../../config/db")
  try {
    console.log("Starting relist test...")
    await connectDB()

    const testData = {
      itemId: "5f74dc11d24a530017336e5c",
      user: {
        _id: "5eb9d103e124100017a09da9",
        postalCode: 84067,
        ebayAuthToken:
          "v^1.1#i^1#I^3#r^1#f^0#p^3#t^Ul4xMF81OkZGQUU1RkY2MTg1ODJGODBGODREOUVENERCNDhCQzAzXzBfMSNFXjI2MA==",
        userDescriptionTemplate: "Test Description",
        priceReductionPercentage: 0.1,
      },
    }

    console.log("Test data:", testData)

    const result = await relistItem(testData.itemId, testData.user)

    console.log("Test result:", result)
    return result
  } catch (error) {
    console.error("Test failed:", error)
    throw error
  }
}

// testRelistItem()
module.exports = relistItem

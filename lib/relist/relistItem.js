const mongoose = require("mongoose")
require("dotenv").config()
const PORT = process.env.PORT || 3825
const InventoryItem = require("../../models/inventoryItem")
const { createListing, endListing, getListingImages } = require("../ebayApi")
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false)
    await mongoose.connect(
      process.env.MONGO_ATLAS_CLUSTER1,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      (err) => {
        if (err) throw err
        console.log("Connected to MongoDB")
      }
    )
  } catch (err) {
    console.error("Database connection error:", err)
    process.exit(1)
  }
}

const isValidEbayImage = (url) => {
  return url && typeof url === "string" && url.includes("ebayimg.com")
}

const relistItem = async (
  itemId,
  userId,
  ebayAuthToken,
  userDescriptionTemplate,
  priceReductionPercentage
) => {
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

  let listingImages = await getListingImages(ebayAuthToken, itemId)
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

  console.log(listingImages)

  // const listingEnded = await endListing(ebayAuthToken, itemId)

  // if (!listingEnded.success) return listingEnded

  // const listingDetails = {
  //   title: item.title,
  //   brand: item.brand,
  //   sku: item.sku,
  //   listedPrice:
  //     +item.listedPrice - +item.listedPrice * +priceReductionPercentage, //0.1
  //   conditionId: item.conditionId,
  //   conditionDescription: item.conditionDescription,
  //   acceptOfferHigh: item.acceptOfferHigh,
  //   declineOfferLow: item.declineOfferLow,
  //   description: item.description,
  //   categoryId: item.categoryId,
  //   partNo: item.partNo,
  //   shippingService: item.shippingService,
  // }
  // const itemListed = await createListing(
  //   ebayAuthToken,
  //   listingDetails,
  //   userDescriptionTemplate,
  //   listingImages
  // )

  //find item to relist, in order to get the details.
  //end the ebay listing, if that is successful then move on
  //create a new listing with a reduction in price, if that is successful move on
  //update the inventory item with the new listedPrice, and the new date for dateReListed, and expected profit
  //createListing(ebayAuthToken, listingDetails, userDescriptionTemplate)
}

const testRelistItem = async () => {
  try {
    console.log("Starting relist test...")
    await connectDB()

    const testData = {
      itemId: "5f74d577d24a530017336e59",
      userId: "5eb9d103e124100017a09da9",
      ebayAuthToken:
        "v^1.1#i^1#I^3#r^1#f^0#p^3#t^Ul4xMF81OkZGQUU1RkY2MTg1ODJGODBGODREOUVENERCNDhCQzAzXzBfMSNFXjI2MA==",
      userDescriptionTemplate: "Test template",
      priceReductionPercentage: 0.1,
    }

    console.log("Test data:", testData)

    const result = await relistItem(
      testData.itemId,
      testData.userId,
      testData.ebayAuthToken,
      testData.userDescriptionTemplate,
      testData.priceReductionPercentage
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

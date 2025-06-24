const express = require("express")
const inventoryRouter = express.Router()
const {
  getInventoryItems,
  figureExpectedProfit,
  updateUnlisted,
  parseInventoryObject,
} = require("../lib/inventoryMethods")
const { createListing } = require("../lib/ebayMethods/ebayApi")
const InventoryItem = require("../models/inventoryItem")
const User = require("../models/user")
const Fitment = require("../models/fitment")
const inventoryItemChange = require("../lib/editItemMethods/inventoryItemChange")
const listingChange = require("../lib/editItemMethods/listingChange")

inventoryRouter.post("/", async (req, res, next) => {
  // console.log(req.body)
  const userRaw = await User.findOne({ _id: req.auth._id })
  const user = userRaw.toObject()
  const ebayId = req.body.ebayId
  const {
    ebayToken,
    averageShippingCost,
    userDescriptionTemplate,
    postalCode,
    ebayFeePercent,
  } = user
  const listingDetails = req.body
  const listingResponse = ebayId
    ? {
        listingData: {
          AddFixedPriceItemResponse: { ItemID: ebayId },  //If its a link and not a new item the response is artificially created.
        },
        success: true,
      }
    : await createListing(
        ebayToken,
        listingDetails,
        userDescriptionTemplate,
        postalCode
      )
  if (!listingResponse.success) {
    return res
      .status(500)
      .send({ success: false, message: listingResponse.message })
  }
  const inventoryItemBody = parseInventoryObject(
    listingResponse,
    listingDetails,
    averageShippingCost,
    ebayFeePercent
  )
  if (inventoryItemBody.ebayId) {
    let inventoryItem = new InventoryItem(inventoryItemBody)
    inventoryItem.userId = req.auth._id
    inventoryItem.save((err, item) => {
      if (err) {
        console.log(err.message)
        console.log(req.body)
        res.status(500).send({
          success: false,
          message: `Failed while trying to save item into database. ${err.message}`,
        })
      } else res.send({ success: true, item })
    })
    const { compatibilities, partNo: partNumber } = inventoryItemBody
    if (compatibilities.length > 0) {
      try {
        // Check if the document exists and needs updating
        const existingFitment = await Fitment.findOne({
          partNumber: partNumber,
        })

        if (
          !existingFitment ||
          !isEqual(existingFitment.compatibilityList, compatibilities)
        ) {
          // Update or insert the document
          const updatedFitment = await Fitment.findOneAndUpdate(
            { partNumber: partNumber },
            {
              $set: {
                compatibilityList: compatibilities,
                userId: req.auth._id,
              },
            },
            {
              upsert: true, // Create a new document if none matches
              new: true, // Return the updated or newly created document
            }
          )

          console.log("Updated Fitment:", updatedFitment)
        } else {
          console.log("No update required: Compatibility list is unchanged")
        }
      } catch (error) {
        console.error("Error updating fitment:", error)
      }
    }
  } else {
    return res
      .status(500)
      .send({ success: false, message: "Ebay listing was not created." })
  }
})

inventoryRouter.put("/returnInventoryItem", async (req, res, next) => {
  const user = await getUserObject(req.auth._id)
  const { _id: userId } = user
  const updates = req.body
  const { itemId, ...updateFields } = updates
  // console.log(itemId, updateFields)
  InventoryItem.findOneAndUpdate(
    { _id: itemId, userId: userId },
    updateFields,
    { new: true },
    (err, result) => {
      if (err) res.send({ success: false, message: err.message })
      if (result) res.send({ success: true, result })
    }
  )
  // res.send({success: false, message: "This is a placeholder"})
})

inventoryRouter.put("/editInventoryItem", async (req, res, next) => {
  const user = await getUserObject(req.auth._id)
  const { _id: userId } = user
  const item = req.body
  const itemId = item.itemId

  let originalItem = await InventoryItem.findOne({
    _id: itemId,
    userId: userId,
  })
  console.log(`Making changes to item: ${itemId}`)
  if (originalItem) originalItem = originalItem.toObject()
  else {
    return res.status(404).send({ message: "No matching Item found" })
  }

  const listingChanges = [
    "title",
    "partNo", //MPN in ebay's api
    "sku",
    "brand",
    "categoryId",
    "listedPrice",
    "shippingService",
    "description",
    "conditionId",
    "conditionDescription",
    "acceptOfferHigh",
    "declineOfferLow",
  ].filter((key) => originalItem[key] !== item[key])

  const inventoryChanges = [
    "location",
    "datePurchased",
    "purchaseLocation",
    "purchasePrice",
  ].filter((key) => originalItem[key] !== item[key])
  let itemUpdatedSuccessfully = {
    success: false,
    message: "This is what the return looks like",
  }
  if (listingChanges.length === 0) {
    console.log("Inventory Change")
    itemUpdatedSuccessfully = await inventoryItemChange(
      item,
      inventoryChanges,
      user
    )
  } else {
    console.log("Listing Change")
    itemUpdatedSuccessfully = await listingChange(
      item,
      [...listingChanges, ...inventoryChanges],
      user
    )
  }

  return itemUpdatedSuccessfully.success
    ? res.status(200).send(itemUpdatedSuccessfully)
    : res.status(500).send(itemUpdatedSuccessfully)
})

inventoryRouter.put("/update", (req, res, next) => {
  const { id, updates } = req.body
  InventoryItem.findOneAndUpdate({ _id: id }, updates, (err, result) => {
    if (err) res.send({ success: false, message: err.message })
    if (result) res.send({ success: true, result })
  })
})

inventoryRouter.post("/updateUnlisted", (req, res, next) => {
  let ebayIds = req.body.ids
  updateUnlisted(ebayIds)
})

inventoryRouter.post("/massImport", (req, res, next) => {
  let inventoryItem = new InventoryItem(req.body)
  inventoryItem.userId = req.auth._id
  inventoryItem.save((err, item) => {
    if (err) {
      console.log(err.message)
      console.log(req.body)
      return res.status(500).send({ success: false })
    } else res.send({ success: true, item })
  })
})

inventoryRouter.get("/", async (req, res, next) => {
  const userId = req.auth._id
  try {
    const items = await getInventoryItems(userId)
    return res.send(items)
  } catch (e) {
    console.log(e)
    return res.status(500).send({ success: false, message: "Server Error" })
  }
})
inventoryRouter.post("/relist/:id", async (req, res, next) => {
  const user = await getUserObject(req.auth._id)
  const { _id: userId } = user
  const itemId = req.params.id

  try {
    //call the relist function, I need to make so I can feed many into it as well.
  } catch (e) {
    console.log(e)
    return res.status(500).send({ success: false, message: e.message })
  }
})

inventoryRouter.put("/:id", (req, res, next) => {
  InventoryItem.findByIdAndUpdate(
    { _id: req.params.id },
    { notify: req.body.value },
    (err, item) => {
      if (err) res.status(503).send({ success: false, message: err.message })
      else res.send({ success: true })
    }
  )
})

inventoryRouter.delete("/:id", async (req, res, next) => {
  const user = await getUserObject(req.auth._id)
  const { _id: userId, ebayToken: ebayAuthToken } = user
  const itemId = req.params.id

  try {
    // First, find the item to check if it has an eBay listing
    const item = await InventoryItem.findOne({ _id: itemId, userId: userId })
    
    if (!item) {
      return res.status(404).send({ success: false, message: "Item not found" })
    }

    const { ebayId, title, sku } = item

    // Check if item has an eBay listing that needs to be ended
    if (ebayId && ebayId.trim() !== "") {
      console.log(`Ending eBay listing ${ebayId} for item: ${title} (SKU: ${sku})`)
      
      const { endListing } = require("../lib/ebayMethods/ebayApi")
      const listingResult = await endListing(ebayAuthToken, ebayId)
      
      if (!listingResult.success) {
        console.log(`Failed to end listing ${ebayId}: ${listingResult.message}`)
        return res.status(500).send({ 
          success: false, 
          message: `Failed to end eBay listing: ${listingResult.message}` 
        })
      }
      
      console.log(`Successfully ended eBay listing ${ebayId}`)
    } else {
      console.log(`No eBay listing found for item: ${title} (SKU: ${sku}), proceeding with removal`)
    }

    // Delete the item from the database
    await InventoryItem.findByIdAndDelete(itemId)
    
    console.log(`Successfully removed item: ${title} (SKU: ${sku})`)
    res.send({ success: true, message: "Item removed successfully" })
    
  } catch (error) {
    console.error("Error removing item:", error)
    res.status(500).send({ success: false, message: "Server error during removal" })
  }
})

// Add waste functionality for inventory items
inventoryRouter.put("/wasteItem/:id", async (req, res, next) => {
  const user = await getUserObject(req.auth._id)
  const { _id: userId, ebayToken: ebayAuthToken } = user
  const itemId = req.params.id

  try {
    const item = await InventoryItem.findOne({ _id: itemId, userId: userId })
    
    if (!item) {
      return res.status(404).send({ success: false, message: "Item not found" })
    }

    const { ebayId, title, sku } = item

    // Check if item has an eBay listing that needs to be ended
    if (ebayId && ebayId.trim() !== "") {
      console.log(`Ending eBay listing ${ebayId} for waste item: ${title} (SKU: ${sku})`)
      
      const { endListing } = require("../lib/ebayMethods/ebayApi")
      const listingResult = await endListing(ebayAuthToken, ebayId)
      
      if (!listingResult.success) {
        console.log(`Failed to end listing ${ebayId}: ${listingResult.message}`)
        return res.status(500).send({ 
          success: false, 
          message: `Failed to end eBay listing: ${listingResult.message}` 
        })
      }
      
      console.log(`Successfully ended eBay listing ${ebayId} for waste item`)
    } else {
      console.log(`No eBay listing found for waste item: ${title} (SKU: ${sku})`)
    }

    // Calculate negative profit for waste (lost the purchase price)
    const wasteUpdates = {
      listed: false,
      sold: false, // Never sold, just wasted
      status: "waste",
      profit: -item.purchasePrice, // Negative because money was spent but no revenue
      dateWasted: new Date().toLocaleDateString(), // Mark when it was wasted
    }

    const updatedItem = await InventoryItem.findByIdAndUpdate(
      itemId, 
      wasteUpdates, 
      { new: true }
    )

    console.log(`Marked item as waste: ${item.title} (SKU: ${item.sku})`)
    res.send({ success: true, result: updatedItem })
    
  } catch (error) {
    console.error("Error wasting item:", error)
    res.status(500).send({ success: false, message: "Server error during waste operation" })
  }
})

async function getUserObject(userId) {
  const userInfo = await User.findById(userId)
  return userInfo.toObject()
}

module.exports = inventoryRouter

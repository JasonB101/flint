const express = require("express")
const inventoryRouter = express.Router()
const {
  getInventoryItems,
  figureProfit,
  updateUnlisted,
} = require("../lib/inventoryMethods")
const { createListing } = require("../lib/ebayMethods")
const InventoryItem = require("../models/inventoryItem")
const User = require("../models/user")
const inventoryItemChange = require("../lib/editItemMethods/inventoryItemChange")
const listingChange = require("../lib/editItemMethods/listingChange")

inventoryRouter.post("/", async (req, res, next) => {
  console.log(req.body)
  const userRaw = await User.findOne({ _id: req.auth._id })
  const user = userRaw.toObject()
  const { ebayToken, averageShippingCost, userDescriptionTemplate } = user
  const listingDetails = req.body
  const listingResponse = await createListing(ebayToken, listingDetails, userDescriptionTemplate)
  const inventoryItemBody = parseInventoryObject(
    listingResponse,
    listingDetails,
    averageShippingCost
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
          message: "Failed while trying to save item into database.",
        })
      } else res.send({ success: true, item })
    })
  } else {
    return res
      .status(500)
      .send({ success: false, message: "Ebay listing was not created." })
  }
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
    itemUpdatedSuccessfully = await listingChange(item, [...listingChanges, ...inventoryChanges], user)
  }

  return itemUpdatedSuccessfully.success ? res.status(200).send(itemUpdatedSuccessfully) : res.status(500).send(itemUpdatedSuccessfully)
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

inventoryRouter.delete("/:id", (req, res, next) => {
  InventoryItem.findByIdAndDelete({ _id: req.params.id }, (err, item) => {
    if (err) res.status(503).send({ success: false, message: "Server Error" })
    else res.send({ success: true })
  })
})

function parseInventoryObject(
  listingResponse,
  listingDetails,
  averageShipping
) {
  const {
    title,
    partNo,
    sku,
    listedPrice,
    acceptOfferHigh,
    declineOfferLow,
    description,
    conditionId,
    conditionDescription,
    dateListed,
    location,
    datePurchased,
    purchasePrice,
    purchaseLocation,
    categoryId,
    brand,
    shippingService,
  } = listingDetails
  const {
    AddFixedPriceItemResponse: { ItemID: ebayId },
  } = listingResponse
  //may have to suck the listing fees out of this object someday as well
  const inventoryItemBody = {
    title,
    partNo,
    sku,
    listedPrice,
    acceptOfferHigh,
    declineOfferLow,
    description,
    conditionId,
    conditionDescription,
    location,
    datePurchased,
    purchasePrice,
    purchaseLocation,
    categoryId,
    dateListed,
    ebayId,
    brand,
    shippingService,
    listed: true,
    expectedProfit: figureProfit(listedPrice, purchasePrice, averageShipping),
  }
  return inventoryItemBody
}

async function getUserObject(userId) {
  const userInfo = await User.findById(userId)
  return userInfo.toObject()
}

module.exports = inventoryRouter

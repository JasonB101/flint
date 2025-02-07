const express = require("express")
const ebayRouter = express.Router()
const User = require("../models/user")
const InventoryItem = require("../models/inventoryItem")
const Fitment = require("../models/fitment")
const findEbayListings = require("../lib/ebayMethods/findEbayListings")
const { updateSellerAvgShipping } = require("../lib/userMethods")
const {
  getEbayListings,
  getShippingTransactions,
} = require("../lib/ebayMethods/ebayApi")
const { getOAuthLink, refreshAccessToken } = require("../lib/oAuth")
const {
  updateInventoryWithSales,
  getInventoryItems,
  updateAllZeroShippingCost,
  figureExpectedProfit,
  verifyCorrectInfoInInventoryItems,
} = require("../lib/inventoryMethods")
const getCompletedSales = require("../lib/ebayMethods/getCompletedSales")
const findCompatibilityList = require("../lib/ebayMethods/findCompatibilityList")

// GET EBAY NOW COMPLETES SALES, AND RETURNS NEW UPDATED ITEMS.
// NEED TO HANDLE MULTIPLE QUANTITIES, use await between each itemUpdate. use InventoryItem.find() instead of findOne.
//Sort array based on the purchase date. Update the first item in the array, on the next iteration that item will now be
//set as "Sold" ;) Goodluck, ima play a video game :P Need to think about how to filter between transactions that have been recorded
//already. There may be more in inventory and the same part is counted more than once. Save the transaction ID to the item
//so when you retrieve transactions to merge, you filter the list by which transactions have not been merged.

ebayRouter.get("/getactivelistings", async (req, res, next) => {
  try {
    const { keyword } = req.query

    if (!keyword) {
      return res.status(400).json({ error: "Missing keyword parameter" })
    }

    const simplifiedItems = await findEbayListings(keyword)

    res.json(simplifiedItems)
  } catch (error) {
    console.error("Error in /getactivelistings route:", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
})

ebayRouter.get("/getShippingLabels", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const { ebayOAuthToken } = userObject
  try {
    const shippingTransactions = await getShippingTransactions(ebayOAuthToken)
    if (shippingTransactions.failedOAuth) {
      throw new Error("Need to Update OAuth")
    }
    res.send({
      success: true,
      shippingLabels: shippingTransactions.transactions,
    })
  } catch (e) {
    console.log(e)
    res
      .status(500)
      .send({ success: false, message: e.message, shippingLabels: [] })
  }
})

ebayRouter.get("/getCompatibility", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const { ebayToken } = userObject
  const listingLimit = 10 // Prevents doing too many calls to ebay
  try {
    // Get item IDs from query or body
    let itemIds = req.query.itemIds?.split(",") || [] // Assuming item IDs are passed as a comma-separated string
    itemIds = itemIds.splice(0, listingLimit)
    const partNumber = req.query.partNumber
    const fitmentList = await Fitment.find({ partNumber: partNumber })

    if (fitmentList) {
      return res.send({
        success: true,
        compatibility: fitmentList.compatibilityList,
      })
    }
    //Check database for fitment first
    if (itemIds.length === 0) {
      throw new Error("No item IDs provided")
    }

    const compatibilityList = await findCompatibilityList(itemIds, ebayToken)
    if (compatibilityList.length === 0) {
      res.send({
        success: true,
        compatibility: [],
        message: "No compatible items found",
      })
    } else {
      res.send({ success: true, compatibility: compatibilityList })
    }
  } catch (e) {
    console.log(e)
    res
      .status(500)
      .send({ success: false, message: e.message, compatibility: [] })
  }
})

ebayRouter.get("/getebay", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const {
    _id: userId,
    averageShippingCost,
    ebayToken: ebayAuthToken,
    ebayOAuthToken = "0",
    ebayRefreshOAuthToken,
    ebayFeePercent,
  } = userObject

  try {
    console.log("Starting Get Ebay")
    let shippingTransactions = await getShippingTransactions(ebayOAuthToken)
    if (shippingTransactions.failedOAuth)
      throw new Error("Need to Update OAuth")
    shippingTransactions = shippingTransactions.transactions
    console.log(
      `Got Transactions, making changes. ${shippingTransactions.length}`
    )
    const [shippingUpdates, completedSales, ebayListings] = await Promise.all([
      updateAllZeroShippingCost(userId, shippingTransactions),
      getCompletedSales(ebayOAuthToken),
      getEbayListings(ebayAuthToken, userId),
    ])
    // console.log("Got Completed Sales", completedSales)
    let inventoryItems = await getInventoryItems(userId, false) //True is setting to get items that are listed: true
    const inventoryItemsMap = new Map(
      inventoryItems.map((item) => [item.sku, item])
    )

    const newSoldItems = await updateInventoryWithSales(
      userId,
      completedSales,
      inventoryItemsMap,
      shippingTransactions
    )
    if (newSoldItems.length > 0) {
      updateSellerAvgShipping(userId)
      newSoldItems.forEach((item) => {
        inventoryItemsMap.set(item.sku, item)
      })
    }

    const verifiedCorrectInfo = await verifyCorrectInfoInInventoryItems(
      inventoryItemsMap,
      ebayListings,
      averageShippingCost,
      ebayFeePercent
    )

    // console.log("Is verified true? ", verifiedCorrectInfo)

    if (verifiedCorrectInfo || newSoldItems.length > 0) {
      inventoryItems = await getInventoryItems(userId)
    }
    const response = {
      ebayListings,
      inventoryItems,
    }
    res.send(response)
  } catch (e) {
    console.log(e, "Access Token Expired")
    res.status(402).send({ success: false, message: "Access Token Expired" })
  }
})

ebayRouter.post("/refreshOToken", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const { _id: userId, ebayRefreshOAuthToken } = userObject

  try {
    const newToken = await refreshAccessToken(ebayRefreshOAuthToken)
    const { success, token } = newToken
    if (!success) throw Error("Refresh Failed")
    console.log("Successfully fetched Access Token")
    User.findOneAndUpdate(
      { _id: userId },
      { ebayOAuthToken: token },
      (err, result) => {
        if (err) console.log(err.message)
      }
    )
    res.status(200).send({ success: true })
  } catch (e) {
    res.status(401).send({ link: getOAuthLink() })
    console.log(e.message, "Refresh OAUTH Error: Sending Link")
  }
})

ebayRouter.put("/linkItem/:id", async (req, res, next) => {
  const { ItemID, BuyItNowPrice, SKU } = req.body
  const { _id: userId, averageShippingCost, ebayFeePercent } = req.user
  console.log(req.body)
  const item = await InventoryItem.findById(req.params.id)
  const purchasePrice = item.toObject().purchasePrice

  const updatedInfo = {
    listed: true,
    ebayId: ItemID,
    listedPrice: BuyItNowPrice,
    expectedProfit: figureExpectedProfit(
      BuyItNowPrice,
      purchasePrice,
      [], //additionalCosts
      averageShippingCost,
      ebayFeePercent
    ),
    userId: req.auth._id,
  }
  InventoryItem.findByIdAndUpdate(
    req.params.id,
    updatedInfo,
    { new: true },
    (err, updatedItem) => {
      if (err) {
        console.log(err)
        return res.status(500).send({ success: false, error: err })
      }
      res.send({ success: true, updatedItem })
    }
  )
})

async function getUserObject(userId) {
  const userInfo = await User.findById(userId)
  return userInfo.toObject()
}

module.exports = ebayRouter

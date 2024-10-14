const express = require("express")
const ebayRouter = express.Router()
const User = require("../models/user")
const InventoryItem = require("../models/inventoryItem")
const findEbayListings = require("../lib/ebayMethods/findEbayListings")
const { updateSellerAvgShipping } = require("../lib/userMethods")
const {
  getEbayListings,
  getShippingTransactions,
} = require("../lib/ebayMethods")
const { getOAuthLink, refreshAccessToken } = require("../lib/oAuth")
const {
  updateInventoryWithSales,
  getInventoryItems,
  updateAllZeroShippingCost,
  figureProfit,
  verifyCorrectPricesInInventoryItems,
} = require("../lib/inventoryMethods")
const getCompletedSales = require("../lib/ebayMethods/getCompletedSales")

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

ebayRouter.get("/getebay", async (req, res, next) => {
  const userObject = await getUserObject(req.auth._id)
  const {
    _id: userId,
    averageShippingCost,
    ebayToken: ebayAuthToken,
    ebayOAuthToken = "0",
    ebayRefreshOAuthToken,
  } = userObject

  try {
    console.log("Starting Get Ebay")
    let shippingTransactions = await getShippingTransactions(ebayOAuthToken)
    if (shippingTransactions.failedOAuth)
      throw new Error("Need to Update OAuth")
    shippingTransactions = shippingTransactions.transactions
    console.log("Got Transactions, making changes.")
    const [shippingUpdates, completedSales, ebayListings] = await Promise.all([
      updateAllZeroShippingCost(userId, shippingTransactions),
      getCompletedSales(ebayOAuthToken),
      getEbayListings(ebayAuthToken, userId),
    ])

    const newSoldItems = await updateInventoryWithSales(
      userId,
      completedSales,
      shippingTransactions
    )

    let inventoryItems = await getInventoryItems(userId)

    const verifiedCorrectInfo = await verifyCorrectPricesInInventoryItems(
      inventoryItems,
      ebayListings,
      averageShippingCost
    )

    if (verifiedCorrectInfo) {
      updateSellerAvgShipping(userId)
      inventoryItems = await getInventoryItems(userId)
    }
    const response = {
      ebayListings,
      inventoryItems,
    }
    console.log("This is right before the send")
    res.send(response)
  } catch (e) {
    console.log(e, "Access Token Expired")
    res.status(401).send({ success: false, message: "Access Token Expired" })
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
    res.send({ link: getOAuthLink() })
    console.log(e.message, "Refresh OAUTH Error: Sending Link")
  }
})


ebayRouter.put("/linkItem/:id", async (req, res, next) => {
  const { ItemID, BuyItNowPrice, SKU } = req.body
  const { _id: userId, averageShippingCost } = req.user
  console.log(req.body)
  const item = await InventoryItem.findById(req.params.id)
  const purchasePrice = item.toObject().purchasePrice

  const updatedInfo = {
    listed: true,
    ebayId: ItemID,
    listedPrice: BuyItNowPrice,
    expectedProfit: figureProfit(
      BuyItNowPrice,
      purchasePrice,
      averageShippingCost
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

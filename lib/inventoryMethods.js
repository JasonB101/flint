const InventoryItem = require("../models/inventoryItem")
const ebayFeePercent = 0.1

function updateUnlisted(ebayIds) {
  ebayIds.forEach((id) => {
    InventoryItem.findOne({ ebayId: id }, (err, result) => {
      if (result) {
        const updates = {
          profit: result.expectedProfit,
          priceSold: result.listedPrice,
          ebayFees: result.listedPrice * 0.11,
          shippingCost: 12.71,
          status: "completed",
          dateSold: "1/1/2021",
          sold: true,
          shipped: true,
          listed: false,
        }

        InventoryItem.findOneAndUpdate(
          { ebayId: id },
          updates,
          (err, result) => {
            if (err) console.log(err)
            if (result) console.log(id)
          }
        )
      }
    })
  })
}

async function updateInventoryWithSales(
  userId,
  completedSales = [],
  shippingTransactions = []
) {
  const salesToUpdateWith = await getSalesToUpdateWith(userId, completedSales)

  const itemsUpdated = await Promise.all(
    salesToUpdateWith.map(async (sale) => {
      const { paymentSummary: {payments} } = sale
      //If the item isn't paid for yet, it wont update it
      let saleInfo = {}
      if (payments.length === 0) {
        return false
      }

      try {
        saleInfo = getSaleInfo(sale, shippingTransactions)
      } catch (e) {
        console.log("Get sale info failed", e)
        return false
      }
      const {
        priceSold,
        ebayFees,
        trackingNumber,
        orderId,
        shipping,
        dateSold,
        buyer,
        purchasePrice,
        inventoryItemId,
      } = saleInfo
     
      const profit = +(priceSold - purchasePrice - ebayFees - shipping).toFixed(
        2
      )
      const updates = {
        priceSold,
        dateSold,
        ebayFees,
        trackingNumber,
        orderId,
        shippingCost: shipping,
        shipped: trackingNumber !== null,
        listed: false,
        status: "completed",
        sold: true,
        profit,
        roi: (
          (profit / (priceSold - purchasePrice - ebayFees - shipping)) *
          100
        ).toFixed(0),
        buyer,
      }

      return InventoryItem.findByIdAndUpdate(inventoryItemId, updates, {
        new: true,
      })
    })
  )

  return itemsUpdated.filter((x) => x)
  // return filtered array to get rid of unpaid items;
}

async function getSalesToUpdateWith(userId, completedSales = []) {
  //
  const salesToUpdateWith = await Promise.all(
    completedSales.map(async (sale) => {
      const {
        lineItems,
      } = sale
      const sku = lineItems[0]['sku']
      try {
        // const inventoryItem = await InventoryItem.findOne({ userId: userId, ebayId: String(ItemID), shipped: false });
        const inventoryItem = await InventoryItem.findOne({
          userId: userId,
          sku,
          shipped: false,
        })
        if (inventoryItem) {
          sale.inventoryItemId = inventoryItem._id
          sale.purchasePrice = inventoryItem.purchasePrice
          return sale
        } else {
          return null
        }
      } catch (e) {
        console.log(e)
        return null
      }
    })
  )
  const filteredSales = salesToUpdateWith.filter((sale) => sale !== null)
  console.log("Number of Items to update: " + filteredSales.length)
  return filteredSales
}

function getSaleInfo(sale, shippingTransactions) {
  const {
    lineItems,
    paymentSummary: { payments },
    totalMarketplaceFee: { value: ebayFee },
    // ShippingDetails, //Might have to get these details from the shipping transaction now
    pricingSummary: {total: {value: priceSold}},
    buyer: {username: buyer},
    purchasePrice,
    inventoryItemId,
    orderId,
  } = sale
  console.log(JSON.stringify(sale))
  let trackingNumber = 0 //Maybe i will make this work one, right now ebay stopped giving it in their api. THe tracking number may be in the shipping transactions
  let shipping = 0

  shipping = findShippingCostFromTransactions(
    orderId,
    shippingTransactions
  )

  const dateToMountain = new Date(payments[0]["paymentDate"])
  dateToMountain.setHours(dateToMountain.getHours() - 6)
  const dateToString = dateToMountain.toLocaleDateString()
  const saleInfo = {
    purchasePrice,
    sku: lineItems[0]["sku"],
    inventoryItemId,
    ebayId: lineItems[0]["legacyItemId"],
    priceSold,
    ebayFees: ebayFee,
    dateSold: dateToString,
    shipping: shipping,
    orderId,
    trackingNumber, 
    buyer,
  }

  return saleInfo
}

async function getInventoryItems(userId) {
  const inventoryList = await InventoryItem.find({ userId: userId }) //array
  return inventoryList
}

function updateItem(userId, itemId, updates) {
  InventoryItem.findOneAndUpdate(
    { userId: userId, _id: itemId },
    updates,
    (err, result) => {
      if (err) console.log(err)
    }
  )
}

async function updateAllZeroShippingCost(userId, shippingTransactions) {
  let foundUpdates = false
  const zeroCostList = await InventoryItem.find({
    userId: userId,
    shippingCost: 0,
    shipped: true,
  })

  zeroCostList.forEach(async (x) => {
    const { _id, profit, title, orderId = "0" } = x
    const shipping = findShippingCostFromTransactions(
      orderId,
      shippingTransactions
    )
    if (shipping !== x.shippingCost) {
      foundUpdates = true
      updateItem(userId, _id, {
        shippingCost: shipping,
        profit: profit - shipping,
      })
    }
  })

  return foundUpdates
}

function findShippingCostFromTransactions(orderId, transactions) {
  // console.log(transactions) make this function return an array o two items, the shipping amount, and the tracking number
  const transaction = transactions.find((x) => x.orderId === orderId)
  if (transaction) {
    return +transaction.amount.value
  }
  return 0
}

function figureProfit(listedPrice, purchasePrice, averageShippingCost) {
  //Need to find a way to determine what tier the user is on, and how much their eBay fees are.
  const ebayFee = listedPrice * ebayFeePercent
  //Need to get purchasePrice
  return +(listedPrice - ebayFee - averageShippingCost - purchasePrice).toFixed(
    2
  )
}

async function verifyCorrectPricesInInventoryItems(
  inventoryItems,
  ebayListings,
  averageShippingCost
) {
  const updates = await Promise.all(
    ebayListings.map((listing) => {
      const { BuyItNowPrice, ItemID, Title } = listing
      const found = inventoryItems.find(
        (item) =>
          item.ebayId === ItemID &&
          (+item.listedPrice !== +BuyItNowPrice || item.title !== Title)
      )
      if (found) {
        return updateItemWithEbayListing(
          found._id,
          listing,
          averageShippingCost
        )
      }
      return false
    })
  )

  return updates.filter((x) => x).length > 0
}

async function updateItemWithEbayListing(
  itemId,
  ebayListing,
  averageShippingCost
) {
  const { BuyItNowPrice, OrderLineItemID, Title } = ebayListing
  const item = await InventoryItem.findById(itemId)
  const { purchasePrice } = item
  const update = {
    title: Title,
    listedPrice: BuyItNowPrice,
    expectedProfit: figureProfit(
      BuyItNowPrice,
      purchasePrice,
      averageShippingCost
    ),
    orderId: OrderLineItemID,
  }
  const updatedItem = await InventoryItem.findByIdAndUpdate(itemId, update)

  return updatedItem
}

module.exports = {
  updateInventoryWithSales,
  getInventoryItems,
  updateAllZeroShippingCost,
  figureProfit,
  verifyCorrectPricesInInventoryItems,
  updateUnlisted,
}

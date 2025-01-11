const InventoryItem = require("../models/inventoryItem")

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
      const { orderFulfillmentStatus, orderPaymentStatus, orderId } = sale      

      let saleInfo = {}
      try {
        saleInfo = getSaleInfo(sale, shippingTransactions)
      } catch (e) {
        console.log("Get sale info failed", e)
        return null
      }

      const {
        priceSold,
        ebayFees,
        trackingNumber,
        shipping,
        dateSold,
        buyer,
        purchasePrice,
        inventoryItemId,
      } = saleInfo

      if (sale.cancelStatus?.cancelState === "CANCELED") {
        console.log( `Order cancelled: ${orderId}`)
        if (!dateSold) return null
        const updates = {
          $unset: {
            priceSold: "", // delete
            dateSold: "", // delete            I need to compare the creationDate of the cancelled order and compare it to the dateSold. That will tell me if the order 
            ebayFees: "", // delete            actually needs to be cancelled or if a new order came in. Could use buyer too
            trackingNumber: "", // delete
            orderId: "", // delete
            shippingCost: "", // delete
            status: "", // delete
            profit: "", // delete
            roi: "", // delete
            buyer: "", // delete
          },
          $set: {
            shipped: false,
            listed: true,
            sold: false,
          },
        }
        return InventoryItem.findByIdAndUpdate(inventoryItemId, updates, {
          new: true,
        })
      }

      if (orderPaymentStatus !== "PAID") {
        console.log(`Order not paid for: ${orderId}`)
        return null // Skip if not paid
      }

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
        shipped: orderFulfillmentStatus === "FULFILLED", // Set to true if order is fulfilled
        listed: false,
        status: "completed",
        sold: true,
        profit,
        roi: (
          (profit / (priceSold - purchasePrice - ebayFees - shipping)) *
          100
        ).toFixed(0),
        buyer,
        daysListed: getDaysBetween(result.dateListed, dateSold)
      }

      return InventoryItem.findByIdAndUpdate(inventoryItemId, updates, {
        new: true,
      })
    })
  )

  return itemsUpdated.filter((x) => x)
}

async function getSalesToUpdateWith(userId, completedSales = []) {
  if (completedSales.length === 0) {
    console.log("No completed sales to update.")
    return []
  }
  // console.log(completedSales)
  const salesToUpdateWith = await Promise.all(
    completedSales.map(async (sale) => {
      const { lineItems } = sale
      const sku = lineItems[0]["sku"]
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
          sale.sku = sku
          return sale
        } else {
          return null
        }
      } catch (e) {
        console.error("Error fetching inventory item for SKU:", sku, e)
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
    pricingSummary: {
      total: { value: priceSold },
    },
    buyer: { username: buyer },
    purchasePrice,
    inventoryItemId,
    orderId,
  } = sale

  console.log(JSON.stringify(sale))

  let trackingNumber = 0 // Might implement tracking number in the future
  let shipping = 0

  shipping = findShippingCostFromTransactions(orderId, shippingTransactions)

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

  return saleInfo // Return the saleInfo object if not canceled
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

function figureExpectedProfit(listedPrice, purchasePrice, averageShippingCost, ebayFeePercent = 0.1) {
  //Need to find a way to determine what tier the user is on, and how much their eBay fees are.
  //Need to add estimated taxes to this calculation
  const ebayFee = listedPrice * ebayFeePercent
  //Need to get purchasePrice
  return +(listedPrice - ebayFee - averageShippingCost - purchasePrice).toFixed(
    2
  )
}

async function verifyCorrectPricesInInventoryItems(
  inventoryItems,
  ebayListings,
  averageShippingCost,
  ebayFeePercent
) {
  const updates = await Promise.all(
    ebayListings.map((listing) => {
      const { BuyItNowPrice, ItemID, Title, WatchCount } = listing
      const found = inventoryItems.find(
        (item) =>
          item.ebayId === ItemID &&
          (+item.listedPrice !== +BuyItNowPrice || item.title !== Title || item.watchers !== +WatchCount)
      )
      if (found) {
        return updateItemWithEbayListing(
          found._id,
          listing,
          averageShippingCost,
          ebayFeePercent
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
  averageShippingCost,
  ebayFeePercent
) {
  const { BuyItNowPrice, OrderLineItemID, Title, WatchCount } = ebayListing
  const item = await InventoryItem.findById(itemId)
  const { purchasePrice } = item
  const update = {
    title: Title,
    listedPrice: BuyItNowPrice,
    watchers: WatchCount,
    expectedProfit: figureExpectedProfit(
      BuyItNowPrice,
      purchasePrice,
      averageShippingCost,
      ebayFeePercent
    ),
    orderId: OrderLineItemID,
  }
  const updatedItem = await InventoryItem.findByIdAndUpdate(itemId, update)

  return updatedItem
}

function getDaysBetween(date1, date2) {
  if (date1 && date2) {
      let newDate1 = new Date(date1)
      let newDate2 = new Date(date2)
      return Math.trunc(Math.abs(newDate2 - newDate1) / 8.64e7)
  }
}

module.exports = {
  updateInventoryWithSales,
  getInventoryItems,
  updateAllZeroShippingCost,
  figureExpectedProfit,
  verifyCorrectPricesInInventoryItems,
  updateUnlisted,
}

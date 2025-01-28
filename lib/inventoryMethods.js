const InventoryItem = require("../models/inventoryItem")

function parseInventoryObject(
  listingResponse,
  listingDetails,
  averageShipping,
  ebayFeePercent
) {
  console.log("listing response", listingResponse)
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
    listingData: {
      AddFixedPriceItemResponse: { ItemID: ebayId },
    },
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
    expectedProfit: figureExpectedProfit(
      listedPrice,
      purchasePrice,
      [], //additionalCosts
      averageShipping,
      ebayFeePercent
    ),
  }
  return inventoryItemBody
}

async function updateInventoryWithSales(
  userId,
  completedSales = [],
  inventoryItemsMap,
  shippingTransactions = []
) {
  const salesToUpdateWith = await getSalesToUpdateWith(
    userId,
    completedSales,
    inventoryItemsMap
  )

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
        dateListed,
        cancelled,
      } = saleInfo

      if (cancelled) {
        console.log(`Order cancelled: ${orderId}`)
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
            daysListed: "", // delete
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
        roi: ((profit / purchasePrice) * 100).toFixed(0),
        buyer,
        daysListed: getDaysBetween(dateListed, dateSold),
      }

      return InventoryItem.findByIdAndUpdate(inventoryItemId, updates, {
        new: true,
      })
    })
  )

  return itemsUpdated.filter((x) => x)
}

function getSalesToUpdateWith(userId, completedSales = [], inventoryItemsMap) {
  if (completedSales.length === 0) {
    console.log("No completed sales to update.")
    return []
  }

  const salesToUpdateWith = completedSales.map((sale) => {
    try {
      const { lineItems } = sale
      const sku = lineItems[0]["sku"]
      const cancelled = sale.cancelStatus?.cancelState === "CANCELED"
      let inventoryItem = inventoryItemsMap.get(sku)

      // Check if the inventory item is valid
      if (
        inventoryItem?.userId !== userId ||
        (cancelled && !inventoryItem?.listed) ||
        !inventoryItem?.shipped
      ) {
        inventoryItem = null
      }

      if (inventoryItem) {
        sale.inventoryItemId = inventoryItem._id
        sale.purchasePrice = inventoryItem.purchasePrice
        sale.sku = sku
        sale.dateListed = inventoryItem.dateListed
        return sale
      } else {
        return null
      }
    } catch (e) {
      console.error("Error processing sale for SKU:", sku, e)
      return null
    }
  })

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
    dateListed,
    cancelStatus,
  } = sale

  console.log(JSON.stringify(sale))

  let trackingNumber = 0 // Might implement tracking number in the future
  let shipping = 0

  shipping = findShippingCostFromTransactions(orderId, shippingTransactions)
  // const paymentDate = new Date(payments[0]["paymentDate"])
  // console.log("Payment Date: " + paymentDate)
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
    dateSold: dateToString, //Cancelled items rely on this date being removed.
    shipping: shipping,
    orderId,
    trackingNumber,
    buyer,
    dateListed,
    cancelled: cancelStatus?.cancelState === "CANCELED" ? true : false,
  }

  return saleInfo // Return the saleInfo object if not canceled
}

async function getInventoryItems(userId, filterListed = false) {
  const query = { userId }
  if (filterListed) {
    query.listed = filterListed
  }
  const inventoryList = await InventoryItem.find(query)
  return inventoryList || []
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
  const zeroCostList = await InventoryItem.aggregate([
    {
      $match: {
        userId: userId,
        shippingCost: 0,
        shipped: true,
      },
    },
    {
      $addFields: {
        soldDateAsDate: {
          $dateFromString: { dateString: "$soldDate", format: "%m/%d/%Y" },
        },
      },
    },
    {
      $match: {
        soldDateAsDate: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  ])

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

async function verifyCorrectInfoInInventoryItems(
  inventoryItemsMap,
  ebayListings,
  averageShippingCost,
  ebayFeePercent
) {

  const updates = await Promise.all(
    ebayListings
      .filter((listing) => {
        // console.log(listing)
        const { BuyItNowPrice, ItemID, Title, WatchCount = 0, SKU } = listing
        const inventoryItem = inventoryItemsMap.get(SKU)
        return (
          inventoryItem &&
          (+inventoryItem.listedPrice !== +BuyItNowPrice ||
            inventoryItem.title.trim().toLowerCase() !==
              Title.trim().toLowerCase() ||
            +(inventoryItem.watchers || 0) !== +WatchCount ||
            `${inventoryItem.ebayId}` !== `${ItemID}`)
        )
      })
      .map((listing) =>
        updateItemWithEbayListing(
          inventoryItemsMap.get(listing.SKU),
          listing,
          averageShippingCost,
          ebayFeePercent
        )
      )
  )
  // console.log(updates)
  return updates.length > 0
}

async function updateItemWithEbayListing(
  item,
  ebayListing,
  averageShippingCost,
  ebayFeePercent
) {
  const {
    BuyItNowPrice,
    OrderLineItemID,
    Title,
    WatchCount,
    ItemID: ebayId,
  } = ebayListing
  const { purchasePrice, additionalCosts, _id: itemId } = item
  const update = {
    title: Title,
    listedPrice: BuyItNowPrice,
    watchers: WatchCount,
    expectedProfit: figureExpectedProfit(
      BuyItNowPrice,
      purchasePrice,
      [], //additionalCosts
      averageShippingCost,
      ebayFeePercent
    ),
    orderId: OrderLineItemID,
    ebayId,
  }
  const updatedItem = await InventoryItem.findByIdAndUpdate(itemId, update)

  return updatedItem
}
function figureExpectedProfit(
  listedPrice,
  purchasePrice,
  additionalCosts = [],
  averageShippingCost,
  ebayFeePercent = 0.1135,
  estimatedTaxRate = 0.08
) {
  const extraCost = additionalCosts.reduce((acc, cost) => acc + cost.amount, 0);
  const taxOnListedPrice = +listedPrice * +estimatedTaxRate;
  const ebayFee = (+listedPrice + +taxOnListedPrice) * +ebayFeePercent;
  const expectedProfit = +listedPrice - +ebayFee - +averageShippingCost - +purchasePrice - +extraCost;

  return +expectedProfit.toFixed(2);
}

function getDaysBetween(date1, date2) {
  if (date1 && date2) {
    let newDate1 = new Date(date1)
    let newDate2 = new Date(date2)
    let result = Math.trunc(Math.abs(newDate2 - newDate1) / 8.64e7)
    return result
  }
}

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

module.exports = {
  updateInventoryWithSales,
  getInventoryItems,
  updateAllZeroShippingCost,
  figureExpectedProfit,
  verifyCorrectInfoInInventoryItems,
  updateUnlisted,
  parseInventoryObject,
}

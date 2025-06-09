const InventoryItem = require("../models/inventoryItem")
const Notification = require("../models/notification")
const Expense = require("../models/expense")

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
    compatibilities,
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
    compatibilities
  }
  return inventoryItemBody
}

async function updateInventoryWithSales(
  userId,
  completedSales = [],
  inventoryItemsMap,
  shippingTransactions = [],
  ebayFeePercent = 0.1135
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
        saleInfo = getSaleInfo(sale, shippingTransactions, ebayFeePercent)
      } catch (e) {
        console.log("Get sale info failed", e, sale)
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
        additionalCost,
        sku,
      } = saleInfo
      // console.log(saleInfo)

      if (cancelled) {

        
        // Get current inventory item to validate cancellation
        const currentItem = await InventoryItem.findById(inventoryItemId)
        if (!currentItem) {
          console.log(`❌ Cannot cancel - inventory item not found: ${inventoryItemId}`)
          return null
        }
        
        // Safety checks before cancelling
        const shouldCancel = await validateCancellation(saleInfo, currentItem)
        if (!shouldCancel) {
          console.log(`⚠️ Skipping cancellation for ${orderId} - validation failed`)
          return null
        }
        
        console.log(`✅ Validated cancellation for ${orderId} - reverting item to active`)
        const updates = {
          $unset: {
            priceSold: "",
            dateSold: "",
            ebayFees: "",
            trackingNumber: "",
            orderId: "",
            shippingCost: "",
            profit: "",
            roi: "",
            buyer: "",
            daysListed: "",
          },
          $set: {
            shipped: false,
            listed: true,
            sold: false,
            status: "active",
          },
        }

        return InventoryItem.findByIdAndUpdate(inventoryItemId, updates, {
          new: true,
        })
      }

      // Check for automatic return processing
      // Criteria: 1) FULLY_REFUNDED status, 2) Was FULFILLED (shipped), 3) NOT cancelled, 4) Return shipping label exists, 5) Currently listed
      if (orderPaymentStatus === "FULLY_REFUNDED" && orderFulfillmentStatus === "FULFILLED" && cancelStatus?.cancelState !== "CANCELED") {
        
        // Get current inventory item to check if it's currently listed
        const currentItem = await InventoryItem.findById(inventoryItemId)
        if (!currentItem) {
          console.log(`❌ Cannot process return - inventory item not found: ${inventoryItemId}`)
        } else {
          // Check if item is currently listed (criterion 3)
          const isCurrentlyListed = currentItem.listed && currentItem.status === "active"
          
          if (isCurrentlyListed) {
            // Check for return shipping label (criterion 2)
            const returnShippingLabels = shippingTransactions.filter(
              transaction => transaction.orderId === orderId && transaction.transactionMemo === "Return shipping label"
            )
            
            if (returnShippingLabels.length > 0) {
              // Get the latest return shipping label cost
              const latestReturnLabel = returnShippingLabels.reduce((latest, current) => {
                const latestDate = new Date(latest.date)
                const currentDate = new Date(current.date)
                return currentDate > latestDate ? current : latest
              })
              
              const returnShippingCost = parseFloat(latestReturnLabel.amount?.value || 0)
              
              // Calculate updated additional costs (same logic as manual return)
              const existingAdditionalCosts = currentItem.additionalCosts || []
              const updatedAdditionalCosts = [...existingAdditionalCosts]
              
              // Add return shipping cost
              const returnShippingIndex = updatedAdditionalCosts.findIndex(
                (cost) => cost.title === "returnShippingCost"
              )
              if (returnShippingIndex !== -1) {
                updatedAdditionalCosts[returnShippingIndex].amount += returnShippingCost
              } else {
                updatedAdditionalCosts.push({
                  title: "returnShippingCost",
                  amount: returnShippingCost,
                })
              }
              
              // Add original shipping cost
              const originalShippingCost = shipping || 0
              const shippingCostIndex = updatedAdditionalCosts.findIndex(
                (cost) => cost.title === "shippingCost"
              )
              if (shippingCostIndex !== -1) {
                updatedAdditionalCosts[shippingCostIndex].amount += originalShippingCost
              } else {
                updatedAdditionalCosts.push({
                  title: "shippingCost",
                  amount: originalShippingCost,
                })
              }
              
              // Calculate new expected profit (same logic as manual return)
              const User = require("../models/user")
              const userObj = await User.findById(userId)
              const { averageShippingCost, ebayFeePercent: userEbayFeePercent } = userObj
              
              const newExpectedProfit = figureExpectedProfit(
                currentItem.listedPrice,
                currentItem.purchasePrice,
                updatedAdditionalCosts,
                averageShippingCost,
                userEbayFeePercent
              )
              
              // Process return (same as itemReListed function)
              const returnUpdates = {
                $unset: {
                  priceSold: "",
                  dateSold: "",
                  ebayFees: "",
                  trackingNumber: "",
                  orderId: "",
                  shippingCost: "",
                  profit: "",
                  roi: "",
                  buyer: "",
                  daysListed: "",
                },
                $set: {
                  shipped: false,
                  listed: true,
                  sold: false,
                  status: "active",
                  listingAgent: "member",
                  additionalCosts: updatedAdditionalCosts,
                  expectedProfit: newExpectedProfit,
                },
              }
              
                             // Create notification for automatic return processing
               try {
                 await new Notification({
                   userId: userId,
                   type: 'automaticReturn',
                   data: {
                     sku: saleInfo.sku,
                     orderId: orderId,
                     originalSalePrice: saleInfo.priceSold,
                     returnShippingCost: returnShippingCost,
                     buyer: saleInfo.buyer,
                     itemTitle: currentItem.title || `SKU: ${saleInfo.sku}`,
                     newExpectedProfit: newExpectedProfit,
                     message: `Return automatically processed for SKU ${saleInfo.sku} - Item restored to active listing`
                   },
                   isViewed: false
                 }).save()
                 
               } catch (notificationError) {
                 console.log(`Failed to create return notification: ${notificationError.message}`)
               }
               
               return InventoryItem.findByIdAndUpdate(inventoryItemId, returnUpdates, {
                 new: true,
               })
            }
          }
        }
      }

      // Normal sale processing continues here
      // console.log(`Additional Cost  ${additionalCost}`)
      const profit = +(
        priceSold -
        purchasePrice -
        ebayFees -
        shipping -
        additionalCost
      ).toFixed(2)
      // console.log(profit)
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
    const { lineItems, cancelStatus, orderPaymentStatus } = sale
    const sku = lineItems[0]["sku"]
    const cancelled = cancelStatus?.cancelState === "CANCELED"
    try {
      let inventoryItem = inventoryItemsMap.get(sku)
      if (!inventoryItem) return null
      const { additionalCosts = [] } = inventoryItem

      // Check if the inventory item is valid for processing
      const skipReasons = []
      
      if (cancelled && inventoryItem?.listed) {
        skipReasons.push("cancelled order with listed item")
      }
      if (inventoryItem?.shipped && !cancelled) {
        skipReasons.push("already shipped")
      }
      if (orderPaymentStatus !== "PAID" && orderPaymentStatus !== "FULLY_REFUNDED") {
        skipReasons.push(`payment status: ${orderPaymentStatus}`)
      }
      
      if (skipReasons.length > 0) {
  
        inventoryItem = null
      }
      if (inventoryItem) {
        sale.inventoryItemId = inventoryItem._id
        sale.purchasePrice = inventoryItem.purchasePrice
        sale.sku = sku
        sale.dateListed = inventoryItem.dateListed
        sale.additionalCost = additionalCosts.reduce(
          (acc, cost) => acc + cost.amount,
          0
        )
        // console.log("Additional Cost: ", sale.additionalCost)
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

function getSaleInfo(sale, shippingTransactions, ebayFeePercent = 0.1135) {
  const {
    lineItems,
    paymentSummary: { payments },
    pricingSummary: {
      total: { value: priceSold },
    },
    totalMarketplaceFee,
    buyer: { username: buyer },
    purchasePrice,
    inventoryItemId,
    orderId,
    dateListed,
    cancelStatus,
    additionalCost,
  } = sale

  console.log(JSON.stringify(sale))

  // Calculate ebayFee - use totalMarketplaceFee if available, otherwise calculate as percentage
  let ebayFee = 0;
  if (totalMarketplaceFee && totalMarketplaceFee.value) {
    ebayFee = totalMarketplaceFee.value;
  } else {
    console.log(`No marketplace fee found for order ${orderId}, calculating using ${ebayFeePercent * 100}%`);
    ebayFee = (priceSold * ebayFeePercent).toFixed(2);
  }

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
    additionalCost,
    cancelled: cancelStatus?.cancelState === "CANCELED" ? true : false,
  }

  return saleInfo // Return the saleInfo object if not canceled
}

/**
 * Validates whether a cancellation should be processed
 * Prevents cancelling newer sales when processing old cancellations
 */
async function validateCancellation(saleInfo, currentItem) {
  const { orderId, buyer, dateSold: cancelledSaleDate, cancelled } = saleInfo
  
  if (!cancelled) return false
  
  // Check if item is currently sold
  if (!currentItem.sold) {
    console.log(`⚠️ Item ${currentItem.sku} not currently sold - nothing to cancel`)
    return false
  }
  
  // Check if order IDs match (most reliable check)
  if (currentItem.orderId && currentItem.orderId !== orderId) {
    console.log(`⚠️ Order ID mismatch - current: ${currentItem.orderId}, cancelled: ${orderId}`)
    console.log(`✅ Item has newer sale, skipping cancellation`)
    return false
  }
  
  // Check buyer match if both exist
  if (currentItem.buyer && buyer && currentItem.buyer !== buyer) {
    console.log(`⚠️ Buyer mismatch - current: ${currentItem.buyer}, cancelled: ${buyer}`)
    return false
  }
  
  // Check date logic - if cancelled sale date is older than current sale, skip
  if (currentItem.dateSold && cancelledSaleDate) {
    const currentSaleDate = new Date(currentItem.dateSold)
    const cancelDate = new Date(cancelledSaleDate)
    
    if (cancelDate < currentSaleDate) {
      console.log(`⚠️ Cancelled order is older than current sale`)
      console.log(`   Cancelled: ${cancelledSaleDate}, Current: ${currentItem.dateSold}`)
      console.log(`✅ Skipping cancellation - newer sale exists`)
      return false
    }
  }
  
  console.log(`✅ Cancellation validated for order ${orderId}`)
  return true
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
    }
  ])
  // console.log("Zero Cost List", zeroCostList)

  zeroCostList.forEach(async (x) => {
    const { _id, profit, title, orderId = "0" } = x
    const shipping = findShippingCostFromTransactions(
      orderId,
      shippingTransactions
    )
    if (shipping !== x.shippingCost) {
      // console.log(`Updating ${title} with shipping cost of ${shipping}`)
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
  const extraCost = additionalCosts.reduce((acc, cost) => acc + cost.amount, 0)
  const taxOnListedPrice = +listedPrice * +estimatedTaxRate
  const ebayFee = (+listedPrice + +taxOnListedPrice) * +ebayFeePercent
  const expectedProfit =
    +listedPrice - +ebayFee - +averageShippingCost - +purchasePrice - +extraCost

  return +expectedProfit.toFixed(2)
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

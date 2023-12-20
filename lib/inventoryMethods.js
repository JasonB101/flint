const InventoryItem = require("../models/inventoryItem");
const Buyer = require("../models/buyer");
const { saveBuyer } = require("../lib/buyerMethods");
const ebayFeePercent = 0.1

function updateUnlisted(ebayIds) {

    ebayIds.forEach(id => {
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
                    listed: false
                }

                InventoryItem.findOneAndUpdate({ ebayId: id }, updates, (err, result) => {
                    if (err) console.log(err)
                    if (result) console.log(id)
                })
            }
        })
    })


}

async function updateInventoryWithSales(userId, completedSales = [], shippingTransactions = []) {

    const salesToUpdateWith = await getSalesToUpdateWith(userId, completedSales);

    const itemsUpdated = await Promise.all(
        salesToUpdateWith.map(async (sale) => {
            //If the item isn't paid for yet, it wont update it
            if (!sale.PaidTime) {
                return false;
            }
            const saleInfo = getSaleInfo(sale, shippingTransactions);
            const { priceSold, ebayFees, trackingNumber, orderId,
                shipping, dateSold, buyer, purchasePrice, inventoryItemId } = saleInfo;
            let buyerId = "";

            try {
                buyer.userId = userId;
                const savedBuyer = await saveBuyer(buyer);
                if (savedBuyer === null) {
                    throw "Error occurred saving buyer";
                }
                buyerId = savedBuyer._id;
            } catch (e) {
                console.log(e, "Buyer Not Saved")
            }

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
                profit: +(priceSold - purchasePrice - ebayFees - shipping).toFixed(2),
                buyer: buyerId
            }

            return InventoryItem.findByIdAndUpdate(inventoryItemId, updates, { new: true });
        }))

    return itemsUpdated.filter(x => x)
    // return filtered array to get rid of unpaid items;
}

async function getSalesToUpdateWith(userId, completedSales = []) {
    //
    const salesToUpdateWith = await Promise.all(
        completedSales.map(async (sale) => {
            const { Item: { ItemID, SKU } } = sale
            try {
                // const inventoryItem = await InventoryItem.findOne({ userId: userId, ebayId: String(ItemID), shipped: false });
                const inventoryItem = await InventoryItem.findOne({ userId: userId, sku: SKU, shipped: false });
                if (inventoryItem) {
                    sale.inventoryItemId = inventoryItem._id;
                    sale.purchasePrice = inventoryItem.purchasePrice;
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
    const filteredSales = salesToUpdateWith.filter(sale => sale !== null);
    console.log("Number of Items to update: " + filteredSales.length)
    return filteredSales;
}

function getSaleInfo(sale, shippingTransactions) {
    const { Item: { ItemID },
        PaidTime, SKU, FinalValueFee, ShippingDetails, ConvertedTransactionPrice, Buyer, purchasePrice, inventoryItemId, ExtendedOrderID, OrderLineItemID } = sale;
    console.log(sale)
        let trackingNumber = null;
    let shipping = 0;

    // I need to check and see if the item has a tracking number, if it does check paypal. If its not in paypal, then that means the item was not shipped through ebay/paypal
    //Make so I can manually enter shipping. I need to see data from before the item is shipped. IMPORTANT!!!
    //We might be able to change this ish if the results before shipment doesnt have the values missing

    //"ShipmentTrackingDetails" shows up in an item that has shipped, but not in an item that hasn't.
    if (ShippingDetails.ShipmentTrackingDetails) {
        const trackingDetails = ShippingDetails.ShipmentTrackingDetails;
        if (trackingDetails.ShipmentTrackingNumber) {
            trackingNumber = trackingDetails.ShipmentTrackingNumber;
            shipping = findShippingCostFromTransactions(ExtendedOrderID, shippingTransactions);
        }
    } else {
        console.log(ItemID, "No tracking details")
    }
    const dateToMountain = new Date(PaidTime)
    dateToMountain.setHours(dateToMountain.getHours() - 6)
    const dateToString = dateToMountain.toLocaleDateString()
    const saleInfo = {
        purchasePrice,
        sku: SKU,
        inventoryItemId,
        ebayId: ItemID,
        priceSold: ConvertedTransactionPrice["$t"],
        ebayFees: FinalValueFee["$t"],
        dateSold: dateToString,
        shipping: shipping,
        orderId: ExtendedOrderID,
        trackingNumber,
        buyer: parseBuyerObject(Buyer)
    }
    
    return saleInfo

}

async function getInventoryItems(userId) {
    const inventoryList = await InventoryItem.find({ userId: userId }); //array
    const buyers = await Buyer.find(); //array
    const modifiedList = inventoryList.map(item => {
        let buyer = buyers.find(x => {
            return (String(x._id) === String(item.buyer) && String(x.userId) === String(userId))
        })
        if (buyer) {
            item.buyer = buyer;
        }
        return item;
    })
    return modifiedList;
}

function parseBuyerObject(Buyer) {
    const { Email, FeedbackScore, PositiveFeedbackPercent, RegistrationDate, UserID, BuyerInfo, UserFirstName, UserLastName } = Buyer
    const { Name, Street1, CityName, StateOrProvince, CountryName, Phone, PostalCode } = BuyerInfo.ShippingAddress;
    const buyer = {
        username: UserID,
        buyerFirstName: UserFirstName,
        buyerLastName: UserLastName,
        email: Email,
        feedBackScore: FeedbackScore,
        feedBackPercent: PositiveFeedbackPercent,
        memberSince: new Date(RegistrationDate).toLocaleDateString(),
        phone: Phone,
        shippingAddress: {
            name: cleanInfo(Name),
            street: cleanInfo(Street1),
            city: cleanInfo(CityName),
            state: cleanInfo(StateOrProvince),
            country: cleanInfo(CountryName),
            zip: cleanInfo(PostalCode)
        }
    }
    return buyer;

    function cleanInfo(info) {
        if (info === "{}" || typeof (info) === "object") return "n/a"
        return info;

    }
}

function updateItem(userId, itemId, updates) {
    InventoryItem.findOneAndUpdate({ userId: userId, _id: itemId }, updates, (err, result) => {
        if (err) console.log(err)
    })
}

async function updateAllZeroShippingCost(userId, shippingTransactions) {
    let foundUpdates = false
    const zeroCostList = await InventoryItem.find({ userId: userId, shippingCost: 0, shipped: true });

    zeroCostList.forEach(async (x) => {
        const { _id, profit, title, orderId = "0" } = x;
        const shipping = findShippingCostFromTransactions(orderId, shippingTransactions);
        if (shipping !== x.shippingCost) {
            foundUpdates = true
            updateItem(userId, _id, { shippingCost: shipping, profit: profit - shipping });
        }
    })

    return foundUpdates

}

function findShippingCostFromTransactions(orderId, transactions) {
    // console.log(transactions)
    const transaction = transactions.find(x => x.orderId === orderId);
    if (transaction) {
        return +transaction.amount.value;
    }
    return 0;

}

function figureProfit(listedPrice, purchasePrice, averageShippingCost) {
    //Need to find a way to determine what tier the user is on, and how much their eBay fees are.
    const ebayFee = listedPrice * ebayFeePercent
    //Need to get purchasePrice
    return +(listedPrice - ebayFee - averageShippingCost - purchasePrice).toFixed(2);
}

async function verifyCorrectPricesInInventoryItems(inventoryItems, ebayListings, averageShippingCost) {

    const updates = await Promise.all(
        ebayListings.map(listing => {
            const { BuyItNowPrice, ItemID, Title } = listing;
            const found = inventoryItems.find(item => item.ebayId === ItemID && (+item.listedPrice !== +BuyItNowPrice || item.title !== Title) );
            if (found) {
                return updateItemWithEbayListing(found._id, listing, averageShippingCost);
            }
            return false;
        })
    )

    return updates.filter(x => x).length > 0;
}

async function updateItemWithEbayListing(itemId, ebayListing, averageShippingCost) {
    const { BuyItNowPrice, OrderLineItemID, Title } = ebayListing; 
    const item = await InventoryItem.findById(itemId);
    const {purchasePrice} = item;
    const update = {
        title: Title,
        listedPrice: BuyItNowPrice,
        expectedProfit: figureProfit(BuyItNowPrice, purchasePrice, averageShippingCost),
        orderId: OrderLineItemID
    }
    const updatedItem = await InventoryItem.findByIdAndUpdate(itemId, update);

    return updatedItem;
}

module.exports = {
    updateInventoryWithSales,
    getInventoryItems,
    updateAllZeroShippingCost,
    figureProfit,
    verifyCorrectPricesInInventoryItems,
    updateUnlisted
}
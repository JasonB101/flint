const InventoryItem = require("../models/inventoryItem");
const Buyer = require("../models/buyer");
const { saveBuyer } = require("../lib/buyerMethods");
const { getPayPalShippingCost } = require("./payPalMethods")

async function updateInventoryWithSales(userId, completedSales) {
    const salesToUpdateWith = await getSalesToUpdateWith(userId, completedSales);


    const itemsUpdated = await Promise.all(
        salesToUpdateWith.map(async (sale) => {

            const saleInfo = await getSaleInfo(userId, sale);
            const { priceSold, ebayFees, payPalFees, trackingNumber, ebayId,
                shipping, dateSold, buyer, purchasePrice, inventoryItemId } = saleInfo;
            let buyerId = "";

            try {
                buyer.userId = userId;
                const savedBuyer = await saveBuyer(buyer);
                if (savedBuyer === null) {
                    throw "Error occured saving buyer";
                }
                buyerId = savedBuyer._id;
            } catch (e) {
                console.log(e, "Buyer Not Saved")
            }

            const updates = {
                priceSold,
                dateSold,
                ebayFees,
                payPalFees,
                trackingNumber,
                shippingCost: shipping,
                shipped: trackingNumber !== null,
                listed: false,
                status: "completed",
                sold: true,
                profit: +(priceSold - purchasePrice - ebayFees - payPalFees - shipping).toFixed(2),
                buyer: buyerId
            }

            return InventoryItem.findByIdAndUpdate(inventoryItemId, updates, { new: true });
        }))


    return itemsUpdated;
    // return filteredArray;
}

async function getSalesToUpdateWith(userId, completedSales) {
    //Create array of items with same ebayId
    //
    const salesToUpdateWith = await Promise.all(
        completedSales.map(async (sale) => {
            const { Item: { ItemID } } = sale
            try {
                const inventoryItem = await InventoryItem.findOne({ userId: userId, ebayId: String(ItemID), shipped: false });
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

async function getSaleInfo(userId, sale) {
    const { Item: { ItemID }, ExternalTransaction: { FeeOrCreditAmount },
        PaidTime, FinalValueFee, ShippingDetails, ConvertedTransactionPrice, Buyer, purchasePrice, inventoryItemId } = sale;

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
            shipping = await getPayPalShippingCost(userId, trackingNumber);
            console.log(shipping)
        }
    }
    const saleInfo = {
        purchasePrice,
        inventoryItemId,
        ebayId: ItemID,
        priceSold: ConvertedTransactionPrice["$t"],
        ebayFees: FinalValueFee["$t"],
        payPalFees: FeeOrCreditAmount["$t"],
        dateSold: new Date(PaidTime).toLocaleDateString(),
        shipping: shipping,
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
            name: Name,
            street: Street1,
            city: CityName,
            state: StateOrProvince,
            country: CountryName,
            zip: PostalCode
        }
    }
    return buyer;
}
module.exports = {
    updateInventoryWithSales,
    getInventoryItems
}
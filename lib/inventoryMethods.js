const InventoryItem = require("../models/inventoryItem");
const { saveBuyer } = require("../lib/buyerMethods");

async function updateInventoryWithSales(userId, completedSales) {
    const salesToUpdateWith = await getSalesToUpdateWith(userId, completedSales);
    

    const itemsUpdated = await Promise.all(
        salesToUpdateWith.map(async (sale) => {

            const saleInfo = await getSaleInfo(sale, userId);
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
            console.log(buyerId)

            const updates = {
                priceSold,
                dateSold,
                ebayFees,
                payPalFees,
                trackingNumber,
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
                const inventoryItem = await InventoryItem.findOne({ userId: userId, ebayId: String(ItemID), sold: false });
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
    console.log("Number of Item to update: " + filteredSales.length)
    return filteredSales;
}

async function getSaleInfo(sale) {
    const { Item: { ItemID }, ExternalTransaction: { FeeOrCreditAmount },
        PaidTime, FinalValueFee, ShippingDetails, AmountPaid, Buyer, purchasePrice, inventoryItemId } = sale;
    let trackingNumber = null;

    // I need to check and see if the item has a tracking number, if it does check paypal. If its not in paypal, then that means the item was not shipped through ebay/paypal
    //Make so I can manually enter shipping. I need to see data from before the item is shipped. IMPORTANT!!!
    //We might be able to change this ish if the results before shipment doesnt have the values missing
    if (ShippingDetails.ShipmentTrackingDetails) {
        const trackingDetails = ShippingDetails.ShipmentTrackingDetails;
        if (trackingDetails.ShipmentTrackingNumber) {
            trackingNumber = trackingDetails.ShipmentTrackingNumber;
        }
    }
    const saleInfo = {
        purchasePrice,
        inventoryItemId,
        ebayId: ItemID,
        priceSold: AmountPaid["$t"],
        ebayFees: FinalValueFee["$t"],
        payPalFees: FeeOrCreditAmount["$t"],
        dateSold: new Date(PaidTime).toLocaleDateString(),
        shipping: 0,
        trackingNumber,
        buyer: parseBuyerObject(Buyer)
    }

    return saleInfo

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
    updateInventoryWithSales
}
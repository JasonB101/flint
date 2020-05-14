function prepItemsForImport(items) {
    let soldItems = items.filter(x => x.DateSold);
    let activeItems = items.filter(x => x.DateSold === "");
    let parsedSold = soldItems.map(x => soldItemParse(x))
    let parsedActive = activeItems.map(x => activeItemParse(x))

    return [...parsedSold, ...parsedActive]
}

function soldItemParse(item) {
    let { DatePurchased, DateSold, Item, PartNo, PayPalFees, PriceSold, PurchasePrice, SKU, Shipping, eBayFees } = item;
    PriceSold = currencyToNum(PriceSold);
    PayPalFees = currencyToNum(PayPalFees);
    eBayFees = currencyToNum(eBayFees);
    PurchasePrice = currencyToNum(PurchasePrice);
    Shipping = currencyToNum(Shipping)
    let form = {
        item: Item,
        partNo: PartNo,
        sku: SKU,
        datePurchased: modifyDate(DatePurchased),
        purchasePrice: PurchasePrice,
        purchaseLocation: "Unknown",
        priceSold: PriceSold,
        dateSold: modifyDate(DateSold),
        shippingCost: Shipping,
        ebayFees: eBayFees,
        payPalFees: PayPalFees,
        shipped: true,
        sold: true,
        profit: +(PriceSold - PurchasePrice - eBayFees - PayPalFees - Shipping).toFixed(2),
        status: "sold"
    }

    return form;
}

function activeItemParse(item) {
    const { DatePurchased, Item, PartNo, PurchasePrice, SKU } = item
    let form = {
        item: Item,
        partNo: PartNo,
        sku: SKU,
        datePurchased: modifyDate(DatePurchased),
        purchasePrice: currencyToNum(PurchasePrice),
        status: "active",
        purchaseLocation: "Unknown",
    }

    return form;
}

function modifyDate(oldDate) {
    // 2020-05-21  to   05/21/2020
    const array = oldDate.split("-")
    array.push(array.shift())
    let newDate = array.join("/")
    return newDate
}

function currencyToNum(string) {
    return +string.replace("$", "")
}

module.exports = prepItemsForImport
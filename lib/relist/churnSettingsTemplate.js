const churnSettings = {
    percentageReduction: 0.1,
    daysListedUntilPriceReduction: 50,
    allowNegativeProfit: false,
    allowReListWithWatchers: false,
    quantityToReList: 1,
    listingAgent: "churn"

}

const relistSettings = {
    newListedPrice: 100,
    listingAgent: "member"
}

//Re list the oldest listing each day. 
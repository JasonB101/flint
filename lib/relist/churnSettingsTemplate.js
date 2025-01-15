const churnSettings = {
    percentageReduction: 0.1,
    daysListedUntilPriceReduction: 50,
    allowPriceReduction: true,
    allowNegativeProfit: false,
    allowReListWithWatchers: false,
    quantityToReList: 1,
    maxPriceReduction: 30,
    listingAgent: "churn"

}

const relistSettings = {
    manualListedPrice: 100,
    listingAgent: "member"
}

//Re list the oldest listing each day. 

const query = db.inventoryitems.aggregate([
    {
      $match: {
        listed: true,
        userId: ObjectId("5eb9d103e124100017a09da9")
      },
    },
    {
      $addFields: {
        oldestDate: {
          $ifNull: [
            { $dateFromString: { dateString: "$dateReListed", format: "%m/%d/%Y" } },
            { $dateFromString: { dateString: "$dateListed", format: "%m/%d/%Y" } }
          ],
        },
      },
    },
    {
      $sort: { oldestDate: 1 }
    },
    {
      $limit: 1
    },
  ]);
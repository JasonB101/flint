const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../../.env") })
const mongoose = require("mongoose")
const dataBaseURI = process.env.MONGO_ATLAS_CLUSTER1
mongoose.set("strictQuery", false)
mongoose.connect(
  dataBaseURI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) throw err
    console.log("Connected to MongoDB")
  }
)

const InventoryItem = require("../../models/inventoryItem")

const getSoldItemData = async () => {
  let items = await fetchSoldItems()
  let aggregatedItems = aggregateSoldItems(items)
  let filteredItems = filterResults(aggregatedItems)
  console.log(filteredItems)
}

const fetchSoldItems = async () => {
  const items = await InventoryItem.find({ sold: true })
  return items
}

function aggregateSoldItems(items) {
  const aggregatedData = {}

  items.forEach((item) => {
    const { partNo, priceSold, datePurchased, dateSold, title } = item

    if (!aggregatedData[partNo]) {
      aggregatedData[partNo] = {
        title,
        partNo,
        quantitySold: 0,
        avgSoldPrice: 0,
        avgTimeInInventory: 0,
      }
    }

    aggregatedData[partNo].quantitySold += 1
    aggregatedData[partNo].avgSoldPrice += priceSold

    const purchaseDate = new Date(datePurchased)
    const soldDate = new Date(dateSold)
    const daysInInventory = Math.round(
      (soldDate - purchaseDate) / (1000 * 60 * 60 * 24)
    )

    aggregatedData[partNo].avgTimeInInventory += daysInInventory
  })

  Object.values(aggregatedData).forEach((item) => {
    if (item.quantitySold > 0) {
      item.avgTimeInInventory = Math.round(
        item.avgTimeInInventory / item.quantitySold
      )
      item.avgSoldPrice = +(item.avgSoldPrice / item.quantitySold).toFixed(2)
    }
  })

  const resultArray = Object.values(aggregatedData)
  return resultArray
}

function filterResults(array) {
  const conditions = [
    item => item.partNo.length > 3,
  ]
  
  const filteredItems = array.filter(item => conditions.every(condition => condition(item)))
  return filteredItems
}

getSoldItemData()

//Notes
//I can search the part number, and then verify the listing by making sure it shares at least 3 words with the title of the part I have listed

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

const updateROIs = async () => {
    try {
      // Find all items with ROI
      const itemsWithROI = await InventoryItem.find({ roi: { $exists: true } });
  
      // Update each item by rounding or flooring the ROI value
      for (const item of itemsWithROI) {
        // Choose either $round or $floor based on your preference
        const updatedROI = await InventoryItem.updateOne(
          { _id: item._id },
          [{ $set: { roi: { $round: ["$roi"] } } }]
        );
      }
  
      console.log("ROIs updated successfully.");
    } catch (error) {
      console.error("Error updating ROIs:", error);
    }
  };
  
  // Call the function to update ROIs
  updateROIs();

// const fetchAndFilter = async () => {
//   let items = await fetchSoldItems()
//   console.log(items)
// }

// const fetchSoldItems = async () => {
//   const items = await InventoryItem.find({ sold: true })
//   return items
// }

// fetchAndFilter()

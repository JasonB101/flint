const path = require("path")
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
})
const mongoose = require("mongoose")

const connectDB = () => {
  try {
    mongoose.set("strictQuery", false)
    mongoose.connect(
      process.env.MONGO_ATLAS_CLUSTER1,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      (err) => {
        if (err) throw err
        console.log("Connected to MongoDB")
      }
    )
  } catch (err) {
    console.error("Database connection error:", err)
    process.exit(1)
  }
}

module.exports = connectDB

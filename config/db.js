const mongoose = require("mongoose")
require("dotenv").config()

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
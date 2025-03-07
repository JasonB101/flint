const express = require("express")
const carPartRouter = express.Router()
const fetchOptions = require("../lib/carPartCom/fetchOptions")
const { yearModelPartQuery } = require("../lib/carPartCom/carPartApi")
const getAllParts = require("../lib/carPartCom/getAllParts")

carPartRouter.get("/getoptions", async (req, res, next) => {
  const models = await fetchOptions()
  res.status(200).send(models || [])
})

carPartRouter.get("/getpartoptions", async (req, res, next) => {
  try {
    // Extract the query parameters
    const { year, model, part } = req.query
    console.log(year, model, part)

    // Validate required parameters
    if (!year || !model || !part) {
      return res.status(400).send({
        error: "Missing required parameters",
      })
    }

    // Call the API with the provided parameters
    const partOptions = await yearModelPartQuery({
      year: year,
      model: model,
      part: part,
      zipCode: req.query.zipCode || "84067", // Use default if not provided
    })

    res.status(200).send(partOptions || [])
  } catch (error) {
    console.error("Error fetching part options:", error)
    res.status(500).send({
      error: "Failed to fetch part options",
      message: error.message,
    })
  }
})

carPartRouter.post("/getallparts", async (req, res, next) => {
  const {payloads} = req.body

  const parts = await getAllParts(payloads)
  if (!parts) {
    return res.status(500).send({
      error: "Failed to fetch parts",
    })
  }

  res.status(200).send(parts)


})

module.exports = carPartRouter

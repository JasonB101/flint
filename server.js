const express = require("express")
const app = express()
const morgan = require("morgan")
const mongoose = require("mongoose")
require("dotenv").config()
const PORT = process.env.PORT || 3825
const path = require("path")
const {expressjwt: expressJWT} = require("express-jwt")

app.use(express.json())
app.use(morgan('dev'))
app.use(express.static('media'))

//Heroku Deployment 
app.use(express.static(path.join(__dirname, "client", "build")))
//Logged in routes, attatches user to req
app.use("/api", expressJWT({ secret: process.env.SECRET, algorithms: ['HS256'] }));

app.use("/api/inventoryItems", require("./routes/inventoryItems"))
app.use("/api/expense", require("./routes/expense"))
app.use("/api/syncebay", require("./routes/syncEbay"))
app.use("/api/syncpaypal", require("./routes/syncPayPal"))
app.use("/api/ebay", require("./routes/ebay"))
app.use("/api/milestones", require("./routes/milestones"))
app.use("/auth", require("./routes/auth"))

app.use((req, res, next) => {
    req.setTimeout(60000, () => {
      console.log('Request timed out!');
      res.status(408).send('Request timed out');
    });
    next();
  })

// Connect to colection
mongoose.set('strictQuery', false)
mongoose.connect(process.env.MONGO_ATLAS_CLUSTER1,{
    useNewUrlParser: true,
    useUnifiedTopology: true
}, ((err) => {
    if (err) throw (err)
    console.log("Connected to MongoDB")
}))

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
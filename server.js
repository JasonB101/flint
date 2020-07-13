const express = require("express")
const app = express()
const morgan = require("morgan")
const mongoose = require("mongoose")
require("dotenv").config()
const PORT = process.env.PORT || 3825
const path = require("path")
const expressJWT = require("express-jwt")

app.use(express.json())
app.use(morgan('dev'))
app.use(express.static('media'))

//Heroku Deployment 
app.use(express.static(path.join(__dirname, "client", "build")))

//Logged in routes, attatches user to req
app.use("/api", expressJWT({ secret: process.env.SECRET, algorithms: ['RS256'] }));

app.use("/api/inventoryItems", require("./routes/inventoryItems"))
app.use("/api/expense", require("./routes/expense"))
app.use("/api/syncebay", require("./routes/syncEbay"))
app.use("/api/syncpaypal", require("./routes/syncPayPal"))
app.use("/api/ebay", require("./routes/ebay"))
app.use("/auth", require("./routes/auth"))

// Connect to colection
mongoose.set('useCreateIndex', true)
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGOLAB_CYAN_URI,{
    useNewUrlParser: true
}, ((err) => {
    if (err) throw (err)
    console.log("Connected to MongoDB")
}))

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
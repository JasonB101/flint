const express = require("express")
const app = express()
const morgan = require("morgan")
require("dotenv").config()
const PORT = process.env.PORT || 3825
const path = require("path")
const {expressjwt: expressJWT} = require("express-jwt")
const connectDB = require("./config/db")

app.use(express.json())
app.use(morgan('dev'))
app.use(express.static('media'))

//Heroku Deployment 
app.use(express.static(path.join(__dirname, "client", "build")))
//Logged in routes, attatches user to req
app.use("/api", expressJWT({ secret: process.env.SECRET, algorithms: ['HS256'] }));

app.use("/api/inventoryItems", require("./routes/inventoryItems"))
app.use("/api/churnSettings", require("./routes/churnSettings"))
app.use("/api/expense", require("./routes/expense"))
app.use("/api/syncebay", require("./routes/syncEbay"))
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
connectDB()

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
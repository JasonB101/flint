require("./instrument")
const express = require("express")
const app = express()
const http = require("http")
const socketIo = require("socket.io")
const morgan = require("morgan")
require("dotenv").config()
const PORT = process.env.PORT || 3825
const path = require("path")
const { expressjwt: expressJWT } = require("express-jwt")
const connectDB = require("./config/db")

// Create HTTP server and Socket.IO instance
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : [
      "http://localhost:3000", 
      "https://localhost:3000"  // Allow both HTTP and HTTPS
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
})

// Make io available to routes
app.set('io', io)

app.use(express.json())
app.use(morgan("dev"))
app.use(express.static("media"))

//Heroku Deployment
app.use(express.static(path.join(__dirname, "client", "build")))
//Logged in routes, attatches user to req
app.use(
  "/api",
  expressJWT({ secret: process.env.SECRET, algorithms: ["HS256"] })
)

app.use("/api/inventoryItems", require("./routes/inventoryItems"))
app.use("/api/churnSettings", require("./routes/churnSettings"))
app.use("/api/carparthunter", require("./routes/carPartHunter"))
app.use("/api/expense", require("./routes/expense"))
app.use("/api/syncebay", require("./routes/syncEbay"))
app.use("/api/ebay", require("./routes/ebay"))
app.use("/api/milestones", require("./routes/milestones"))
app.use("/api/notifications", require("./routes/notifications"))
app.use("/auth", require("./routes/auth"))

app.use((req, res, next) => {
  req.setTimeout(60000, () => {
    console.log("Request timed out!")
    res.status(408).send("Request timed out")
  })
  next()
})

// Connect to colection
connectDB()

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "build", "index.html"))
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  socket.on('join-user-room', (userId) => {
    socket.join(userId)
    socket.emit('room-joined', { userId, roomId: userId })
  })
})

server.listen(PORT, () => console.log(`🚀 Server listening on port: ${PORT}`))

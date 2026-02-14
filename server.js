import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import http from "http"
import { Server } from "socket.io"
import Redis from "ioredis"
import helmet from "helmet"
import rateLimit from "express-rate-limit"

// Import routes
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import reportRoutes from "./routes/report.routes.js"
import notificationRoutes from "./routes/notification.routes.js"
import communityRoutes from "./routes/community.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import aiRoutes from "./routes/ai.routes.js"

// Import middleware
import { verifyToken } from "./middleware/auth.middleware.js"
import { errorHandler } from "./middleware/error.middleware.js"

// Import socket handlers
import { setupSocketHandlers } from "./sockets/socketHandlers.js"

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const server = http.createServer(app)

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Initialize Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
})

// Set up socket handlers
setupSocketHandlers(io, redisClient)

// Middleware
app.use(helmet()) // Security headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "50mb" })) // For parsing JSON
app.use(express.urlencoded({ extended: true, limit: "50mb" })) // For parsing URL-encoded data

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Make Redis client available to all routes
app.use((req, res, next) => {
  req.redisClient = redisClient
  req.io = io
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", verifyToken, userRoutes)
app.use("/api/reports", verifyToken, reportRoutes)
app.use("/api/notifications", verifyToken, notificationRoutes)
app.use("/api/community", verifyToken, communityRoutes)
app.use("/api/admin", verifyToken, adminRoutes)
app.use("/api/ai", verifyToken, aiRoutes)

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Error handling middleware
app.use(errorHandler)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")

    // Start the server
    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err)
  // Don't crash the server, but log the error
})

export { redisClient, io }


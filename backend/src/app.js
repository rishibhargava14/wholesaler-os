const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const customerRoutes = require("./routes/customers");
const orderRoutes = require("./routes/orders");
const priceListRoutes = require("./routes/pricelists");
const stockRoutes = require("./routes/stock");
const ledgerRoutes = require("./routes/ledger");
const tallyRoutes = require("./routes/tally");
const whatsappRoutes = require("./routes/whatsapp");
const auditRoutes = require("./routes/audit");
const wholesaleRoutes = require("./routes/wholesale");

const app = express();

// Enhanced CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
      );
    }
  });
  next();
});

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Enhanced health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Wholesaler OS API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/pricelists", priceListRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/tally", tallyRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/wholesale", wholesaleRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: `API route ${req.originalUrl} not found.`,
    available: [
      "/api/health",
      "/api/auth",
      "/api/products",
      "/api/customers",
      "/api/orders",
      "/api/pricelists",
      "/api/stock",
      "/api/ledger",
    ],
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    message: err.message || "Internal server error.",
    code: err.code || "INTERNAL_ERROR",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

module.exports = app;

const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");
const Product = require("../models/Product");
const { protect, optionalAuth } = require("../middleware/auth");

// @desc    Update product stock and create stock log
// @route   POST /api/stock/update
// @access  Private
router.post("/update", protect, async (req, res) => {
  try {
    const companyId = req.companyId;
    const { productId, type, qty, reason } = req.body;

    if (!productId || !type || !qty) {
      return res.status(400).json({
        message: "Product ID, type (in/out), and quantity are required.",
      });
    }

    if (!["in", "out"].includes(type)) {
      return res.status(400).json({
        message: 'Stock type must be "in" or "out".',
      });
    }

    const product = await Product.findOne({ _id: productId, companyId });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const quantity = Number(qty);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number." });
    }

    if (type === "in") {
      product.stock += quantity;
    } else {
      product.stock = Math.max(0, product.stock - quantity);
    }

    await product.save();

    const stockLog = await Stock.create({
      companyId,
      productId: product._id,
      type,
      qty: quantity,
      reason: reason || (type === "in" ? "purchase" : "adjustment"),
    });

    const populatedLog = await Stock.findById(stockLog._id).populate(
      "productId",
      "name sku unit stock minStock"
    );

    res.status(201).json({
      success: true,
      stock: populatedLog,
      product,
    });
  } catch (error) {
    console.error("Stock update error:", error);
    res.status(500).json({
      message: error.message || "Failed to update stock.",
    });
  }
});

// @desc    Get stock movement logs
// @route   GET /api/stock/logs (and /list)
// @access  Public / Private
router.get(["/logs", "/list"], optionalAuth, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }

    const filter = { companyId };
    if (req.query.productId) {
      filter.productId = req.query.productId;
    }
    if (req.query.type && req.query.type !== "all") {
      filter.type = req.query.type;
    }
    if (req.query.reason && req.query.reason !== "all") {
      filter.reason = req.query.reason;
    }

    const logs = await Stock.find(filter)
      .populate("productId", "name sku unit stock minStock")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({
      success: true,
      logs,
      stock: logs,
      data: logs,
    });
  } catch (error) {
    console.error("Get stock logs error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch stock logs.",
    });
  }
});

module.exports = router;

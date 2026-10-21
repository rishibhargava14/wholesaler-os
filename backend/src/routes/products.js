const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Stock = require("../models/Stock");
const { protect, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

// @desc    Create a new product (with optional image uploads)
// @route   POST /api/products/create
// @access  Private
router.post(
  "/create",
  protect,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const companyId = req.companyId;
      const {
        name,
        sku,
        category,
        mrp,
        wholesalePrice,
        retailPrice,
        gstPercent,
        stock,
        minStock,
        unit,
        tallyItemId,
        status,
      } = req.body;

      if (!name || !sku || wholesalePrice === undefined || retailPrice === undefined) {
        return res.status(400).json({
          message: "Name, SKU, Wholesale Price, and Retail Price are required.",
        });
      }

      // Check unique SKU within company
      const existingProduct = await Product.findOne({ companyId, sku: sku.trim() });
      if (existingProduct) {
        return res.status(400).json({
          message: `A product with SKU "${sku}" already exists.`,
        });
      }

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
      }

      const initialStock = Number(stock) || 0;

      const product = await Product.create({
        companyId,
        name: name.trim(),
        sku: sku.trim(),
        category: category ? category.trim() : "General",
        mrp: Number(mrp) || 0,
        wholesalePrice: Number(wholesalePrice) || 0,
        retailPrice: Number(retailPrice) || 0,
        gstPercent: Number(gstPercent) || 0,
        stock: initialStock,
        minStock: Number(minStock) || 0,
        unit: unit || "pcs",
        tallyItemId: tallyItemId || "",
        status: status || "active",
        images: imageUrls,
      });

      // Record initial stock in log if stock > 0
      if (initialStock > 0) {
        await Stock.create({
          companyId,
          productId: product._id,
          type: "in",
          qty: initialStock,
          reason: "purchase",
        });
      }

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({
        message: error.message || "Failed to create product.",
      });
    }
  }
);

// @desc    Get products list
// @route   GET /api/products/list
// @access  Public / Private (supports companyId in query or token)
router.get("/list", optionalAuth, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }

    const filter = { companyId };

    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    let products = await Product.find(filter).sort({ createdAt: -1 });

    if (req.query.lowStock === "true" || req.query.lowStock === true) {
      products = products.filter((p) => Number(p.stock) <= Number(p.minStock));
    }

    res.json({
      success: true,
      products,
      data: products, // compatible with both shapes
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch products.",
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public / Private
router.get("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch product." });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
router.put(
  "/:id",
  protect,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const product = await Product.findOne({
        _id: req.params.id,
        companyId: req.companyId,
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      const updates = { ...req.body };

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file) => `/uploads/${file.filename}`);
        updates.images = [...(product.images || []), ...newImages];
      }

      if (updates.stock !== undefined) {
        const diff = Number(updates.stock) - product.stock;
        if (diff !== 0) {
          await Stock.create({
            companyId: req.companyId,
            productId: product._id,
            type: diff > 0 ? "in" : "out",
            qty: Math.abs(diff),
            reason: "adjustment",
          });
        }
      }

      Object.assign(product, updates);
      await product.save();

      res.json({
        success: true,
        product,
      });
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: error.message || "Failed to update product." });
    }
  }
);

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      companyId: req.companyId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ success: true, message: "Product deleted.", product });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete product." });
  }
});

module.exports = router;

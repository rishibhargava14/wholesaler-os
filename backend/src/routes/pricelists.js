const express = require("express");
const router = express.Router();
const PriceList = require("../models/PriceList");
const { protect, optionalAuth } = require("../middleware/auth");

// @desc    Create a new price list
// @route   POST /api/pricelists/create
// @access  Private
router.post("/create", protect, async (req, res) => {
  try {
    const companyId = req.companyId;
    const { name, discountPercent, products } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Price list name is required." });
    }

    const priceList = await PriceList.create({
      companyId,
      name: name.trim(),
      discountPercent: Number(discountPercent) || 0,
      products: Array.isArray(products)
        ? products.map((p) => ({
            productId: p.productId,
            customPrice: Number(p.customPrice) || 0,
          }))
        : [],
    });

    res.status(201).json({
      success: true,
      priceList,
    });
  } catch (error) {
    console.error("Create price list error:", error);
    res.status(500).json({
      message: error.message || "Failed to create price list.",
    });
  }
});

// @desc    Get price lists
// @route   GET /api/pricelists/list
// @access  Public / Private
router.get("/list", optionalAuth, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }

    const priceLists = await PriceList.find({ companyId })
      .populate("products.productId", "name sku wholesalePrice retailPrice")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      priceLists,
      data: priceLists,
    });
  } catch (error) {
    console.error("Get price lists error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch price lists.",
    });
  }
});

// @desc    Get single price list
// @route   GET /api/pricelists/:id
// @access  Public / Private
router.get("/:id", protect, async (req, res) => {
  try {
    const priceList = await PriceList.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    }).populate(
      "products.productId",
      "name sku wholesalePrice retailPrice"
    );

    if (!priceList) {
      return res.status(404).json({ message: "Price list not found." });
    }

    res.json({ success: true, priceList });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch price list.",
    });
  }
});

module.exports = router;

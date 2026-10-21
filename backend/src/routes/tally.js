const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Stock = require("../models/Stock");
const { protect } = require("../middleware/auth");

// @desc    Sync stock and prices from Tally ERP
// @route   POST /api/tally/sync
// @access  Private
router.post("/sync", protect, async (req, res) => {
  try {
    const companyId = req.companyId;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "An array of items [{ sku, stock, price }] is required.",
      });
    }

    const syncedResults = [];
    let updatedCount = 0;

    for (const item of items) {
      if (!item.sku) continue;

      const product = await Product.findOne({
        companyId,
        $or: [{ sku: item.sku }, { tallyItemId: item.sku }],
      });

      if (product) {
        const newStock = Number(item.stock);
        const oldStock = product.stock;

        if (!isNaN(newStock) && newStock !== oldStock) {
          const diff = newStock - oldStock;
          product.stock = newStock;

          await Stock.create({
            companyId,
            productId: product._id,
            type: diff >= 0 ? "in" : "out",
            qty: Math.abs(diff),
            reason: "tally",
          });
        }

        if (item.price !== undefined && !isNaN(Number(item.price))) {
          product.wholesalePrice = Number(item.price);
        }

        await product.save();
        updatedCount++;
        syncedResults.push({
          sku: item.sku,
          name: product.name,
          stock: product.stock,
          wholesalePrice: product.wholesalePrice,
          status: "updated",
        });
      } else {
        syncedResults.push({
          sku: item.sku,
          status: "not_found",
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully synced ${updatedCount} items with Tally.`,
      updatedCount,
      items: syncedResults,
    });
  } catch (error) {
    console.error("Tally sync error:", error);
    res.status(500).json({
      message: error.message || "Failed to sync with Tally.",
    });
  }
});

module.exports = router;

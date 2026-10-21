const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// @desc    Get public catalog by company subdomain
// @route   GET /api/wholesale/:subdomain
// @access  Public
router.get("/:subdomain", async (req, res) => {
  try {
    const { subdomain } = req.params;
    const cleanSubdomain = subdomain.toLowerCase().trim();

    const company = await Company.findOne({ subdomain: cleanSubdomain }).select(
      "name subdomain phone address settings wholesaleType"
    );

    if (!company) {
      return res.status(404).json({ message: "Wholesaler store not found." });
    }

    const products = await Product.find({
      companyId: company._id,
      status: "active",
    })
      .select(
        "name sku category mrp wholesalePrice retailPrice stock minStock unit images"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      company,
      products,
    });
  } catch (error) {
    console.error("Public catalog error:", error);
    res.status(500).json({
      message: error.message || "Failed to load wholesale catalog.",
    });
  }
});

// @desc    Submit wholesale lead inquiry
// @route   POST /api/wholesale/:subdomain/inquiry
// @access  Public
router.post("/:subdomain/inquiry", async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { shopName, phone } = req.body;

    if (!shopName || !phone) {
      return res.status(400).json({
        message: "Please enter your shop name and phone number.",
      });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim();
    const company = await Company.findOne({ subdomain: cleanSubdomain });

    if (!company) {
      return res.status(404).json({ message: "Wholesaler store not found." });
    }

    // Check if customer already exists for this company
    let customer = await Customer.findOne({
      companyId: company._id,
      phone: phone.trim(),
    });

    if (!customer) {
      customer = await Customer.create({
        companyId: company._id,
        shopName: shopName.trim(),
        ownerName: shopName.trim(),
        phone: phone.trim(),
        status: "active",
        creditLimit: 0,
        creditDays: 0,
        outstandingAmount: 0,
      });
    }

    res.status(201).json({
      success: true,
      message: "Your inquiry has been submitted successfully.",
      customer,
    });
  } catch (error) {
    console.error("Wholesale inquiry error:", error);
    res.status(500).json({
      message: error.message || "Failed to submit wholesale inquiry.",
    });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Ledger = require("../models/Ledger");
const { protect, optionalAuth } = require("../middleware/auth");

// @desc    Create customer
// @route   POST /api/customers/create
// @access  Private
router.post("/create", protect, async (req, res) => {
  try {
    const companyId = req.companyId;
    const {
      shopName,
      ownerName,
      phone,
      email,
      address,
      gstNo,
      priceListId,
      creditLimit,
      creditDays,
    } = req.body;

    if (!shopName || !phone) {
      return res.status(400).json({
        message: "Shop name and phone number are required.",
      });
    }

    const customer = await Customer.create({
      companyId,
      shopName: shopName.trim(),
      ownerName: ownerName ? ownerName.trim() : "",
      phone: phone.trim(),
      email: email ? email.trim() : "",
      address: address ? address.trim() : "",
      gstNo: gstNo ? gstNo.trim() : "",
      priceListId: priceListId || null,
      creditLimit: Number(creditLimit) || 0,
      creditDays: Number(creditDays) || 0,
      outstandingAmount: 0,
      status: "active",
    });

    res.status(201).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({
      message: error.message || "Failed to create customer.",
    });
  }
});

// @desc    Get customer list
// @route   GET /api/customers/list
// @access  Public / Private
router.get("/list", optionalAuth, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }

    const filter = { companyId };

    if (req.query.priceList) {
      filter.priceListId = req.query.priceList;
    }

    const customers = await Customer.find(filter)
      .populate("priceListId", "name discountPercent")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      customers,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch customers.",
    });
  }
});

// @desc    Get customer ledger entries and calculate outstanding
// @route   GET /api/customers/ledger
// @access  Private / OptionalAuth
router.get("/ledger", optionalAuth, async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required." });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      companyId: req.companyId,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const entries = await Ledger.find({
      customerId,
      companyId: req.companyId,
    })
      .sort({ createdAt: -1 })
      .populate("orderId", "orderNo grandTotal");

    // calculate outstanding = sum debit - sum credit
    const outstanding = entries.reduce((acc, entry) => {
      if (entry.type === "debit") {
        return acc + Number(entry.amount || 0);
      }
      return acc - Number(entry.amount || 0);
    }, 0);

    // Sync back to customer outstandingAmount if needed
    if (customer.outstandingAmount !== Math.max(0, outstanding)) {
      customer.outstandingAmount = Math.max(0, outstanding);
      await customer.save();
    }

    res.json({
      success: true,
      entries,
      outstanding: Math.max(0, outstanding),
      customer,
    });
  } catch (error) {
    console.error("Get customer ledger error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch ledger.",
    });
  }
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Public / Private
router.get("/:id", protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    }).populate(
      "priceListId"
    );
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch customer." });
  }
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    Object.assign(customer, req.body);
    await customer.save();

    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update customer." });
  }
});

module.exports = router;

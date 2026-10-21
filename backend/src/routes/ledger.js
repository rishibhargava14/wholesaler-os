const express = require("express");
const router = express.Router();
const Ledger = require("../models/Ledger");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const { protect } = require("../middleware/auth");

// @desc    Record a customer payment and clear credit
// @route   POST /api/ledger/payment
// @access  Private
router.post("/payment", protect, async (req, res) => {
  try {
    const companyId = req.companyId;
    const { customerId, amount, paymentMode = "Cash", description } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required." });
    }

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        message: "Please enter a valid positive payment amount.",
      });
    }

    const customer = await Customer.findOne({ _id: customerId, companyId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // 1. Create Ledger credit entry
    const entry = await Ledger.create({
      companyId,
      customerId: customer._id,
      type: "credit",
      amount: paymentAmount,
      paymentMode,
      description: description || `Payment received via ${paymentMode}`,
    });

    // 2. Update Customer outstanding amount
    customer.outstandingAmount = Math.max(
      0,
      Number(customer.outstandingAmount || 0) - paymentAmount
    );
    await customer.save();

    // 3. Clear credit orders if customer outstanding is cleared or reduced
    // Find unpaid credit orders (oldest first)
    const pendingCreditOrders = await Order.find({
      companyId,
      customerId: customer._id,
      paymentStatus: "credit",
      status: { $ne: "cancelled" },
    }).sort({ createdAt: 1 });

    let remainingPayment = paymentAmount;
    for (const order of pendingCreditOrders) {
      if (remainingPayment >= order.grandTotal) {
        order.paymentStatus = "paid";
        await order.save();
        remainingPayment -= order.grandTotal;
      } else {
        // partial payment, stop marking full orders
        break;
      }
    }

    res.status(201).json({
      success: true,
      entry,
      ledger: entry,
      outstandingAmount: customer.outstandingAmount,
    });
  } catch (error) {
    console.error("Ledger payment error:", error);
    res.status(500).json({
      message: error.message || "Failed to record payment.",
    });
  }
});

module.exports = router;

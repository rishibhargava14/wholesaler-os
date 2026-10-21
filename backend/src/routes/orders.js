const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const PriceList = require("../models/PriceList");
const Stock = require("../models/Stock");
const Ledger = require("../models/Ledger");
const { protect, optionalAuth } = require("../middleware/auth");

// Helper to generate sequential orderNo
async function generateOrderNumber(companyId) {
  const currentYear = new Date().getFullYear();
  const count = await Order.countDocuments({ companyId });
  const seq = String(count + 1).padStart(4, "0");
  return `ORD-${currentYear}-${seq}`;
}

// @desc    Create an order
// @route   POST /api/orders/create
// @access  Private
router.post("/create", protect, async (req, res) => {
  try {
    const companyId = req.companyId;
    const { customerId, items, paymentMode, discount = 0 } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required." });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required." });
    }

    if (!paymentMode || !["UPI", "Cash", "Credit"].includes(paymentMode)) {
      return res.status(400).json({
        message: "Valid payment mode (UPI, Cash, Credit) is required.",
      });
    }

    // 1. Fetch Customer
    const customer = await Customer.findOne({ _id: customerId, companyId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // 2. Fetch Customer PriceList if assigned
    let priceList = null;
    if (customer.priceListId) {
      priceList = await PriceList.findOne({
        _id: customer.priceListId,
        companyId,
      });
    }

    // 3. Process items and calculate totals
    const orderItems = [];
    let subtotal = 0;
    let gstTotal = 0;

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        companyId,
      });

      if (!product) {
        return res.status(404).json({
          message: `Product not found with ID ${item.productId}`,
        });
      }

      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({
          message: "Each item quantity must be a positive whole number.",
        });
      }

      // Determine price based on priceList
      let unitPrice = Number(product.wholesalePrice) || 0;

      if (priceList) {
        const customItem = priceList.products.find(
          (p) => String(p.productId) === String(product._id)
        );

        if (customItem && customItem.customPrice > 0) {
          unitPrice = customItem.customPrice;
        } else if (priceList.discountPercent > 0) {
          unitPrice =
            product.wholesalePrice * (1 - priceList.discountPercent / 100);
        }
      }

      const lineTotal = unitPrice * qty;
      const gstPercent = Number(product.gstPercent) || 0;
      const lineGst = (lineTotal * gstPercent) / 100;

      subtotal += lineTotal;
      gstTotal += lineGst;

      orderItems.push({
        productId: product._id,
        title: product.name,
        qty,
        price: unitPrice,
        gstPercent,
      });

      // Deduct product stock
      product.stock = Math.max(0, product.stock - qty);
      await product.save();

      // Create Stock OUT log
      await Stock.create({
        companyId,
        productId: product._id,
        type: "out",
        qty,
        reason: "sale",
      });
    }

    const safeDiscount = Math.min(Number(discount) || 0, subtotal + gstTotal);
    const grandTotal = Math.round((subtotal + gstTotal - safeDiscount) * 100) / 100;

    // 4. Check Credit policy & limit if paymentMode === Credit
    let creditDueDate = null;
    if (paymentMode === "Credit") {
      const currentOutstanding = Number(customer.outstandingAmount) || 0;
      const creditLimit = Number(customer.creditLimit) || 0;

      if (
        creditLimit > 0 &&
        currentOutstanding + grandTotal > creditLimit &&
        req.company.settings?.creditPolicy?.allowOverLimit === false
      ) {
        return res.status(400).json({
          message: `Order exceeds customer's credit limit of ₹${creditLimit}. Current outstanding is ₹${currentOutstanding}.`,
        });
      }

      const creditDays = Number(customer.creditDays) || 30;
      creditDueDate = new Date(Date.now() + creditDays * 86400000);
    }

    // 5. Generate unique order number
    const orderNo = await generateOrderNumber(companyId);

    // 6. Create Order document
    const paymentStatus = paymentMode === "Credit" ? "credit" : "paid";

    const order = await Order.create({
      companyId,
      customerId: customer._id,
      customerName: customer.shopName,
      phone: customer.phone,
      items: orderItems,
      total: Math.round(subtotal * 100) / 100,
      gstTotal: Math.round(gstTotal * 100) / 100,
      grandTotal,
      discount: safeDiscount,
      paymentMode,
      paymentStatus,
      status: "new",
      orderNo,
      creditDueDate,
    });

    // 7. If Credit: Create Ledger debit and increase Customer outstandingAmount
    if (paymentMode === "Credit") {
      customer.outstandingAmount =
        (Number(customer.outstandingAmount) || 0) + grandTotal;
      await customer.save();

      await Ledger.create({
        companyId,
        customerId: customer._id,
        type: "debit",
        amount: grandTotal,
        orderId: order._id,
        paymentMode: "Credit",
        description: `Order ${orderNo}`,
      });
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      message: error.message || "Failed to create order.",
    });
  }
});

// @desc    Get order list with optional filters
// @route   GET /api/orders/list
// @access  Public / Private
router.get("/list", optionalAuth, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }

    const filter = { companyId };

    if (req.query.customerId) {
      filter.customerId = req.query.customerId;
    }

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("customerId", "shopName phone creditDays creditLimit");

    res.json({
      success: true,
      orders,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch orders.",
    });
  }
});

// @desc    Get dashboard order statistics
// @route   GET /api/orders/stats
// @access  Public / Private
router.get("/stats", optionalAuth, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }

    // 1. Orders
    const allOrders = await Order.find({ companyId }).sort({ createdAt: -1 });
    const nonCancelledOrders = allOrders.filter((o) => o.status !== "cancelled");

    const totalOrders = nonCancelledOrders.length;
    const revenue = nonCancelledOrders.reduce(
      (sum, o) => sum + Number(o.grandTotal || 0),
      0
    );

    const pendingCredit = nonCancelledOrders
      .filter((o) => o.paymentStatus === "credit" || o.paymentStatus === "pending")
      .reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);

    // Today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrdersDocs = allOrders.filter(
      (o) => new Date(o.createdAt) >= today
    );
    const todayOrdersCount = todayOrdersDocs.length;

    const todayOrdersList = todayOrdersDocs.slice(0, 10).map((o) => ({
      id: o._id,
      _id: o._id,
      orderNo: o.orderNo,
      customerName: o.customerName,
      phone: o.phone,
      grandTotal: o.grandTotal,
      paymentMode: o.paymentMode,
      status: o.status,
      createdAt: o.createdAt,
    }));

    // 2. Customers & Outstanding
    const allCustomers = await Customer.find({ companyId });
    const totalCustomers = allCustomers.length;

    const outstandingTotal = allCustomers.reduce(
      (sum, c) => sum + Number(c.outstandingAmount || 0),
      0
    );

    // Customers with outstanding
    const outstandingCustomers = allCustomers
      .filter((c) => Number(c.outstandingAmount) > 0)
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
      .map((c) => ({
        id: c._id,
        _id: c._id,
        shopName: c.shopName,
        phone: c.phone,
        creditDays: c.creditDays,
        outstandingAmount: c.outstandingAmount,
      }));

    // Credit Overdue calculation: orders that are on Credit, unpaid, and creditDueDate < now
    const now = new Date();
    const overdueOrders = nonCancelledOrders.filter(
      (o) =>
        o.paymentStatus === "credit" &&
        o.creditDueDate &&
        new Date(o.creditDueDate) < now
    );

    const creditOverdue = overdueOrders.reduce(
      (sum, o) => sum + Number(o.grandTotal || 0),
      0
    );

    const overdueCustomerMap = {};
    for (const o of overdueOrders) {
      const cid = String(o.customerId);
      if (!overdueCustomerMap[cid]) {
        overdueCustomerMap[cid] = {
          id: o.customerId,
          _id: o.customerId,
          shopName: o.customerName,
          phone: o.phone,
          outstandingAmount: 0,
        };
      }
      overdueCustomerMap[cid].outstandingAmount += o.grandTotal;
    }
    const creditOverdueCustomers = Object.values(overdueCustomerMap);

    // 3. Products & Low stock
    const allProducts = await Product.find({ companyId, status: "active" });
    const totalProducts = allProducts.length;

    const lowStockProducts = allProducts
      .filter((p) => Number(p.stock) <= Number(p.minStock))
      .map((p) => ({
        id: p._id,
        _id: p._id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
      }));

    const lowStockCount = lowStockProducts.length;

    res.json({
      success: true,
      totalOrders,
      totalProducts,
      totalCustomers,
      todayOrders: todayOrdersCount,
      revenue,
      pendingCredit,
      outstandingTotal,
      creditOverdue,
      lowStock: lowStockProducts, // provides array for frontend tables
      lowStockCount,
      creditOverdueCustomers,
      outstandingCustomers,
      todayOrdersList,
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch order statistics.",
    });
  }
});

// @desc    Update order status
// @route   POST /api/orders/status
// @access  Private
router.post("/status", protect, async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        message: "Order ID and new status are required.",
      });
    }

    const allowedStatuses = [
      "new",
      "packed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const order = await Order.findOne({
      _id: orderId,
      companyId: req.companyId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const previousStatus = order.status;

    // Handle cancellation: return stock, create Stock IN, reverse ledger debit if credit
    if (status === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.qty },
        });

        await Stock.create({
          companyId: req.companyId,
          productId: item.productId,
          type: "in",
          qty: item.qty,
          reason: "return",
        });
      }

      if (order.paymentMode === "Credit" && order.paymentStatus === "credit") {
        await Customer.findByIdAndUpdate(order.customerId, {
          $inc: { outstandingAmount: -order.grandTotal },
        });

        await Ledger.create({
          companyId: req.companyId,
          customerId: order.customerId,
          type: "credit",
          amount: order.grandTotal,
          orderId: order._id,
          paymentMode: "Cancellation Reversal",
          description: `Cancelled Order ${order.orderNo}`,
        });

        order.paymentStatus = "pending";
      }
    }

    if (status === "delivered" && order.paymentMode !== "Credit") {
      order.paymentStatus = "paid";
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      message: error.message || "Failed to update order status.",
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public / Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      companyId: req.companyId,
    }).populate(
      "customerId",
      "shopName phone ownerName address gstNo creditDays"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch order.",
    });
  }
});

module.exports = router;

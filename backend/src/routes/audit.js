const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Ledger = require("../models/Ledger");
const Stock = require("../models/Stock");
const { protect, optionalAuth } = require("../middleware/auth");

// @desc    Export Audit Excel Workbook with 6 sheets
// @route   GET /api/audit/export
// @access  Public / Private
router.get("/export", optionalAuth, async (req, res) => {
  try {
    const companyId = req.query.companyId || req.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }

    const year = req.query.year
      ? parseInt(req.query.year, 10)
      : new Date().getFullYear();

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const dateFilter = {
      companyId,
      createdAt: { $gte: startOfYear, $lte: endOfYear },
    };

    // 1. Fetch data
    const [products, orders, customers, ledgerEntries, stockLogs] =
      await Promise.all([
        Product.find({ companyId }).sort({ name: 1 }),
        Order.find(dateFilter).sort({ createdAt: -1 }),
        Customer.find({ companyId }).sort({ shopName: 1 }),
        Ledger.find(dateFilter).populate("customerId", "shopName").sort({ createdAt: -1 }),
        Stock.find(dateFilter).populate("productId", "name sku").sort({ createdAt: -1 }),
      ]);

    // 2. Build Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Wholesaler OS";
    workbook.lastModifiedBy = "Wholesaler OS";
    workbook.created = new Date();

    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E1E1E" },
      },
      alignment: { horizontal: "center" },
    };

    // Sheet 1: Products
    const sheetProducts = workbook.addWorksheet("Products");
    sheetProducts.columns = [
      { header: "SKU", key: "sku", width: 18 },
      { header: "Product Name", key: "name", width: 30 },
      { header: "Category", key: "category", width: 16 },
      { header: "MRP (₹)", key: "mrp", width: 12 },
      { header: "Wholesale Price (₹)", key: "wholesalePrice", width: 18 },
      { header: "Retail Price (₹)", key: "retailPrice", width: 16 },
      { header: "GST %", key: "gstPercent", width: 10 },
      { header: "Current Stock", key: "stock", width: 14 },
      { header: "Min Stock Alert", key: "minStock", width: 15 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Status", key: "status", width: 12 },
    ];
    sheetProducts.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    products.forEach((p) => {
      sheetProducts.addRow({
        sku: p.sku,
        name: p.name,
        category: p.category,
        mrp: p.mrp,
        wholesalePrice: p.wholesalePrice,
        retailPrice: p.retailPrice,
        gstPercent: p.gstPercent,
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        status: p.status,
      });
    });

    // Sheet 2: Orders
    const sheetOrders = workbook.addWorksheet("Orders");
    sheetOrders.columns = [
      { header: "Order No", key: "orderNo", width: 18 },
      { header: "Date", key: "date", width: 16 },
      { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Items Count", key: "itemCount", width: 12 },
      { header: "Subtotal (₹)", key: "total", width: 14 },
      { header: "GST Total (₹)", key: "gstTotal", width: 14 },
      { header: "Discount (₹)", key: "discount", width: 14 },
      { header: "Grand Total (₹)", key: "grandTotal", width: 16 },
      { header: "Payment Mode", key: "paymentMode", width: 14 },
      { header: "Payment Status", key: "paymentStatus", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ];
    sheetOrders.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    orders.forEach((o) => {
      sheetOrders.addRow({
        orderNo: o.orderNo,
        date: new Date(o.createdAt).toLocaleDateString("en-IN"),
        customerName: o.customerName,
        phone: o.phone,
        itemCount: o.items ? o.items.length : 0,
        total: o.total,
        gstTotal: o.gstTotal,
        discount: o.discount,
        grandTotal: o.grandTotal,
        paymentMode: o.paymentMode,
        paymentStatus: o.paymentStatus,
        status: o.status,
      });
    });

    // Sheet 3: Customers
    const sheetCustomers = workbook.addWorksheet("Customers");
    sheetCustomers.columns = [
      { header: "Shop Name", key: "shopName", width: 25 },
      { header: "Owner Name", key: "ownerName", width: 20 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Email", key: "email", width: 24 },
      { header: "GST No", key: "gstNo", width: 18 },
      { header: "Credit Limit (₹)", key: "creditLimit", width: 16 },
      { header: "Credit Days", key: "creditDays", width: 14 },
      { header: "Outstanding Amount (₹)", key: "outstandingAmount", width: 22 },
      { header: "Status", key: "status", width: 12 },
    ];
    sheetCustomers.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    customers.forEach((c) => {
      sheetCustomers.addRow({
        shopName: c.shopName,
        ownerName: c.ownerName,
        phone: c.phone,
        email: c.email,
        gstNo: c.gstNo,
        creditLimit: c.creditLimit,
        creditDays: c.creditDays,
        outstandingAmount: c.outstandingAmount,
        status: c.status,
      });
    });

    // Sheet 4: Ledger
    const sheetLedger = workbook.addWorksheet("Ledger");
    sheetLedger.columns = [
      { header: "Date", key: "date", width: 16 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Type", key: "type", width: 12 },
      { header: "Amount (₹)", key: "amount", width: 14 },
      { header: "Payment Mode", key: "paymentMode", width: 16 },
      { header: "Description", key: "description", width: 30 },
    ];
    sheetLedger.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    ledgerEntries.forEach((l) => {
      sheetLedger.addRow({
        date: new Date(l.createdAt).toLocaleDateString("en-IN"),
        customer: l.customerId?.shopName || "Customer",
        type: l.type.toUpperCase(),
        amount: l.amount,
        paymentMode: l.paymentMode,
        description: l.description,
      });
    });

    // Sheet 5: Stock Logs
    const sheetStock = workbook.addWorksheet("Stock");
    sheetStock.columns = [
      { header: "Date", key: "date", width: 16 },
      { header: "Product", key: "product", width: 25 },
      { header: "SKU", key: "sku", width: 18 },
      { header: "Movement Type", key: "type", width: 15 },
      { header: "Quantity", key: "qty", width: 12 },
      { header: "Reason", key: "reason", width: 16 },
    ];
    sheetStock.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    stockLogs.forEach((s) => {
      sheetStock.addRow({
        date: new Date(s.createdAt).toLocaleDateString("en-IN"),
        product: s.productId?.name || "Product",
        sku: s.productId?.sku || "—",
        type: s.type.toUpperCase(),
        qty: s.qty,
        reason: s.reason,
      });
    });

    // Sheet 6: Outstanding Summary
    const sheetOutstanding = workbook.addWorksheet("Outstanding");
    sheetOutstanding.columns = [
      { header: "Shop Name", key: "shopName", width: 25 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Credit Limit (₹)", key: "creditLimit", width: 16 },
      { header: "Credit Days", key: "creditDays", width: 14 },
      { header: "Outstanding Balance (₹)", key: "outstandingAmount", width: 24 },
    ];
    sheetOutstanding.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    customers
      .filter((c) => Number(c.outstandingAmount) > 0)
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
      .forEach((c) => {
        sheetOutstanding.addRow({
          shopName: c.shopName,
          phone: c.phone,
          creditLimit: c.creditLimit,
          creditDays: c.creditDays,
          outstandingAmount: c.outstandingAmount,
        });
      });

    // 3. Send Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Wholesaler_OS_Audit_${year}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Audit export error:", error);
    res.status(500).json({
      message: error.message || "Failed to generate Excel audit report.",
    });
  }
});

module.exports = router;

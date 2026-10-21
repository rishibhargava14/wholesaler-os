const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    gstPercent: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "Order must have at least one item"],
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    gstTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    paymentMode: {
      type: String,
      enum: ["UPI", "Cash", "Credit"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "credit"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["new", "packed", "shipped", "delivered", "cancelled"],
      default: "new",
    },
    orderNo: {
      type: String,
      required: true,
      index: true,
    },
    creditDueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ companyId: 1, orderNo: 1 }, { unique: true });

module.exports = mongoose.model("Order", orderSchema);

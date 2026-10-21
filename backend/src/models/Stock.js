const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      enum: ["purchase", "sale", "return", "adjustment", "tally"],
      default: "purchase",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Stock", stockSchema);

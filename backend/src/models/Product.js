const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    mrp: {
      type: Number,
      default: 0,
    },
    wholesalePrice: {
      type: Number,
      required: [true, "Wholesale price is required"],
      default: 0,
    },
    retailPrice: {
      type: Number,
      required: [true, "Retail price is required"],
      default: 0,
    },
    gstPercent: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    minStock: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    unit: {
      type: String,
      default: "pcs",
    },
    tallyItemId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ companyId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);

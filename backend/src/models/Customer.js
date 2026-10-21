const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    gstNo: {
      type: String,
      trim: true,
      default: "",
    },
    priceListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PriceList",
      default: null,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    creditDays: {
      type: Number,
      default: 0,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
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

customerSchema.index({ companyId: 1, phone: 1 });

module.exports = mongoose.model("Customer", customerSchema);

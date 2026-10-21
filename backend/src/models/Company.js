const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    subdomain: {
      type: String,
      required: [true, "Subdomain is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: [true, "Owner email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    gstNo: {
      type: String,
      trim: true,
      default: "",
    },
    wholesaleType: {
      type: String,
      default: "General Wholesale",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    settings: {
      language: {
        type: String,
        enum: ["English", "Hindi", "Marathi"],
        default: "English",
      },
      gstNo: { type: String, default: "" },
      upiId: { type: String, default: "" },
      whatsappToken: { type: String, default: "" },
      razorpayKey: { type: String, default: "" },
      tallySync: { type: Boolean, default: false },
      creditPolicy: {
        enabled: { type: Boolean, default: true },
        defaultCreditDays: { type: Number, default: 30 },
        warningDaysBeforeDue: { type: Number, default: 3 },
        allowOverLimit: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
  }
);

companySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model("Company", companySchema);

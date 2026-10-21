const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");
const { protect } = require("../middleware/auth");

const generateToken = (id) => {
  return jwt.sign(
    { id, companyId: id },
    process.env.JWT_SECRET || "wholesaler_os_super_secret_jwt_key_2026",
    { expiresIn: "30d" }
  );
};

// @desc    Register a new company
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, subdomain, ownerEmail, password, gstNo, wholesaleType } =
      req.body;

    if (!name || !subdomain || !ownerEmail || !password) {
      return res.status(400).json({
        message: "Please provide company name, subdomain, email, and password.",
      });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim();
    const cleanEmail = ownerEmail.toLowerCase().trim();

    const companyExists = await Company.findOne({
      $or: [{ subdomain: cleanSubdomain }, { ownerEmail: cleanEmail }],
    });

    if (companyExists) {
      if (companyExists.subdomain === cleanSubdomain) {
        return res.status(400).json({
          message: "Subdomain is already taken. Please choose another one.",
        });
      }
      return res.status(400).json({
        message: "An account with this email already exists.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const company = await Company.create({
      name: name.trim(),
      subdomain: cleanSubdomain,
      ownerEmail: cleanEmail,
      passwordHash,
      gstNo: gstNo ? gstNo.trim() : "",
      wholesaleType: wholesaleType || "General Wholesale",
    });

    const token = generateToken(company._id);

    const companyData = {
      _id: company._id,
      id: company._id,
      name: company.name,
      subdomain: company.subdomain,
      ownerEmail: company.ownerEmail,
      gstNo: company.gstNo,
      wholesaleType: company.wholesaleType,
      settings: company.settings,
    };

    res.status(201).json({
      success: true,
      token,
      accessToken: token,
      company: companyData,
      user: {
        id: company._id,
        name: company.name,
        email: company.ownerEmail,
        role: "owner",
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message || "Server error during registration." });
  }
});

// @desc    Login company owner
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide both email and password." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const company = await Company.findOne({ ownerEmail: cleanEmail });

    if (!company) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await company.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(company._id);

    const companyData = {
      _id: company._id,
      id: company._id,
      name: company.name,
      subdomain: company.subdomain,
      ownerEmail: company.ownerEmail,
      gstNo: company.gstNo,
      wholesaleType: company.wholesaleType,
      settings: company.settings,
    };

    res.json({
      success: true,
      token,
      accessToken: token,
      company: companyData,
      user: {
        id: company._id,
        name: company.name,
        email: company.ownerEmail,
        role: "owner",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message || "Server error during login." });
  }
});

// @desc    Get current logged in company
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  res.json({
    success: true,
    company: req.company,
    user: {
      id: req.company._id,
      name: req.company.name,
      email: req.company.ownerEmail,
      role: "owner",
    },
  });
});

// @desc    Update settings
// @route   PUT /api/auth/settings
// @access  Private
router.put("/settings", protect, async (req, res) => {
  try {
    const company = req.company;
    const settings = req.body;

    company.settings = {
      ...company.settings.toObject(),
      ...settings,
      creditPolicy: {
        ...company.settings.creditPolicy,
        ...(settings.creditPolicy || {}),
      },
    };

    if (settings.gstNo !== undefined) {
      company.gstNo = settings.gstNo;
    }

    await company.save();

    res.json({
      success: true,
      settings: company.settings,
      company,
    });
  } catch (error) {
    console.error("Settings error:", error);
    res.status(500).json({ message: error.message || "Failed to update settings." });
  }
});

module.exports = router;

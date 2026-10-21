const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Company = require("../models/Company");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const PriceList = require("../models/PriceList");
const Order = require("../models/Order");
const Stock = require("../models/Stock");
const Ledger = require("../models/Ledger");

async function seedData() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/wholesaler_os"
    );
    console.log("Connected to MongoDB for seeding...");

    // Clean existing data
    await Company.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await PriceList.deleteMany({});
    await Order.deleteMany({});
    await Stock.deleteMany({});
    await Ledger.deleteMany({});

    console.log("Cleared existing data.");

    // 1. Create Demo Company
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const company = await Company.create({
      name: "Demo Wholesale Mart",
      subdomain: "demo",
      ownerEmail: "owner@demo.com",
      passwordHash,
      gstNo: "27AABCU9603R1ZM",
      wholesaleType: "FMCG & Groceries",
      phone: "+91 98765 43210",
      address: "APMC Market 1, Vashi, Navi Mumbai",
      settings: {
        language: "English",
        gstNo: "27AABCU9603R1ZM",
        upiId: "wholesaler@upi",
        creditPolicy: {
          enabled: true,
          defaultCreditDays: 30,
          warningDaysBeforeDue: 3,
          allowOverLimit: false,
        },
      },
    });

    console.log(`Created Company: ${company.name} (${company.ownerEmail})`);

    // 2. Create Products
    const productsData = [
      {
        name: "Premium Basmati Rice 25kg",
        sku: "RICE-25-BAS",
        category: "Rice",
        mrp: 2200,
        wholesalePrice: 1850,
        retailPrice: 2050,
        gstPercent: 5,
        stock: 8,
        minStock: 20,
        unit: "bag",
        status: "active",
      },
      {
        name: "Sunflower Oil 5L",
        sku: "OIL-5-SUN",
        category: "Edible Oil",
        mrp: 850,
        wholesalePrice: 720,
        retailPrice: 790,
        gstPercent: 5,
        stock: 6,
        minStock: 15,
        unit: "pcs",
        status: "active",
      },
      {
        name: "Sugar 50kg",
        sku: "SUG-50",
        category: "Grocery",
        mrp: 2800,
        wholesalePrice: 2450,
        retailPrice: 2650,
        gstPercent: 5,
        stock: 4,
        minStock: 10,
        unit: "bag",
        status: "active",
      },
      {
        name: "Wheat Flour 10kg",
        sku: "FLOUR-10",
        category: "Flour",
        mrp: 600,
        wholesalePrice: 520,
        retailPrice: 570,
        gstPercent: 0,
        stock: 7,
        minStock: 12,
        unit: "bag",
        status: "active",
      },
      {
        name: "Toor Dal 1kg",
        sku: "DAL-TOOR-1",
        category: "Pulses",
        mrp: 180,
        wholesalePrice: 145,
        retailPrice: 165,
        gstPercent: 0,
        stock: 85,
        minStock: 20,
        unit: "kg",
        status: "active",
      },
      {
        name: "Premium Tea 500g",
        sku: "TEA-500",
        category: "Beverages",
        mrp: 260,
        wholesalePrice: 210,
        retailPrice: 240,
        gstPercent: 5,
        stock: 42,
        minStock: 15,
        unit: "pcs",
        status: "active",
      },
      {
        name: "Tata Salt 1kg",
        sku: "SALT-1-TATA",
        category: "Grocery",
        mrp: 28,
        wholesalePrice: 23,
        retailPrice: 26,
        gstPercent: 0,
        stock: 120,
        minStock: 30,
        unit: "pcs",
        status: "active",
      },
    ];

    const products = [];
    for (const p of productsData) {
      const prod = await Product.create({
        companyId: company._id,
        ...p,
      });
      products.push(prod);

      // Initial stock log
      await Stock.create({
        companyId: company._id,
        productId: prod._id,
        type: "in",
        qty: prod.stock + 10,
        reason: "purchase",
      });
    }

    console.log(`Created ${products.length} Products.`);

    // 3. Create Price Lists
    const vipPriceList = await PriceList.create({
      companyId: company._id,
      name: "VIP Wholesale",
      discountPercent: 5,
      products: [
        {
          productId: products[0]._id,
          customPrice: 1800,
        },
        {
          productId: products[1]._id,
          customPrice: 700,
        },
      ],
    });

    const retailPriceList = await PriceList.create({
      companyId: company._id,
      name: "Retail",
      discountPercent: 0,
      products: [],
    });

    console.log("Created Price Lists: VIP Wholesale, Retail.");

    // 4. Create Customers
    const customersData = [
      {
        shopName: "Sharma Traders",
        ownerName: "Ramesh Sharma",
        phone: "9876543210",
        email: "sharma@traders.com",
        address: "Shop 12, Main Bazar, Pune",
        gstNo: "27AABCS1234F1Z1",
        priceListId: vipPriceList._id,
        creditLimit: 50000,
        creditDays: 30,
        outstandingAmount: 16050,
      },
      {
        shopName: "Gupta General Store",
        ownerName: "Sunil Gupta",
        phone: "9812345678",
        email: "gupta@store.com",
        address: "MG Road, Nashik",
        gstNo: "27AABCG5678M1Z2",
        priceListId: retailPriceList._id,
        creditLimit: 30000,
        creditDays: 15,
        outstandingAmount: 18200,
      },
      {
        shopName: "Sai Super Market",
        ownerName: "Anand Patil",
        phone: "9898989898",
        email: "sai@supermarket.com",
        address: "Station Road, Thane",
        gstNo: "27AABCP9012K1Z3",
        priceListId: vipPriceList._id,
        creditLimit: 40000,
        creditDays: 30,
        outstandingAmount: 1735,
      },
      {
        shopName: "Patel Wholesale",
        ownerName: "Kishore Patel",
        phone: "9823456789",
        email: "patel@wholesale.com",
        address: "Market Yard, Kolhapur",
        gstNo: "27AABCQ3456T1Z4",
        priceListId: vipPriceList._id,
        creditLimit: 60000,
        creditDays: 15,
        outstandingAmount: 24600,
      },
      {
        shopName: "New India Stores",
        ownerName: "Vijay More",
        phone: "9834567890",
        email: "newindia@stores.com",
        address: "Bypass Road, Solapur",
        gstNo: "27AABCM7890N1Z5",
        priceListId: retailPriceList._id,
        creditLimit: 25000,
        creditDays: 30,
        outstandingAmount: 7000,
      },
      {
        shopName: "Mahalaxmi Mart",
        ownerName: "Prakash Jadhav",
        phone: "9845678901",
        email: "mahalaxmi@mart.com",
        address: "Gandhi Chowk, Satara",
        gstNo: "27AABCJ1234B1Z6",
        priceListId: retailPriceList._id,
        creditLimit: 20000,
        creditDays: 15,
        outstandingAmount: 12300,
      },
    ];

    const customers = [];
    for (const c of customersData) {
      const cust = await Customer.create({
        companyId: company._id,
        ...c,
      });
      customers.push(cust);

      // Create Ledger debit for initial outstanding
      if (cust.outstandingAmount > 0) {
        await Ledger.create({
          companyId: company._id,
          customerId: cust._id,
          type: "debit",
          amount: cust.outstandingAmount,
          paymentMode: "Credit",
          description: "Opening Outstanding Balance",
        });
      }
    }

    console.log(`Created ${customers.length} Customers with ledger entries.`);

    // 5. Create Orders
    const currentYear = new Date().getFullYear();
    const ordersData = [
      {
        customer: customers[0], // Sharma Traders
        items: [
          {
            productId: products[0]._id,
            title: products[0].name,
            qty: 5,
            price: 1800,
            gstPercent: 5,
          },
          {
            productId: products[4]._id,
            title: products[4].name,
            qty: 20,
            price: 145,
            gstPercent: 0,
          },
        ],
        total: 11900,
        gstTotal: 450,
        grandTotal: 12350,
        discount: 0,
        paymentMode: "Credit",
        paymentStatus: "credit",
        status: "new",
        orderNo: `ORD-${currentYear}-0001`,
        creditDueDate: new Date(Date.now() + 30 * 86400000),
      },
      {
        customer: customers[1], // Gupta General Store
        items: [
          {
            productId: products[1]._id,
            title: products[1].name,
            qty: 10,
            price: 720,
            gstPercent: 5,
          },
          {
            productId: products[3]._id,
            title: products[3].name,
            qty: 2,
            price: 520,
            gstPercent: 0,
          },
        ],
        total: 8240,
        gstTotal: 360,
        grandTotal: 8600,
        discount: 0,
        paymentMode: "UPI",
        paymentStatus: "paid",
        status: "packed",
        orderNo: `ORD-${currentYear}-0002`,
        creditDueDate: null,
      },
      {
        customer: customers[3], // Patel Wholesale
        items: [
          {
            productId: products[2]._id,
            title: products[2].name,
            qty: 6,
            price: 2450,
            gstPercent: 5,
          },
        ],
        total: 14700,
        gstTotal: 735,
        grandTotal: 15435,
        discount: 0,
        paymentMode: "Cash",
        paymentStatus: "paid",
        status: "delivered",
        orderNo: `ORD-${currentYear}-0003`,
        creditDueDate: null,
      },
      {
        customer: customers[2], // Sai Super Market
        items: [
          {
            productId: products[5]._id,
            title: products[5].name,
            qty: 30,
            price: 210,
            gstPercent: 5,
          },
          {
            productId: products[6]._id,
            title: products[6].name,
            qty: 50,
            price: 23,
            gstPercent: 0,
          },
        ],
        total: 7450,
        gstTotal: 315,
        grandTotal: 7765,
        discount: 0,
        paymentMode: "Credit",
        paymentStatus: "credit",
        status: "shipped",
        orderNo: `ORD-${currentYear}-0004`,
        creditDueDate: new Date(Date.now() - 5 * 86400000), // Overdue by 5 days
      },
      {
        customer: customers[4], // New India Stores
        items: [
          {
            productId: products[3]._id,
            title: products[3].name,
            qty: 10,
            price: 520,
            gstPercent: 0,
          },
          {
            productId: products[6]._id,
            title: products[6].name,
            qty: 40,
            price: 23,
            gstPercent: 0,
          },
        ],
        total: 6120,
        gstTotal: 0,
        grandTotal: 6120,
        discount: 0,
        paymentMode: "Credit",
        paymentStatus: "credit",
        status: "new",
        orderNo: `ORD-${currentYear}-0005`,
        creditDueDate: new Date(Date.now() + 30 * 86400000),
      },
      {
        customer: customers[5], // Mahalaxmi Mart
        items: [
          {
            productId: products[0]._id,
            title: products[0].name,
            qty: 2,
            price: 1850,
            gstPercent: 5,
          },
          {
            productId: products[5]._id,
            title: products[5].name,
            qty: 10,
            price: 210,
            gstPercent: 5,
          },
        ],
        total: 5800,
        gstTotal: 290,
        grandTotal: 6090,
        discount: 0,
        paymentMode: "Cash",
        paymentStatus: "paid",
        status: "delivered",
        orderNo: `ORD-${currentYear}-0006`,
        creditDueDate: null,
      },
    ];

    for (const od of ordersData) {
      const order = await Order.create({
        companyId: company._id,
        customerId: od.customer._id,
        customerName: od.customer.shopName,
        phone: od.customer.phone,
        items: od.items,
        total: od.total,
        gstTotal: od.gstTotal,
        grandTotal: od.grandTotal,
        discount: od.discount,
        paymentMode: od.paymentMode,
        paymentStatus: od.paymentStatus,
        status: od.status,
        orderNo: od.orderNo,
        creditDueDate: od.creditDueDate,
      });

      // If credit, create ledger entry
      if (od.paymentMode === "Credit") {
        await Ledger.create({
          companyId: company._id,
          customerId: od.customer._id,
          type: "debit",
          amount: od.grandTotal,
          orderId: order._id,
          paymentMode: "Credit",
          description: `Order ${od.orderNo}`,
        });
      }
    }

    console.log(`Created ${ordersData.length} Orders.`);

    console.log("\n==========================================");
    console.log("SEEDED SUCCESSFULLY!");
    console.log("Login credentials:");
    console.log("Email: owner@demo.com");
    console.log("Password: password123");
    console.log("Subdomain: demo");
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedData();

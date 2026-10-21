const cron = require("node-cron");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Company = require("../models/Company");

function startCronJobs() {
  // Run daily at 8:00 AM: "0 8 * * *"
  cron.schedule("0 8 * * *", async () => {
    console.log("Running daily 8:00 AM Wholesaler OS Cron jobs...");
    await runDailyAlerts();
  });

  console.log("Daily 8:00 AM Cron task initialized.");
}

async function runDailyAlerts() {
  try {
    const companies = await Company.find();

    for (const company of companies) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );

      // 1. Credit Due Today Orders
      const creditDueTodayOrders = await Order.find({
        companyId: company._id,
        paymentStatus: "credit",
        status: { $ne: "cancelled" },
        creditDueDate: { $gte: startOfDay, $lte: endOfDay },
      });

      if (creditDueTodayOrders.length > 0) {
        console.log(
          `[CRON ALERT] [${company.name}] ${creditDueTodayOrders.length} orders have credit due today.`
        );
      }

      // 2. Low Stock Alert
      const lowStockProducts = await Product.find({
        companyId: company._id,
        status: "active",
        $expr: { $lte: ["$stock", "$minStock"] },
      });

      if (lowStockProducts.length > 0) {
        console.log(
          `[CRON ALERT] [${company.name}] ${lowStockProducts.length} products have fallen below minimum stock.`
        );
      }

      // 3. Credit Overdue > creditDays Alert
      const overdueOrders = await Order.find({
        companyId: company._id,
        paymentStatus: "credit",
        status: { $ne: "cancelled" },
        creditDueDate: { $lt: startOfDay },
      });

      if (overdueOrders.length > 0) {
        console.log(
          `[CRON ALERT] [${company.name}] ${overdueOrders.length} orders are overdue on credit.`
        );
      }
    }
  } catch (error) {
    console.error("Error running daily cron alerts:", error);
  }
}

module.exports = { startCronJobs, runDailyAlerts };

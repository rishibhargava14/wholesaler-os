const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const { startCronJobs } = require("./cron/jobs");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  startCronJobs();

  app.listen(PORT, () => {
    console.log(`Wholesaler OS Backend Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
  });
});

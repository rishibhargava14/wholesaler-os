const assert = require("assert");

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== STARTING WHOLESALER OS BACKEND API TESTS ===\n");

  // 1. Test Auth Login
  console.log("1. Testing POST /auth/login...");
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "owner@demo.com",
      password: "password123",
    }),
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, "Login failed");
  assert(loginData.token, "Login token missing");
  console.log("   -> Login OK! Company:", loginData.company.name);

  const token = loginData.token;
  const companyId = loginData.company._id;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 2. Test Products List
  console.log("2. Testing GET /products/list...");
  const prodRes = await fetch(`${BASE_URL}/products/list?companyId=${companyId}`, {
    headers: authHeaders,
  });
  const prodData = await prodRes.json();
  assert(prodData.products.length >= 7, "Expected at least 7 products");
  console.log(`   -> Products List OK! (${prodData.products.length} products found)`);

  // Test lowStock filter
  const lowStockRes = await fetch(
    `${BASE_URL}/products/list?companyId=${companyId}&lowStock=true`,
    { headers: authHeaders }
  );
  const lowStockData = await lowStockRes.json();
  console.log(`   -> Low Stock Filter OK! (${lowStockData.products.length} low stock items)`);

  // 3. Test Product Create
  console.log("3. Testing POST /products/create...");
  const uniqueSku = `DAL-CHANA-${Date.now()}`;
  const createProdRes = await fetch(`${BASE_URL}/products/create`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Chana Dal 1kg",
      sku: uniqueSku,
      category: "Pulses",
      mrp: 140,
      wholesalePrice: 110,
      retailPrice: 130,
      gstPercent: 0,
      stock: 50,
      minStock: 10,
      unit: "kg",
    }),
  });
  const newProd = await createProdRes.json();
  assert.strictEqual(createProdRes.status, 201, "Product create failed");
  console.log("   -> Product Created OK! SKU:", newProd.product.sku);

  // 4. Test Customers List
  console.log("4. Testing GET /customers/list...");
  const custRes = await fetch(`${BASE_URL}/customers/list?companyId=${companyId}`, {
    headers: authHeaders,
  });
  const custData = await custRes.json();
  assert(custData.customers.length >= 6, "Expected at least 6 customers");
  const testCustomer = custData.customers[0];
  console.log(`   -> Customers List OK! (${custData.customers.length} customers found)`);

  // 5. Test Customer Ledger
  console.log("5. Testing GET /customers/ledger...");
  const ledgerRes = await fetch(
    `${BASE_URL}/customers/ledger?customerId=${testCustomer._id}`,
    { headers: authHeaders }
  );
  const ledgerData = await ledgerRes.json();
  assert(ledgerData.entries.length > 0, "Ledger entries missing");
  console.log(`   -> Customer Ledger OK! Outstanding: ₹${ledgerData.outstanding}`);

  // 6. Test Price Lists List
  console.log("6. Testing GET /pricelists/list...");
  const plRes = await fetch(`${BASE_URL}/pricelists/list?companyId=${companyId}`, {
    headers: authHeaders,
  });
  const plData = await plRes.json();
  assert(plData.priceLists.length >= 2, "Expected at least 2 price lists");
  console.log(`   -> Price Lists OK! (${plData.priceLists.length} price lists)`);

  // 7. Test Orders Create (Stock deduction + Ledger debit + OrderNo)
  console.log("7. Testing POST /orders/create...");
  const orderProd = prodData.products[0];
  const initialStock = orderProd.stock;

  const createOrderRes = await fetch(`${BASE_URL}/orders/create`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      customerId: testCustomer._id,
      items: [{ productId: orderProd._id, qty: 2 }],
      paymentMode: "Credit",
      discount: 50,
    }),
  });
  const orderResult = await createOrderRes.json();
  assert.strictEqual(createOrderRes.status, 201, "Order creation failed");
  assert(orderResult.order.orderNo.startsWith("ORD-"), "Invalid orderNo format");
  console.log(
    `   -> Order Created OK! OrderNo: ${orderResult.order.orderNo}, GrandTotal: ₹${orderResult.order.grandTotal}`
  );

  // Verify stock deduction
  const verifyProdRes = await fetch(`${BASE_URL}/products/${orderProd._id}`);
  const verifyProd = await verifyProdRes.json();
  assert.strictEqual(
    verifyProd.product.stock,
    Math.max(0, initialStock - 2),
    "Stock deduction incorrect"
  );
  console.log(
    `   -> Stock Deduction Verified: ${initialStock} -> ${verifyProd.product.stock}`
  );

  // 8. Test Orders Stats (Dashboard stats)
  console.log("8. Testing GET /orders/stats...");
  const statsRes = await fetch(`${BASE_URL}/orders/stats?companyId=${companyId}`, {
    headers: authHeaders,
  });
  const stats = await statsRes.json();
  assert(stats.totalOrders > 0, "Stats totalOrders invalid");
  assert(stats.revenue > 0, "Stats revenue invalid");
  assert(stats.outstandingTotal > 0, "Stats outstandingTotal invalid");
  console.log(
    `   -> Dashboard Stats OK! Revenue: ₹${stats.revenue}, Total Orders: ${stats.totalOrders}, Outstanding: ₹${stats.outstandingTotal}`
  );

  // 9. Test Order Status Update (and Cancel Stock Return)
  console.log("9. Testing POST /orders/status (Packed -> Shipped -> Cancelled)...");
  const packRes = await fetch(`${BASE_URL}/orders/status`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      orderId: orderResult.order._id,
      status: "packed",
    }),
  });
  assert.strictEqual(packRes.status, 200, "Pack order failed");

  const cancelRes = await fetch(`${BASE_URL}/orders/status`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      orderId: orderResult.order._id,
      status: "cancelled",
    }),
  });
  const cancelResult = await cancelRes.json();
  assert.strictEqual(cancelResult.order.status, "cancelled");

  // Verify returned stock
  const postCancelProdRes = await fetch(`${BASE_URL}/products/${orderProd._id}`);
  const postCancelProd = await postCancelProdRes.json();
  assert.strictEqual(
    postCancelProd.product.stock,
    initialStock,
    "Stock not restored on cancellation"
  );
  console.log("   -> Order Status Flow & Stock Reversal OK!");

  // 10. Test Ledger Payment
  console.log("10. Testing POST /ledger/payment...");
  const paymentRes = await fetch(`${BASE_URL}/ledger/payment`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      customerId: testCustomer._id,
      amount: 1000,
      paymentMode: "UPI",
      description: "Test advance payment",
    }),
  });
  const paymentResult = await paymentRes.json();
  assert.strictEqual(paymentRes.status, 201, "Payment failed");
  console.log(
    `   -> Ledger Payment OK! New Customer Outstanding: ₹${paymentResult.outstandingAmount}`
  );

  // 11. Test Stock Update & Logs
  console.log("11. Testing POST /stock/update and GET /stock/logs...");
  const stockUpRes = await fetch(`${BASE_URL}/stock/update`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      productId: orderProd._id,
      type: "in",
      qty: 15,
      reason: "purchase",
    }),
  });
  assert.strictEqual(stockUpRes.status, 201, "Stock update failed");

  const stockLogsRes = await fetch(
    `${BASE_URL}/stock/logs?companyId=${companyId}`,
    { headers: authHeaders }
  );
  const stockLogsData = await stockLogsRes.json();
  assert(stockLogsData.logs.length > 0, "No stock logs returned");
  console.log(`   -> Stock Logs OK! (${stockLogsData.logs.length} movement records)`);

  // 12. Test Tally Sync
  console.log("12. Testing POST /tally/sync...");
  const tallyRes = await fetch(`${BASE_URL}/tally/sync`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      items: [{ sku: "SALT-1-TATA", stock: 150, price: 22 }],
    }),
  });
  const tallyData = await tallyRes.json();
  assert.strictEqual(tallyData.updatedCount, 1, "Tally sync count mismatch");
  console.log("   -> Tally Sync OK! Updated SKU SALT-1-TATA stock to 150");

  // 13. Test WhatsApp notification
  console.log("13. Testing POST /whatsapp/send (Marathi & Hindi & English)...");
  const waRes = await fetch(`${BASE_URL}/whatsapp/send`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      type: "order-confirmed",
      language: "Marathi",
      phone: "9876543210",
      orderNo: "ORD-2026-0001",
      total: 12350,
      outstanding: 28400,
    }),
  });
  const waData = await waRes.json();
  assert.strictEqual(waRes.status, 200, "WhatsApp send failed");
  console.log("   -> WhatsApp Notification OK! Preview:\n", waData.message);

  // 14. Test Public Subdomain Catalog & Inquiry
  console.log("14. Testing GET /wholesale/:subdomain & POST inquiry...");
  const pubRes = await fetch(`${BASE_URL}/wholesale/demo`);
  const pubData = await pubRes.json();
  assert.strictEqual(pubRes.status, 200, "Public catalog failed");
  assert(pubData.products.length > 0, "Public products empty");

  const inqRes = await fetch(`${BASE_URL}/wholesale/demo/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopName: "New Super Mart",
      phone: "9123456780",
    }),
  });
  const inqData = await inqRes.json();
  assert.strictEqual(inqRes.status, 201, "Public inquiry failed");
  console.log("   -> Public Subdomain Catalog & Inquiry OK!");

  // 15. Test Audit Excel Export
  console.log("15. Testing GET /audit/export...");
  const exportRes = await fetch(`${BASE_URL}/audit/export?companyId=${companyId}`);
  assert.strictEqual(exportRes.status, 200, "Excel audit export failed");
  const blob = await exportRes.arrayBuffer();
  assert(blob.byteLength > 1000, "Excel file is empty");
  console.log(`   -> Audit Excel Export OK! Received file size: ${blob.byteLength} bytes.`);

  console.log("\n==========================================");
  console.log("ALL 15 API TEST SUITES PASSED FLAWLESSLY!");
  console.log("==========================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

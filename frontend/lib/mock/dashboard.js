export async function getMockDashboardStats() {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    totalProducts: 248,
    totalCustomers: 1284,
    todayOrders: 24,
    revenue: 842500,
    outstandingTotal: 218400,
    creditOverdue: 64500,

    lowStock: [
      {
        id: "p1",
        name: "Premium Basmati Rice 25kg",
        sku: "RICE-25-BAS",
        stock: 8,
        minStock: 20,
        unit: "pcs",
      },
      {
        id: "p2",
        name: "Sunflower Oil 5L",
        sku: "OIL-5-SUN",
        stock: 6,
        minStock: 15,
        unit: "pcs",
      },
      {
        id: "p3",
        name: "Sugar 50kg",
        sku: "SUG-50",
        stock: 4,
        minStock: 10,
        unit: "bags",
      },
      {
        id: "p4",
        name: "Wheat Flour 10kg",
        sku: "FLOUR-10",
        stock: 7,
        minStock: 12,
        unit: "bags",
      },
    ],

    creditOverdueCustomers: [
      {
        id: "c1",
        shopName: "Sharma Traders",
        phone: "9876543210",
        outstandingAmount: 28400,
      },
      {
        id: "c2",
        shopName: "Gupta General Store",
        phone: "9812345678",
        outstandingAmount: 18200,
      },
      {
        id: "c3",
        shopName: "Sai Super Market",
        phone: "9898989898",
        outstandingAmount: 9500,
      },
    ],

    outstandingCustomers: [
      {
        id: "c1",
        shopName: "Sharma Traders",
        creditDays: 30,
        outstandingAmount: 28400,
      },
      {
        id: "c4",
        shopName: "Patel Wholesale",
        creditDays: 15,
        outstandingAmount: 24600,
      },
      {
        id: "c5",
        shopName: "New India Stores",
        creditDays: 30,
        outstandingAmount: 18700,
      },
      {
        id: "c6",
        shopName: "Mahalaxmi Mart",
        creditDays: 15,
        outstandingAmount: 12300,
      },
    ],

    todayOrdersList: [
      {
        id: "o1",
        orderNo: "ORD-2026-0041",
        customerName: "Sharma Traders",
        phone: "9876543210",
        grandTotal: 12450,
        paymentMode: "Credit",
        status: "new",
        createdAt: new Date().toISOString(),
      },
      {
        id: "o2",
        orderNo: "ORD-2026-0040",
        customerName: "Gupta General Store",
        phone: "9812345678",
        grandTotal: 8250,
        paymentMode: "UPI",
        status: "packed",
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      },
      {
        id: "o3",
        orderNo: "ORD-2026-0039",
        customerName: "Patel Wholesale",
        phone: "9823456789",
        grandTotal: 18750,
        paymentMode: "Cash",
        status: "delivered",
        createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
      },
      {
        id: "o4",
        orderNo: "ORD-2026-0038",
        customerName: "Sai Super Market",
        phone: "9898989898",
        grandTotal: 9350,
        paymentMode: "Credit",
        status: "shipped",
        createdAt: new Date(Date.now() - 130 * 60000).toISOString(),
      },
    ],
  };
}
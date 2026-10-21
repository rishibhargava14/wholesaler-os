import { api } from "./api";
import { mockApiEnabled } from "../config";
import { mockOrders } from "../mock/orders";

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getOrders({
  companyId,
  customerId,
  status,
} = {}) {
  if (mockApiEnabled()) {
    await delay(400);

    let orders = [...mockOrders];

    if (customerId) {
      orders = orders.filter(
        (order) =>
          String(order.customerId) ===
          String(customerId)
      );
    }

    if (status) {
      orders = orders.filter(
        (order) => order.status === status
      );
    }

    return {
      orders,
    };
  }

  const params = new URLSearchParams();

  if (companyId) {
    params.set("companyId", companyId);
  }

  if (customerId) {
    params.set("customerId", customerId);
  }

  if (status) {
    params.set("status", status);
  }

  const query = params.toString();

  return api(
    `/orders/list${query ? `?${query}` : ""}`,
    {
      method: "GET",
    }
  );
}

export async function getOrderStats(companyId) {
  if (mockApiEnabled()) {
    await delay(300);

    const activeOrders = mockOrders.filter(
      (order) => order.status !== "cancelled"
    );

    const revenue = activeOrders.reduce(
      (sum, order) =>
        sum + Number(order.grandTotal || 0),
      0
    );

    const pendingCredit = activeOrders
      .filter(
        (order) =>
          order.paymentStatus === "pending" ||
          order.paymentStatus === "credit"
      )
      .reduce(
        (sum, order) =>
          sum + Number(order.grandTotal || 0),
        0
      );

    return {
      totalOrders: activeOrders.length,
      revenue,
      pendingCredit,
      lowStock: 3,
      outstandingTotal: 183200,
    };
  }

  const params = new URLSearchParams();

  if (companyId) {
    params.set("companyId", companyId);
  }

  const query = params.toString();

  return api(
    `/orders/stats${query ? `?${query}` : ""}`,
    {
      method: "GET",
    }
  );
}

export async function updateOrderStatus(
  orderId,
  status
) {
  if (mockApiEnabled()) {
    await delay(400);

    const order = mockOrders.find(
      (item) =>
        String(item._id) === String(orderId)
    );

    if (!order) {
      throw new Error("Order not found.");
    }

    const allowedStatuses = [
      "packed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error("Invalid order status.");
    }

    order.status = status;

    if (status === "delivered") {
      if (order.paymentMode !== "Credit") {
        order.paymentStatus = "paid";
      }
    }

    return {
      success: true,
      order,
    };
  }

  return api("/orders/status", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      status,
    }),
  });
}

export async function createOrder({
  customerId,
  items,
  paymentMode,
  discount,
}) {
  if (mockApiEnabled()) {
    await delay(500);

    if (!customerId) {
      throw new Error("Please select a customer.");
    }

    if (!items?.length) {
      throw new Error("Please add at least one product.");
    }

    if (!paymentMode) {
      throw new Error("Please select a payment mode.");
    }

    const orderItems = items.map((item) => ({
      productId: item.productId,
      title: item.title,
      qty: Number(item.qty),
      price: Number(item.price),
      gstPercent: Number(item.gstPercent || 0),
    }));

    const total = orderItems.reduce(
      (sum, item) =>
        sum + item.price * item.qty,
      0
    );

    const gstTotal = orderItems.reduce(
      (sum, item) =>
        sum +
        (item.price *
          item.qty *
          Number(item.gstPercent || 0)) /
          100,
      0
    );

    const safeDiscount = Math.min(
      Number(discount || 0),
      total + gstTotal
    );

    const grandTotal =
      total + gstTotal - safeDiscount;

    const orderNo = `ORD-${new Date().getFullYear()}-${String(
      1000 + mockOrders.length + 1
    ).slice(-4)}`;

    const customer =
      items[0]?.customer || null;

    const order = {
      _id: `mock-order-${Date.now()}`,
      orderNo,
      customerId,
      customerName:
        customer?.shopName ||
        customer?.name ||
        "Customer",
      phone: customer?.phone || "",
      items: orderItems,
      total,
      gstTotal,
      grandTotal,
      discount: safeDiscount,
      paymentMode,
      paymentStatus:
        paymentMode === "Credit"
          ? "credit"
          : "paid",
      status: "new",
      creditDueDate:
        paymentMode === "Credit"
          ? customer?.creditDays
            ? new Date(
                Date.now() +
                  Number(
                    customer.creditDays
                  ) *
                    86400000
              ).toISOString()
            : null
          : null,
      createdAt: new Date().toISOString(),
    };

    mockOrders.unshift(order);

    return {
      success: true,
      order,
    };
  }

  return api("/orders/create", {
    method: "POST",
    body: JSON.stringify({
      customerId,
      items: items.map((item) => ({
        productId: item.productId,
        qty: Number(item.qty),
      })),
      paymentMode,
      discount: Number(discount || 0),
    }),
  });
}
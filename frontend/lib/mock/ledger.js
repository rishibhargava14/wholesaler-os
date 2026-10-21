export const mockLedger = {
  c1: [
    {
      _id: "l1",
      type: "debit",
      amount: 18500,
      orderId: {
        orderNo: "ORD-2026-1001",
      },
      paymentMode: "Credit",
      description: "Order purchase",
      createdAt: "2026-09-18T10:30:00.000Z",
    },
    {
      _id: "l2",
      type: "credit",
      amount: 10000,
      orderId: null,
      paymentMode: "UPI",
      description: "Payment received",
      createdAt: "2026-09-19T12:15:00.000Z",
    },
    {
      _id: "l3",
      type: "debit",
      amount: 8200,
      orderId: {
        orderNo: "ORD-2026-1008",
      },
      paymentMode: "Credit",
      description: "Order purchase",
      createdAt: "2026-09-20T09:20:00.000Z",
    },
  ],

  c2: [
    {
      _id: "l4",
      type: "debit",
      amount: 12500,
      orderId: {
        orderNo: "ORD-2026-1004",
      },
      paymentMode: "Credit",
      description: "Order purchase",
      createdAt: "2026-09-17T11:00:00.000Z",
    },
    {
      _id: "l5",
      type: "credit",
      amount: 5000,
      orderId: null,
      paymentMode: "Cash",
      description: "Payment received",
      createdAt: "2026-09-19T15:40:00.000Z",
    },
  ],
};
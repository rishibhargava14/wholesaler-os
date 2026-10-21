import { api } from "./api";
import { mockApiEnabled } from "../config";
import { mockLedger } from "../mock/ledger";


function delay(ms = 400) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function getArray(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export async function getCustomerLedger(customerId) {
  if (mockApiEnabled()) {
    await delay();

    const entries = mockLedger[customerId] || [];

    const outstanding = entries.reduce(
      (total, entry) => {
        if (entry.type === "debit") {
          return total + Number(entry.amount || 0);
        }

        return total - Number(entry.amount || 0);
      },
      0
    );

    return {
      entries,
      outstanding,
    };
  }

  const query = customerId
    ? `?customerId=${encodeURIComponent(customerId)}`
    : "";

  return api(`/customers/ledger${query}`, {
    method: "GET",
  });
}

export async function addPayment(payload) {
  if (mockApiEnabled()) {
    await delay(500);

    const entry = {
      _id: `mock-payment-${Date.now()}`,
      type: "credit",
      amount: Number(payload.amount),
      orderId: null,
      paymentMode: payload.paymentMode,
      description:
        payload.description || "Payment received",
      createdAt: new Date().toISOString(),
    };

    if (!mockLedger[payload.customerId]) {
      mockLedger[payload.customerId] = [];
    }

    mockLedger[payload.customerId].push(entry);

    return {
      success: true,
      ledger: entry,
    };
  }

  return api("/ledger/payment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function normalizeLedgerResponse(data) {
  const entries = getArray(data, [
    "ledger",
    "entries",
    "transactions",
  ]);

  const outstanding =
    data?.outstanding !== undefined
      ? Number(data.outstanding)
      : entries.reduce(
          (total, entry) => {
            if (entry.type === "debit") {
              return total + Number(entry.amount || 0);
            }

            return total - Number(entry.amount || 0);
          },
          0
        );

  return {
    entries,
    outstanding,
  };
}
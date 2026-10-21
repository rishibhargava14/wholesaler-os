import { api } from "./api";
import { mockApiEnabled } from "../config";
import {
  mockCustomers,
  mockCustomerLedger,
} from "../mock/customers";

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getCustomers({
  companyId,
  priceList,
} = {}) {
  if (mockApiEnabled()) {
    await delay(400);

    let customers = [...mockCustomers];

    if (priceList) {
      customers = customers.filter(
        (customer) =>
          customer.priceListId === priceList ||
          customer.priceListName === priceList
      );
    }

    return {
      customers,
    };
  }

  const params = new URLSearchParams();

  if (companyId) {
    params.set("companyId", companyId);
  }

  if (priceList) {
    params.set("priceList", priceList);
  }

  const query = params.toString();

  return api(
    `/customers/list${query ? `?${query}` : ""}`,
    {
      method: "GET",
    }
  );
}

export async function getCustomer(id, companyId) {
  if (mockApiEnabled()) {
    await delay(300);

    const customer = mockCustomers.find(
      (item) => item._id === id
    );

    if (!customer) {
      throw new Error("Customer not found.");
    }

    return {
      customer,
    };
  }

  return api(`/customers/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function createCustomer(customerData) {
  if (mockApiEnabled()) {
    await delay(500);

    const customer = {
      _id: `mock-customer-${Date.now()}`,
      shopName: customerData.shopName,
      ownerName: customerData.ownerName,
      phone: customerData.phone,
      email: customerData.email,
      address: customerData.address,
      gstNo: customerData.gstNo,
      priceListId: customerData.priceListId,
      priceListName:
        customerData.priceListName || "Retail",
      creditLimit: Number(
        customerData.creditLimit || 0
      ),
      creditDays: Number(
        customerData.creditDays || 0
      ),
      outstandingAmount: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    mockCustomers.unshift(customer);

    mockCustomerLedger[customer._id] = [];

    return {
      success: true,
      customer,
    };
  }

  return api("/customers/create", {
    method: "POST",
    body: JSON.stringify(customerData),
  });
}

export async function updateCustomer(id, customerData) {
  return api(`/customers/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(customerData),
  });
}

export async function getCustomerLedger(customerId) {
  if (mockApiEnabled()) {
    await delay(400);

    const entries =
      mockCustomerLedger[customerId] || [];

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

  return api(
    `/customers/ledger?customerId=${encodeURIComponent(
      customerId
    )}`,
    {
      method: "GET",
    }
  );
}

export async function addCustomerPayment({
  customerId,
  amount,
  paymentMode,
  description,
}) {
  if (mockApiEnabled()) {
    await delay(500);

    const customer = mockCustomers.find(
      (item) => item._id === customerId
    );

    if (!customer) {
      throw new Error("Customer not found.");
    }

    const paymentAmount = Number(amount);

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0
    ) {
      throw new Error(
        "Enter a valid payment amount."
      );
    }

    const entry = {
      _id: `mock-ledger-${Date.now()}`,
      type: "credit",
      amount: paymentAmount,
      orderId: null,
      orderNo: null,
      paymentMode,
      description:
        description || "Payment received",
      createdAt: new Date().toISOString(),
    };

    if (!mockCustomerLedger[customerId]) {
      mockCustomerLedger[customerId] = [];
    }

    mockCustomerLedger[customerId].unshift(entry);

    customer.outstandingAmount = Math.max(
      0,
      Number(customer.outstandingAmount || 0) -
        paymentAmount
    );

    return {
      success: true,
      entry,
      outstandingAmount:
        customer.outstandingAmount,
    };
  }

  return api("/ledger/payment", {
    method: "POST",
    body: JSON.stringify({
      customerId,
      amount: Number(amount),
      paymentMode,
      description,
    }),
  });
}

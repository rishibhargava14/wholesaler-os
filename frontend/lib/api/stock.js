import { api } from "./api";
import { mockApiEnabled } from "../config";
import { mockStockLogs } from "../mock/stock";

function delay(ms = 400) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

export async function getStockLogs(companyId) {
  if (mockApiEnabled()) {
    await delay();

    return [...mockStockLogs];
  }

  const resolvedCompanyId =
    companyId ||
    (typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("company") || "null")?._id
      : null);
  const query = resolvedCompanyId
    ? `?companyId=${encodeURIComponent(resolvedCompanyId)}`
    : "";

  return api(`/stock/logs${query}`, { method: "GET" });
}

export async function updateStock(payload) {
  if (mockApiEnabled()) {
    await delay(500);

    const log = {
      _id: `mock-stock-${Date.now()}`,
      productId: payload.productId,
      type: payload.type,
      qty: Number(payload.qty),
      reason: payload.reason,
      createdAt: new Date().toISOString(),
    };

    mockStockLogs.unshift(log);

    return {
      success: true,
      stock: log,
    };
  }

  return api("/stock/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
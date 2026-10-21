import { api } from "./api";
import { mockApiEnabled } from "../config";
import { getMockDashboardStats } from "../mock/dashboard";

export async function getDashboardStats() {
  if (mockApiEnabled()) {
    return getMockDashboardStats();
  }

  const company =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("company") || "null")
      : null;
  const companyId = company?._id || company?.id;

  const params = companyId
    ? `?companyId=${encodeURIComponent(companyId)}`
    : "";

  return api(`/orders/stats${params}`, {
    method: "GET",
  });
}
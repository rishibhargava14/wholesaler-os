import { api } from "./api";
import { mockApiEnabled } from "../config";
import { mockPriceLists } from "../mock/pricelists";

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getPriceLists(companyId) {
  if (mockApiEnabled()) {
    await delay(300);

    return {
      priceLists: [...mockPriceLists],
    };
  }

  const params = new URLSearchParams();

  if (companyId) {
    params.set("companyId", companyId);
  }

  const query = params.toString();

  return api(
    `/pricelists/list${query ? `?${query}` : ""}`,
    {
      method: "GET",
    }
  );
}

export async function getPriceList(id, companyId) {
  if (!mockApiEnabled()) {
    return api(`/pricelists/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  }

  const data = await getPriceLists(companyId);

  const priceLists = Array.isArray(data)
    ? data
    : Array.isArray(data?.priceLists)
      ? data.priceLists
      : Array.isArray(data?.data)
        ? data.data
        : [];

  const priceList = priceLists.find(
    (item) =>
      String(item?._id || item?.id) ===
      String(id)
  );

  if (!priceList) {
    throw new Error("Price list not found.");
  }

  return priceList;
}

export async function createPriceList(payload) {
  if (mockApiEnabled()) {
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    const priceList = {
      _id: `mock-pl-${Date.now()}`,
      ...payload,
    };

    mockPriceLists.push(priceList);

    return {
      success: true,
      priceList,
    };
  }

  return api("/pricelists/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
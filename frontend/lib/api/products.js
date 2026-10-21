import { api } from "./api";
import { mockApiEnabled } from "../config";
import { mockProducts } from "../mock/products";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  );
}

async function uploadRequest(path, formData, method = "POST") {
  const token = getToken();
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

export async function getProducts({
  companyId,
  lowStock,
  category,
} = {}) {
  if (mockApiEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    let products = [...mockProducts];
    if (category) {
      products = products.filter((product) => product.category === category);
    }
    if (lowStock === true) {
      products = products.filter(
        (product) => product.stock <= product.minStock
      );
    }
    return products;
  }

  const params = new URLSearchParams();
  if (companyId) params.set("companyId", companyId);
  if (lowStock !== undefined) params.set("lowStock", lowStock);
  if (category) params.set("category", category);
  const query = params.toString();
  return api(`/products/list${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export async function createProduct(formData) {
  if (mockApiEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const product = {
      _id: `mock-${Date.now()}`,
      name: formData.get("name"),
      sku: formData.get("sku"),
      category: formData.get("category"),
      mrp: Number(formData.get("mrp") || 0),
      wholesalePrice: Number(formData.get("wholesalePrice") || 0),
      retailPrice: Number(formData.get("retailPrice") || 0),
      gstPercent: Number(formData.get("gstPercent") || 0),
      stock: Number(formData.get("stock") || 0),
      minStock: Number(formData.get("minStock") || 0),
      unit: formData.get("unit") || "pcs",
      tallyItemId: formData.get("tallyItemId") || "",
      status: formData.get("status") || "active",
      images: [],
    };
    mockProducts.push(product);
    return { success: true, product };
  }
  return uploadRequest("/products/create", formData);
}

export async function deleteProduct(id) {
  if (mockApiEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockProducts.findIndex((product) => product._id === id);
    if (index === -1) throw new Error("Product not found.");
    const [product] = mockProducts.splice(index, 1);
    return { success: true, product };
  }
  return api(`/products/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getProduct(id) {
  if (mockApiEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const product = mockProducts.find((item) => item._id === id);
    if (!product) throw new Error("Product not found.");
    return { product };
  }
  return api(`/products/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function updateProduct(id, data) {
  if (mockApiEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = mockProducts.findIndex((item) => item._id === id);
    if (index === -1) throw new Error("Product not found.");
    const updates = data instanceof FormData
      ? Object.fromEntries(data.entries())
      : data;
    mockProducts[index] = { ...mockProducts[index], ...updates };
    return { success: true, product: mockProducts[index] };
  }

  const formData = data instanceof FormData
    ? data
    : Object.entries(data || {}).reduce((result, [key, value]) => {
        if (value !== undefined && value !== null) {
          result.append(key, String(value));
        }
        return result;
      }, new FormData());

  return uploadRequest(
    `/products/${encodeURIComponent(id)}`,
    formData,
    "PUT"
  );
}

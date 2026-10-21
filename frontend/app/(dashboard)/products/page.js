"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Boxes,
  IndianRupee,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";

import { getProducts, deleteProduct } from "@/lib/api/products";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getStockStatus(product) {
  const stock = Number(product.stock ?? product.quantity ?? 0);
  const minStock = Number(product.minStock ?? product.lowStockThreshold ?? 0);

  if (stock <= 0) {
    return {
      label: "Out of stock",
      className: "bg-red-50 text-red-600 border-red-100",
    };
  }

  if (minStock > 0 && stock <= minStock) {
    return {
      label: "Low stock",
      className: "bg-amber-50 text-amber-600 border-amber-100",
    };
  }

  return {
    label: "In stock",
    className: "bg-green-50 text-green-600 border-green-100",
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const [menuOpen, setMenuOpen] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts();

      const list =
        Array.isArray(data)
          ? data
          : data.products || data.data || [];

      setProducts(list);
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category?.name || product.category)
      .filter(Boolean);

    return [...new Set(values)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const productCategory =
        product.category?.name || product.category || "";

      const stock = Number(
        product.stock ?? product.quantity ?? 0
      );

      const minStock = Number(
        product.minStock ?? product.lowStockThreshold ?? 0
      );

      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        productCategory.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" || productCategory === category;

      let matchesStock = true;

      if (stockFilter === "in-stock") {
        matchesStock = stock > minStock || minStock === 0;
      }

      if (stockFilter === "low") {
        matchesStock = stock > 0 && minStock > 0 && stock <= minStock;
      }

      if (stockFilter === "out") {
        matchesStock = stock <= 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, category, stockFilter]);

  const stats = useMemo(() => {
    const totalProducts = products.length;

    const lowStock = products.filter((product) => {
      const stock = Number(
        product.stock ?? product.quantity ?? 0
      );

      const minStock = Number(
        product.minStock ?? product.lowStockThreshold ?? 0
      );

      return stock > 0 && minStock > 0 && stock <= minStock;
    }).length;

    const outOfStock = products.filter((product) => {
      const stock = Number(
        product.stock ?? product.quantity ?? 0
      );

      return stock <= 0;
    }).length;

    const inventoryValue = products.reduce((total, product) => {
      const stock = Number(
        product.stock ?? product.quantity ?? 0
      );

      const price = Number(
        product.purchasePrice ??
          product.costPrice ??
          product.price ??
          0
      );

      return total + stock * price;
    }, 0);

    return {
      totalProducts,
      lowStock,
      outOfStock,
      inventoryValue,
    };
  }, [products]);

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product._id || product.id);

      await deleteProduct(product._id || product.id);

      setProducts((current) =>
        current.filter(
          (item) =>
            (item._id || item.id) !==
            (product._id || product.id)
        )
      );

      setMenuOpen(null);
    } catch (err) {
      alert(err.message || "Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-black">
            Products
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage your wholesale product catalog and stock.
          </p>
        </div>

        <Link
          href="/products/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.totalProducts}
        />

        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={stats.lowStock}
          valueClassName="text-amber-600"
        />

        <StatCard
          icon={Boxes}
          label="Out of Stock"
          value={stats.outOfStock}
          valueClassName="text-red-600"
        />

        <StatCard
          icon={IndianRupee}
          label="Inventory Value"
          value={formatCurrency(stats.inventoryValue)}
        />
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-gray-400"
            >
              <option value="all">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-gray-400"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <button
              type="button"
              onClick={loadProducts}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-black"
              title="Refresh"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Product
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Category
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Price
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Stock
                </th>

                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Package
                        size={18}
                        className="text-gray-400"
                      />
                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      No products found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const id = product._id || product.id;

                  const stock = Number(
                    product.stock ?? product.quantity ?? 0
                  );

                  const minStock = Number(
                    product.minStock ??
                      product.lowStockThreshold ??
                      0
                  );

                  const status = getStockStatus(product);

                  const productCategory =
                    product.category?.name ||
                    product.category ||
                    "Uncategorized";

                  const price = Number(
                    product.sellingPrice ??
                      product.salePrice ??
                      product.price ??
                      0
                  );

                  return (
                    <tr
                      key={id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full rounded-lg object-cover"
                              />
                            ) : (
                              <Package
                                size={17}
                                className="text-gray-400"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {product.name || "Unnamed Product"}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              SKU: {product.sku || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {productCategory}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-gray-800">
                        {formatCurrency(price)}
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {stock}
                          </p>

                          {minStock > 0 && (
                            <p className="text-[11px] text-gray-400">
                              Min: {minStock}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="relative px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpen(
                              menuOpen === id ? null : id
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-black"
                        >
                          <MoreHorizontal size={17} />
                        </button>

                        {menuOpen === id && (
                          <div className="absolute right-5 top-12 z-20 w-36 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-lg">
                            <Link
                              href={`/products/${id}/edit`}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-black"
                              onClick={() => setMenuOpen(null)}
                            >
                              <Pencil size={13} />
                              Edit
                            </Link>

                            <button
                              type="button"
                              disabled={deletingId === id}
                              onClick={() => handleDelete(product)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              {deletingId === id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filteredProducts.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-3">
            <p className="text-xs text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-600">
                {filteredProducts.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-600">
                {products.length}
              </span>{" "}
              products
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueClassName = "text-black",
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
          <Icon size={17} className="text-gray-500" />
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-semibold tracking-tight ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-100" />

          <div className="space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
            <div className="h-2 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="ml-auto h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
      </td>
    </tr>
  );
}
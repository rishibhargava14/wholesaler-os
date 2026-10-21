"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { getProducts } from "@/lib/api/products";
import {
  getStockLogs,
  updateStock,
} from "@/lib/api/stock";
import { getCurrentCompany } from "@/lib/api/auth";

function getId(item) {
  return item?._id || item?.id;
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

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getReasonLabel(reason) {
  const labels = {
    purchase: "Purchase",
    sale: "Sale",
    return: "Return",
  };

  return labels[reason] || reason || "—";
}

function getProductName(product) {
  return product?.name || "Unknown Product";
}

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("all");
  const [reasonFilter, setReasonFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] =
    useState(true);

  const [error, setError] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [stockType, setStockType] =
    useState("in");

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [reason, setReason] =
    useState("purchase");

  const [submitting, setSubmitting] =
    useState(false);

  async function loadProducts() {
    try {
      setLoading(true);

      const company =
        getCurrentCompany();

      const companyId =
        company?._id || company?.id;

      const data = await getProducts({
        companyId,
      });

      setProducts(
        getArray(data, ["products"])
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs() {
    try {
      setLoadingLogs(true);

      const data = await getStockLogs();

      setLogs(getArray(data, ["logs", "stock"]));
    } catch (err) {
      /*
       * In real mode the GET stock-log endpoint
       * isn't documented yet.
       *
       * Keep the page usable instead of breaking
       * the entire stock screen.
       */
      if (
        err?.message?.includes(
          "not documented"
        )
      ) {
        setLogs([]);
      } else {
        setError(
          err?.message ||
            "Unable to load stock logs."
        );
      }
    } finally {
      setLoadingLogs(false);
    }
  }

  async function loadPage() {
    setError("");

    await Promise.all([
      loadProducts(),
      loadLogs(),
    ]);
  }

  useEffect(() => {
    loadPage();
  }, []);

  const productMap = useMemo(() => {
    const map = {};

    products.forEach((product) => {
      map[String(getId(product))] = product;
    });

    return map;
  }, [products]);

  const filteredLogs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return logs.filter((log) => {
      const product =
        productMap[String(log.productId)];

      const productName =
        product?.name?.toLowerCase() || "";

      const sku =
        product?.sku?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        productName.includes(query) ||
        sku.includes(query);

      const matchesType =
        typeFilter === "all" ||
        log.type === typeFilter;

      const matchesReason =
        reasonFilter === "all" ||
        log.reason === reasonFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesReason
      );
    });
  }, [
    logs,
    productMap,
    search,
    typeFilter,
    reasonFilter,
  ]);

  const totalStock = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          sum + Number(product.stock || 0),
        0
      ),
    [products]
  );

  const lowStockCount = useMemo(
    () =>
      products.filter(
        (product) =>
          Number(product.stock || 0) <=
          Number(product.minStock || 0)
      ).length,
    [products]
  );

  const outOfStockCount = useMemo(
    () =>
      products.filter(
        (product) =>
          Number(product.stock || 0) === 0
      ).length,
    [products]
  );

  const stockInCount = useMemo(
    () =>
      logs
        .filter((log) => log.type === "in")
        .reduce(
          (sum, log) =>
            sum + Number(log.qty || 0),
          0
        ),
    [logs]
  );

  const stockOutCount = useMemo(
    () =>
      logs
        .filter((log) => log.type === "out")
        .reduce(
          (sum, log) =>
            sum + Number(log.qty || 0),
          0
        ),
    [logs]
  );

  function openStockModal(type) {
    setStockType(type);
    setSelectedProductId(
      products.length > 0
        ? String(getId(products[0]))
        : ""
    );

    setQuantity("");

    setReason(
      type === "in"
        ? "purchase"
        : "sale"
    );

    setShowModal(true);
  }

  async function handleStockSubmit(event) {
    event.preventDefault();

    setError("");

    const qty = Number(quantity);

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isFinite(qty) ||
      qty <= 0
    ) {
      setError(
        "Please enter a valid quantity."
      );
      return;
    }

    try {
      setSubmitting(true);

      await updateStock({
        productId: selectedProductId,
        type: stockType,
        qty,
        reason,
      });

      setShowModal(false);
      setQuantity("");

      await loadPage();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update stock."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Inventory
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Stock
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor inventory movements and update
            product stock.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              openStockModal("in")
            }
            disabled={products.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDownLeft size={14} />
            Stock In
          </button>

          <button
            type="button"
            onClick={() =>
              openStockModal("out")
            }
            disabled={products.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUpRight size={14} />
            Stock Out
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Total Stock
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <Package size={14} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-black">
            {loading
              ? "—"
              : totalStock.toLocaleString(
                  "en-IN"
                )}
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            Across all products
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Low Stock
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <Clock3 size={14} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-black">
            {loading
              ? "—"
              : lowStockCount}
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            At or below minimum
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Stock In
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <ArrowDownLeft size={14} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-black">
            {stockInCount.toLocaleString(
              "en-IN"
            )}
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            Logged movements
          </p>
        </div>

        <div className="rounded-xl bg-black p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Stock Out
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
              <ArrowUpRight size={14} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight">
            {stockOutCount.toLocaleString(
              "en-IN"
            )}
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            Logged movements
          </p>
        </div>
      </div>

      {/* Current inventory */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-black">
              Current Inventory
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              Current stock levels across your
              products.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center gap-2 self-start rounded-lg border border-gray-200 px-3 text-[10px] font-medium text-gray-500 transition hover:bg-gray-50 hover:text-black disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={12}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-14 text-xs text-gray-400">
              <Loader2
                size={16}
                className="mr-2 animate-spin"
              />
              Loading inventory...
            </div>
          ) : products.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                <Package size={18} />
              </div>

              <p className="mt-4 text-sm font-semibold text-black">
                No products found
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Add products before managing stock.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                    Product
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                    SKU
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                    Current Stock
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                    Min Stock
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const stock =
                    Number(
                      product.stock || 0
                    );

                  const minStock =
                    Number(
                      product.minStock || 0
                    );

                  const outOfStock =
                    stock === 0;

                  const lowStock =
                    stock <= minStock;

                  return (
                    <tr
                      key={getId(product)}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                            <Package
                              size={15}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-black">
                              {product.name}
                            </p>

                            <p className="mt-0.5 text-[10px] text-gray-400">
                              {product.category ||
                                "Uncategorized"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500">
                        {product.sku || "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="text-xs font-semibold text-black">
                          {stock.toLocaleString(
                            "en-IN"
                          )}
                        </span>

                        <span className="ml-1 text-[10px] text-gray-400">
                          {product.unit ||
                            "units"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-xs text-gray-500">
                        {minStock.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${
                            outOfStock
                              ? "bg-red-50 text-red-600"
                              : lowStock
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600"
                          }`}
                        >
                          {outOfStock
                            ? "Out of Stock"
                            : lowStock
                              ? "Low Stock"
                              : "In Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Stock logs */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-black">
              Stock Movement
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              Track stock in and stock out movements.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-[1fr_160px_160px]">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product or SKU..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="h-9 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 pr-8 text-xs text-gray-600 outline-none focus:border-gray-400 focus:bg-white"
            >
              <option value="all">
                All Types
              </option>
              <option value="in">
                Stock In
              </option>
              <option value="out">
                Stock Out
              </option>
            </select>

            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="relative">
            <select
              value={reasonFilter}
              onChange={(event) =>
                setReasonFilter(
                  event.target.value
                )
              }
              className="h-9 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 pr-8 text-xs text-gray-600 outline-none focus:border-gray-400 focus:bg-white"
            >
              <option value="all">
                All Reasons
              </option>
              <option value="purchase">
                Purchase
              </option>
              <option value="sale">
                Sale
              </option>
              <option value="return">
                Return
              </option>
            </select>

            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>

        {loadingLogs ? (
          <div className="flex items-center justify-center py-16 text-xs text-gray-400">
            <Loader2
              size={16}
              className="mr-2 animate-spin"
            />
            Loading stock movements...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Clock3 size={18} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-black">
              No stock movements
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">
              Stock movements will appear here after
              inventory is updated.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Type
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Product
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Quantity
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Reason
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => {
                    const isIn =
                      log.type === "in";

                    const product =
                      productMap[
                        String(log.productId)
                      ];

                    return (
                      <tr
                        key={getId(log)}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
                              isIn
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {isIn ? (
                              <ArrowDownLeft
                                size={11}
                              />
                            ) : (
                              <ArrowUpRight
                                size={11}
                              />
                            )}

                            {isIn
                              ? "Stock In"
                              : "Stock Out"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="text-xs font-medium text-black">
                              {getProductName(
                                product
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] text-gray-400">
                              {product?.sku ||
                                "No SKU"}
                            </p>
                          </div>
                        </td>

                        <td
                          className={`px-5 py-4 text-right text-xs font-semibold ${
                            isIn
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {isIn ? "+" : "-"}
                          {Number(
                            log.qty || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500">
                          {getReasonLabel(
                            log.reason
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-xs text-gray-500">
                          {formatDate(
                            log.createdAt
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredLogs.map((log) => {
                const isIn =
                  log.type === "in";

                const product =
                  productMap[
                    String(log.productId)
                  ];

                return (
                  <div
                    key={getId(log)}
                    className="space-y-4 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            isIn
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {isIn ? (
                            <ArrowDownLeft
                              size={15}
                            />
                          ) : (
                            <ArrowUpRight
                              size={15}
                            />
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-black">
                            {isIn
                              ? "Stock In"
                              : "Stock Out"}
                          </p>

                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {formatDateTime(
                              log.createdAt
                            )}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`text-sm font-semibold ${
                          isIn
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {isIn ? "+" : "-"}
                        {Number(
                          log.qty || 0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-black">
                        {getProductName(product)}
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {product?.sku ||
                          "No SKU"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[9px] text-gray-400">
                        Reason
                      </p>

                      <p className="mt-1 text-xs font-medium text-gray-700">
                        {getReasonLabel(
                          log.reason
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Stock update modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-black">
                  {stockType === "in"
                    ? "Stock In"
                    : "Stock Out"}
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Update product inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-black"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={handleStockSubmit}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Product
                </label>

                <div className="relative">
                  <select
                    value={selectedProductId}
                    onChange={(event) =>
                      setSelectedProductId(
                        event.target.value
                      )
                    }
                    className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 pr-9 text-xs text-black outline-none focus:border-gray-400 focus:bg-white"
                  >
                    {products.map((product) => (
                      <option
                        key={getId(product)}
                        value={getId(product)}
                      >
                        {product.name}
                        {product.sku
                          ? ` · ${product.sku}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {selectedProductId &&
                productMap[
                  selectedProductId
                ] && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400">
                          Current Stock
                        </p>

                        <p className="mt-1 text-lg font-semibold text-black">
                          {Number(
                            productMap[
                              selectedProductId
                            ].stock || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>

                      <Package
                        size={18}
                        className="text-gray-400"
                      />
                    </div>
                  </div>
                )}

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  placeholder="Enter quantity"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Reason
                </label>

                <div className="relative">
                  <select
                    value={reason}
                    onChange={(event) =>
                      setReason(
                        event.target.value
                      )
                    }
                    className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 pr-9 text-xs text-black outline-none focus:border-gray-400 focus:bg-white"
                  >
                    {stockType === "in" ? (
                      <>
                        <option value="purchase">
                          Purchase
                        </option>
                        <option value="return">
                          Return
                        </option>
                      </>
                    ) : (
                      <option value="sale">
                        Sale
                      </option>
                    )}
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Update Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  RefreshCw,
  Tag,
  Package,
  Percent,
  ArrowRight,
  Loader2,
  AlertCircle,
  Layers3,
} from "lucide-react";

import { getPriceLists } from "@/lib/api/pricelists";
import { getCurrentCompany } from "@/lib/api/auth";

function getDataArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.priceLists)) {
    return data.priceLists;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getId(item) {
  return item?._id || item?.id;
}

function getProductCount(priceList) {
  return Array.isArray(priceList?.products)
    ? priceList.products.length
    : 0;
}

function getPriceListType(name) {
  const value = name?.toLowerCase();

  if (value === "retail") {
    return "Retail";
  }

  if (value === "wholesale") {
    return "Wholesale";
  }

  if (value === "vip") {
    return "VIP";
  }

  return "Custom";
}

function getTypeClasses(name) {
  const type = getPriceListType(name);

  if (type === "VIP") {
    return "bg-black text-white";
  }

  if (type === "Wholesale") {
    return "bg-gray-100 text-gray-700";
  }

  if (type === "Retail") {
    return "bg-white text-gray-600 ring-1 ring-gray-200";
  }

  return "bg-gray-50 text-gray-500 ring-1 ring-gray-200";
}

export default function PriceListsPage() {
  const [priceLists, setPriceLists] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  async function loadPriceLists(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const company = getCurrentCompany();

      const companyId =
        company?._id || company?.id;

      const data =
        await getPriceLists(companyId);

      setPriceLists(getDataArray(data));
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load price lists."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPriceLists();
  }, []);

  const filteredPriceLists = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return priceLists;
    }

    return priceLists.filter((priceList) => {
      const name =
        priceList?.name?.toLowerCase() || "";

      return name.includes(query);
    });
  }, [priceLists, search]);

  const totalProducts = useMemo(() => {
    return priceLists.reduce(
      (total, priceList) =>
        total + getProductCount(priceList),
      0
    );
  }, [priceLists]);

  const averageDiscount = useMemo(() => {
    if (!priceLists.length) {
      return 0;
    }

    const total = priceLists.reduce(
      (sum, priceList) =>
        sum +
        Number(
          priceList?.discountPercent || 0
        ),
      0
    );

    return total / priceLists.length;
  }, [priceLists]);

  const vipList = priceLists.find(
    (priceList) =>
      getPriceListType(priceList?.name) ===
      "VIP"
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Pricing
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Price Lists
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customer pricing and custom
            product rates.
          </p>
        </div>

        <Link
          href="/pricelists/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-xs font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={15} />
          Create Price List
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-medium">
              Unable to load price lists
            </p>

            <p className="mt-0.5 text-xs text-red-500">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPriceLists()}
            className="text-xs font-medium text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Total Price Lists
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-black">
                {loading ? "—" : priceLists.length}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Layers3 size={17} />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            Customer pricing groups
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Custom Product Rates
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-black">
                {loading ? "—" : totalProducts}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Package size={17} />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            Product-level custom prices
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Average Discount
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-black">
                {loading
                  ? "—"
                  : `${averageDiscount.toFixed(1)}%`}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Percent size={17} />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            Across all price lists
          </p>
        </div>

        <div className="rounded-2xl bg-black p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                VIP Pricing
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {loading
                  ? "—"
                  : vipList
                    ? `${Number(
                        vipList.discountPercent || 0
                      )}%`
                    : "—"}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
              <Tag size={17} />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            VIP list discount
          </p>
        </div>
      </div>

      {/* Main Table */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-black">
              All Price Lists
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              {filteredPriceLists.length}{" "}
              {filteredPriceLists.length === 1
                ? "price list"
                : "price lists"}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Search */}
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search price lists..."
                className="h-9 w-[220px] rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() =>
                loadPriceLists(true)
              }
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-black disabled:opacity-50"
              aria-label="Refresh price lists"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 border-b border-gray-100 px-5 py-5 last:border-0"
              >
                <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-100" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="h-2 w-48 animate-pulse rounded bg-gray-100" />
                </div>

                <div className="hidden h-3 w-20 animate-pulse rounded bg-gray-100 sm:block" />
                <div className="hidden h-3 w-20 animate-pulse rounded bg-gray-100 md:block" />
                <div className="h-8 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : filteredPriceLists.length ===
          0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Tag size={19} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-black">
              {search
                ? "No price lists found"
                : "No price lists yet"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-400">
              {search
                ? "Try a different search term."
                : "Create your first price list to define customer-specific pricing."}
            </p>

            {!search && (
              <Link
                href="/pricelists/new"
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-black px-3 text-xs font-medium text-white hover:bg-gray-800"
              >
                <Plus size={14} />
                Create Price List
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Price List
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Type
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Discount
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Custom Products
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPriceLists.map(
                    (priceList) => {
                      const id =
                        getId(priceList);

                      const productCount =
                        getProductCount(
                          priceList
                        );

                      return (
                        <tr
                          key={id}
                          className="border-b border-gray-100 transition hover:bg-gray-50/60 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                                <Tag size={15} />
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-black">
                                  {
                                    priceList.name
                                  }
                                </p>

                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  Price list ID:{" "}
                                  {id || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${getTypeClasses(
                                priceList.name
                              )}`}
                            >
                              {getPriceListType(
                                priceList.name
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <Percent
                                size={12}
                                className="text-gray-400"
                              />

                              <span className="text-xs font-semibold text-black">
                                {Number(
                                  priceList.discountPercent ||
                                    0
                                )}
                                %
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Package
                                size={14}
                                className="text-gray-400"
                              />

                              <span className="text-xs text-gray-600">
                                {productCount}{" "}
                                {productCount ===
                                1
                                  ? "product"
                                  : "products"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/pricelists/${id}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[10px] font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
                            >
                              View
                              <ArrowRight
                                size={12}
                              />
                            </Link>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredPriceLists.map(
                (priceList) => {
                  const id =
                    getId(priceList);

                  const productCount =
                    getProductCount(
                      priceList
                    );

                  return (
                    <div
                      key={id}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                            <Tag size={15} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-black">
                              {priceList.name}
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-md px-2 py-1 text-[9px] font-medium ${getTypeClasses(
                                priceList.name
                              )}`}
                            >
                              {getPriceListType(
                                priceList.name
                              )}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/pricelists/${id}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-black"
                        >
                          <ArrowRight
                            size={13}
                          />
                        </Link>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] text-gray-400">
                            Discount
                          </p>

                          <p className="mt-1 text-sm font-semibold text-black">
                            {Number(
                              priceList.discountPercent ||
                                0
                            )}
                            %
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] text-gray-400">
                            Custom Products
                          </p>

                          <p className="mt-1 text-sm font-semibold text-black">
                            {productCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
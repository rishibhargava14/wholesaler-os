"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Tag,
  Package,
  Percent,
  Users,
  IndianRupee,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

import {
  getPriceList,
} from "@/lib/api/pricelists";

import {
  getProducts,
} from "@/lib/api/products";

import {
  getCustomers,
} from "@/lib/api/customers";

import {
  getCurrentCompany,
} from "@/lib/api/auth";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

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

function getProductId(product) {
  return (
    product?.productId?._id ||
    product?.productId?.id ||
    product?.productId ||
    product?._id ||
    product?.id
  );
}

function getProductDetails(product) {
  return (
    product?.productId &&
    typeof product.productId === "object"
      ? product.productId
      : product
  );
}

function getType(name) {
  const value = name?.toLowerCase();

  if (value === "retail") return "Retail";
  if (value === "wholesale") return "Wholesale";
  if (value === "vip") return "VIP";

  return "Custom";
}

function getTypeClasses(name) {
  const type = getType(name);

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

export default function PriceListDetailsPage() {
  const params = useParams();

  const id = params?.id;

  const [priceList, setPriceList] =
    useState(null);

  const [products, setProducts] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const company =
          getCurrentCompany();

        const companyId =
          company?._id || company?.id;

        const [
          priceListData,
          productsData,
          customersData,
        ] = await Promise.all([
          getPriceList(
            id,
            companyId
          ),

          getProducts({
            companyId,
          }),

          getCustomers({
            companyId,
            priceList: id,
          }),
        ]);

        setPriceList(priceListData);

        setProducts(
          getArray(productsData, [
            "products",
          ])
        );

        setCustomers(
          getArray(customersData, [
            "customers",
          ])
        );
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load price list."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const pricingRows = useMemo(() => {
    if (!priceList) {
      return [];
    }

    const configuredProducts =
      Array.isArray(priceList.products)
        ? priceList.products
        : [];

    return configuredProducts.map(
      (item) => {
        const productId =
          getProductId(item);

        const product =
          products.find(
            (productItem) =>
              String(
                getId(productItem)
              ) === String(productId)
          ) || null;

        const productDetails =
          getProductDetails(item);

        const customPrice =
          Number(
            item?.customPrice || 0
          );

        const wholesalePrice =
          Number(
            product?.wholesalePrice ||
              productDetails?.wholesalePrice ||
              0
          );

        const retailPrice =
          Number(
            product?.retailPrice ||
              productDetails?.retailPrice ||
              0
          );

        const mrp =
          Number(
            product?.mrp ||
              productDetails?.mrp ||
              0
          );

        return {
          productId,
          name:
            product?.name ||
            productDetails?.name ||
            "Unknown Product",
          sku:
            product?.sku ||
            productDetails?.sku ||
            "—",
          category:
            product?.category ||
            productDetails?.category ||
            "—",
          unit:
            product?.unit ||
            productDetails?.unit ||
            "pcs",
          customPrice,
          wholesalePrice,
          retailPrice,
          mrp,
        };
      }
    );
  }, [priceList, products]);

  const totalCustomProducts =
    pricingRows.length;

  const averageCustomPrice =
    useMemo(() => {
      if (!pricingRows.length) {
        return 0;
      }

      const total =
        pricingRows.reduce(
          (sum, item) =>
            sum +
            Number(
              item.customPrice || 0
            ),
          0
        );

      return total / pricingRows.length;
    }, [pricingRows]);

  const averageSavings =
    useMemo(() => {
      const rows =
        pricingRows.filter(
          (item) =>
            item.wholesalePrice > 0 &&
            item.customPrice > 0
        );

      if (!rows.length) {
        return 0;
      }

      const total =
        rows.reduce(
          (sum, item) =>
            sum +
            (item.wholesalePrice -
              item.customPrice),
          0
        );

      return total / rows.length;
    }, [pricingRows]);

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading price list...
        </div>
      </div>
    );
  }

  if (error || !priceList) {
    return (
      <div className="space-y-6">
        <Link
          href="/pricelists"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={15} />
          Back to Price Lists
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-red-500">
            <AlertCircle size={20} />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-red-700">
            Unable to load price list
          </h2>

          <p className="mt-1 text-xs text-red-500">
            {error ||
              "The requested price list could not be found."}
          </p>

          <Link
            href="/pricelists"
            className="mt-5 inline-flex h-9 items-center rounded-lg bg-black px-4 text-xs font-medium text-white hover:bg-gray-800"
          >
            Back to Price Lists
          </Link>
        </div>
      </div>
    );
  }

  const discountPercent =
    Number(
      priceList.discountPercent || 0
    );

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/pricelists"
        className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 transition hover:text-black"
      >
        <ArrowLeft size={15} />
        Back to Price Lists
      </Link>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <Tag size={21} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-black">
                    {priceList.name}
                  </h1>

                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-medium ${getTypeClasses(
                      priceList.name
                    )}`}
                  >
                    {getType(priceList.name)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Customer-specific pricing
                  configuration.
                </p>

                <p className="mt-2 text-[10px] text-gray-400">
                  ID: {getId(priceList)}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 px-5 py-4 lg:min-w-[180px]">
              <p className="text-[10px] uppercase tracking-[0.1em] text-gray-400">
                Default Discount
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-black">
                {discountPercent}%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Custom Products
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-black">
                {totalCustomProducts}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Package size={17} />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            Products with custom prices
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Customers Using List
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-black">
                {customers.length}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Users size={17} />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            Assigned customer accounts
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Average Custom Price
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-black">
                {formatCurrency(
                  averageCustomPrice
                )}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <IndianRupee size={17} />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            Across configured products
          </p>
        </div>

        <div className="rounded-2xl bg-black p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400">
                Avg. vs Wholesale
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {formatCurrency(
                  averageSavings
                )}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">
              <Percent size={17} />
            </div>
          </div>

          <p className="mt-3 text-[10px] text-gray-400">
            Difference per configured product
          </p>
        </div>
      </div>

      {/* Pricing Table */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <ShoppingBag size={17} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-black">
                Product Pricing
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Custom prices configured for this
                price list.
              </p>
            </div>
          </div>
        </div>

        {pricingRows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Package size={19} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-black">
              No custom products
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-400">
              This price list does not have any
              product-specific custom prices.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Product
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Category
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      MRP
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Wholesale
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Custom Price
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Difference
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pricingRows.map(
                    (item) => {
                      const difference =
                        item.wholesalePrice -
                        item.customPrice;

                      return (
                        <tr
                          key={`${item.productId}`}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                <Package
                                  size={15}
                                />
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-black">
                                  {item.name}
                                </p>

                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  {item.sku}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs text-gray-600">
                              {item.category}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-xs text-gray-500">
                              {formatCurrency(
                                item.mrp
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-xs text-gray-600">
                              {formatCurrency(
                                item.wholesalePrice
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-xs font-semibold text-black">
                              {formatCurrency(
                                item.customPrice
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span
                              className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${
                                difference > 0
                                  ? "bg-green-50 text-green-600"
                                  : difference < 0
                                    ? "bg-red-50 text-red-500"
                                    : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {difference > 0
                                ? `-${formatCurrency(
                                    difference
                                  )}`
                                : difference < 0
                                  ? `+${formatCurrency(
                                      Math.abs(
                                        difference
                                      )
                                    )}`
                                  : "Same"}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-100 md:hidden">
              {pricingRows.map(
                (item) => {
                  const difference =
                    item.wholesalePrice -
                    item.customPrice;

                  return (
                    <div
                      key={`${item.productId}`}
                      className="p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                          <Package
                            size={15}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-black">
                            {item.name}
                          </p>

                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {item.sku} ·{" "}
                            {item.category}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] text-gray-400">
                            MRP
                          </p>

                          <p className="mt-1 text-xs font-medium text-gray-700">
                            {formatCurrency(
                              item.mrp
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] text-gray-400">
                            Wholesale
                          </p>

                          <p className="mt-1 text-xs font-medium text-gray-700">
                            {formatCurrency(
                              item.wholesalePrice
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] text-gray-400">
                            Custom Price
                          </p>

                          <p className="mt-1 text-sm font-semibold text-black">
                            {formatCurrency(
                              item.customPrice
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[10px] text-gray-400">
                            Difference
                          </p>

                          <p
                            className={`mt-1 text-xs font-semibold ${
                              difference > 0
                                ? "text-green-600"
                                : difference < 0
                                  ? "text-red-500"
                                  : "text-gray-500"
                            }`}
                          >
                            {difference > 0
                              ? `-${formatCurrency(
                                  difference
                                )}`
                              : difference < 0
                                ? `+${formatCurrency(
                                    Math.abs(
                                      difference
                                    )
                                  )}`
                                : "Same"}
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

      {/* Customers */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Users size={17} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-black">
                Customers Using This List
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Customers currently associated with
                this price list.
              </p>
            </div>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-gray-400">
            No customers are currently assigned
            to this price list.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <div
                key={getId(customer)}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">
                    {(
                      customer.shopName ||
                      "C"
                    )
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-black">
                      {customer.shopName ||
                        "Unnamed Shop"}
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {customer.ownerName ||
                        "Owner not provided"}
                      {customer.phone
                        ? ` · ${customer.phone}`
                        : ""}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                    customer.status ===
                    "inactive"
                      ? "bg-gray-100 text-gray-400"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {customer.status ||
                    "active"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
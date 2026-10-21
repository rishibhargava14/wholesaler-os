"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Package,
  Percent,
  Plus,
  Search,
  Tag,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  createPriceList,
} from "@/lib/api/pricelists";

import {
  getProducts,
} from "@/lib/api/products";

import {
  getCurrentCompany,
} from "@/lib/api/auth";

const PRICE_LIST_TYPES = [
  "Retail",
  "Wholesale",
  "VIP",
];

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

function getId(item) {
  return item?._id || item?.id;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function NewPriceListPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] =
    useState([]);

  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] =
    useState("");

  const [search, setSearch] = useState("");

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setError("");

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
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const productName =
        product?.name?.toLowerCase() || "";

      const sku =
        product?.sku?.toLowerCase() || "";

      const category =
        product?.category?.toLowerCase() || "";

      return (
        productName.includes(query) ||
        sku.includes(query) ||
        category.includes(query)
      );
    });
  }, [products, search]);

  function isSelected(productId) {
    return selectedProducts.some(
      (item) =>
        String(item.productId) ===
        String(productId)
    );
  }

  function addProduct(product) {
    const productId = getId(product);

    if (!productId || isSelected(productId)) {
      return;
    }

    setSelectedProducts((current) => [
      ...current,
      {
        productId,
        customPrice:
          product?.wholesalePrice || 0,
      },
    ]);
  }

  function removeProduct(productId) {
    setSelectedProducts((current) =>
      current.filter(
        (item) =>
          String(item.productId) !==
          String(productId)
      )
    );
  }

  function updateCustomPrice(
    productId,
    value
  ) {
    setSelectedProducts((current) =>
      current.map((item) =>
        String(item.productId) ===
        String(productId)
          ? {
              ...item,
              customPrice: value,
            }
          : item
      )
    );
  }

  function getSelectedProduct(productId) {
    return products.find(
      (product) =>
        String(getId(product)) ===
        String(productId)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(
        "Please enter a price list name."
      );
      return;
    }

    const discount =
      Number(discountPercent || 0);

    if (
      Number.isNaN(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      setError(
        "Discount must be between 0% and 100%."
      );
      return;
    }

    const invalidProduct =
      selectedProducts.find(
        (item) =>
          Number(item.customPrice) < 0 ||
          item.customPrice === ""
      );

    if (invalidProduct) {
      setError(
        "Please enter a valid custom price for every selected product."
      );
      return;
    }

    try {
      setSubmitting(true);

      const company =
        getCurrentCompany();

      const companyId =
        company?._id || company?.id;

      const payload = {
        companyId,
        name: trimmedName,
        discountPercent: discount,
        products:
          selectedProducts.map((item) => ({
            productId: item.productId,
            customPrice:
              Number(item.customPrice),
          })),
      };

      await createPriceList(payload);

      router.push("/pricelists");
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create price list."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back */}
      <Link
        href="/pricelists"
        className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 transition hover:text-black"
      >
        <ArrowLeft size={15} />
        Back to Price Lists
      </Link>

      {/* Header */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
          Pricing
        </p>

        <h1 className="mt-1 text-xl font-semibold tracking-tight text-black">
          Create Price List
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Define pricing rules and custom product
          rates for your customers.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-medium">
              Something went wrong
            </p>

            <p className="mt-0.5 text-xs">
              {error}
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic Information */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <Tag size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-black">
                  Price List Information
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Set the name and default discount.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            {/* Name */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">
                Price List Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Wholesale"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
              />

              <p className="mt-1.5 text-[10px] text-gray-400">
                Examples: Retail, Wholesale, VIP
              </p>
            </div>

            {/* Discount */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">
                Default Discount
              </label>

              <div className="relative">
                <Percent
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountPercent}
                  onChange={(event) =>
                    setDiscountPercent(
                      event.target.value
                    )
                  }
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                />
              </div>

              <p className="mt-1.5 text-[10px] text-gray-400">
                Used when a product does not have a
                custom price.
              </p>
            </div>
          </div>

          {/* Quick Types */}
          <div className="border-t border-gray-100 px-5 py-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
              Quick Name
            </p>

            <div className="flex flex-wrap gap-2">
              {PRICE_LIST_TYPES.map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setName(type)
                    }
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-medium transition ${
                      name === type
                        ? "bg-black text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* Product Selection */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Package size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-black">
                    Select Products
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-400">
                    Add products and define their
                    custom prices.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 px-3 py-2 text-[10px] font-medium text-gray-500">
                {selectedProducts.length} selected
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="border-b border-gray-100 p-4">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products by name, SKU or category..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Product Picker */}
          <div className="max-h-[340px] overflow-y-auto">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-14 text-xs text-gray-400">
                <Loader2
                  size={16}
                  className="mr-2 animate-spin"
                />
                Loading products...
              </div>
            ) : filteredProducts.length ===
              0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  <Package size={17} />
                </div>

                <p className="mt-3 text-xs font-medium text-gray-600">
                  No products found
                </p>

                <p className="mt-1 text-[10px] text-gray-400">
                  Try a different search term.
                </p>
              </div>
            ) : (
              filteredProducts.map(
                (product) => {
                  const productId =
                    getId(product);

                  const selected =
                    isSelected(productId);

                  return (
                    <div
                      key={productId}
                      className={`flex items-center gap-3 border-b border-gray-100 px-5 py-3.5 last:border-0 ${
                        selected
                          ? "bg-gray-50"
                          : "hover:bg-gray-50/60"
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() =>
                          selected
                            ? removeProduct(
                                productId
                              )
                            : addProduct(
                                product
                              )
                        }
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                          selected
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-transparent hover:border-gray-500"
                        }`}
                      >
                        <Check
                          size={12}
                          strokeWidth={2.5}
                        />
                      </button>

                      {/* Product */}
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                          <Package size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-black">
                            {product.name}
                          </p>

                          <p className="mt-0.5 truncate text-[10px] text-gray-400">
                            {product.sku ||
                              "No SKU"}
                            {product.category
                              ? ` · ${product.category}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      {/* Reference prices */}
                      <div className="hidden text-right sm:block">
                        <p className="text-[9px] text-gray-400">
                          Wholesale
                        </p>

                        <p className="text-xs font-medium text-gray-600">
                          {formatCurrency(
                            product.wholesalePrice
                          )}
                        </p>
                      </div>

                      <div className="hidden text-right md:block">
                        <p className="text-[9px] text-gray-400">
                          Retail
                        </p>

                        <p className="text-xs text-gray-500">
                          {formatCurrency(
                            product.retailPrice
                          )}
                        </p>
                      </div>

                      {/* Add */}
                      <button
                        type="button"
                        onClick={() =>
                          selected
                            ? removeProduct(
                                productId
                              )
                            : addProduct(
                                product
                              )
                        }
                        className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[10px] font-medium transition ${
                          selected
                            ? "border border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            : "bg-black text-white hover:bg-gray-800"
                        }`}
                      >
                        {selected ? (
                          <>
                            <Check
                              size={12}
                            />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus
                              size={12}
                            />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        {/* Selected Products */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-black">
                Custom Pricing
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Set a custom price for each selected
                product.
              </p>
            </div>

            <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600">
              {selectedProducts.length} products
            </span>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                <Tag size={19} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-black">
                No products selected
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-400">
                Select products above to configure
                custom pricing.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                        Product
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
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedProducts.map(
                      (selected) => {
                        const product =
                          getSelectedProduct(
                            selected.productId
                          );

                        if (!product) {
                          return null;
                        }

                        return (
                          <tr
                            key={
                              selected.productId
                            }
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                  <Package
                                    size={15}
                                  />
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-black">
                                    {
                                      product.name
                                    }
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-gray-400">
                                    {product.sku ||
                                      "No SKU"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right text-xs text-gray-500">
                              {formatCurrency(
                                product.mrp
                              )}
                            </td>

                            <td className="px-5 py-4 text-right text-xs text-gray-500">
                              {formatCurrency(
                                product.wholesalePrice
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="ml-auto flex max-w-[150px] items-center">
                                <span className="flex h-9 items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-2 text-xs text-gray-400">
                                  ₹
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    selected.customPrice
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateCustomPrice(
                                      selected.productId,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  className="h-9 w-full rounded-r-lg border border-gray-200 bg-white px-2 text-right text-xs font-medium text-black outline-none focus:border-gray-400"
                                />
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  removeProduct(
                                    selected.productId
                                  )
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                                aria-label={`Remove ${product.name}`}
                              >
                                <Trash2
                                  size={14}
                                />
                              </button>
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
                {selectedProducts.map(
                  (selected) => {
                    const product =
                      getSelectedProduct(
                        selected.productId
                      );

                    if (!product) {
                      return null;
                    }

                    return (
                      <div
                        key={
                          selected.productId
                        }
                        className="space-y-4 p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                              <Package
                                size={15}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-black">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] text-gray-400">
                                {product.sku ||
                                  "No SKU"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeProduct(
                                selected.productId
                              )
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-[10px] text-gray-400">
                              MRP
                            </p>

                            <p className="mt-1 text-xs font-medium text-gray-700">
                              {formatCurrency(
                                product.mrp
                              )}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-[10px] text-gray-400">
                              Wholesale
                            </p>

                            <p className="mt-1 text-xs font-medium text-gray-700">
                              {formatCurrency(
                                product.wholesalePrice
                              )}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-[10px] font-medium text-gray-500">
                            Custom Price
                          </label>

                          <div className="flex">
                            <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-xs text-gray-400">
                              ₹
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                selected.customPrice
                              }
                              onChange={(
                                event
                              ) =>
                                updateCustomPrice(
                                  selected.productId,
                                  event
                                    .target
                                    .value
                                )
                              }
                              className="h-10 w-full rounded-r-lg border border-gray-200 bg-white px-3 text-xs font-medium text-black outline-none focus:border-gray-400"
                            />
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

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/pricelists"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2
                  size={14}
                  className="animate-spin"
                />
                Creating...
              </>
            ) : (
              <>
                <Check size={14} />
                Create Price List
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
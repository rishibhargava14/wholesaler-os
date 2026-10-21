"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  UserRound,
  Package,
  CreditCard,
  ShoppingCart,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { getCustomers } from "@/lib/api/customers";
import { getProducts } from "@/lib/api/products";
import { getPriceLists } from "@/lib/api/pricelists";
import { createOrder } from "@/lib/api/orders";
import { getCurrentCompany } from "@/lib/api/auth";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getDataArray(data, keys) {
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
  return product?._id || product?.id;
}

function getCustomerId(customer) {
  return customer?._id || customer?.id;
}

function getPriceListId(priceList) {
  return priceList?._id || priceList?.id;
}

function getPriceForProduct(
  product,
  priceList
) {
  if (!product) return 0;

  const productId = String(
    getProductId(product)
  );

  const customProduct =
    priceList?.products?.find(
      (item) =>
        String(
          item.productId?._id ||
            item.productId ||
            item.id
        ) === productId
    );

  if (
    customProduct?.customPrice !==
      undefined &&
    customProduct?.customPrice !== null
  ) {
    return Number(
      customProduct.customPrice
    );
  }

  const listName =
    priceList?.name?.toLowerCase();

  if (listName === "retail") {
    return Number(
      product.retailPrice ||
        product.mrp ||
        0
    );
  }

  return Number(
    product.wholesalePrice ||
      product.retailPrice ||
      product.mrp ||
      0
  );
}

function getStockLabel(product) {
  if (!product) return "";

  if (Number(product.stock) <= 0) {
    return "Out of stock";
  }

  return `${product.stock} ${product.unit || "units"} available`;
}

export default function NewOrderPage() {
  const router = useRouter();

  const [customers, setCustomers] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [priceLists, setPriceLists] =
    useState([]);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [selectedPriceList, setSelectedPriceList] =
    useState(null);

  const [customerSearch, setCustomerSearch] =
    useState("");

  const [productSearch, setProductSearch] =
    useState("");

  const [items, setItems] = useState([]);

  const [discount, setDiscount] =
    useState("");

  const [paymentMode, setPaymentMode] =
    useState("Cash");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
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
          customersData,
          productsData,
          priceListsData,
        ] = await Promise.all([
          getCustomers({
            companyId,
          }),

          getProducts({
            companyId,
          }),

          getPriceLists(companyId),
        ]);

        setCustomers(
          getDataArray(
            customersData,
            ["customers"]
          )
        );

        setProducts(
          getDataArray(
            productsData,
            ["products"]
          )
        );

        setPriceLists(
          getDataArray(
            priceListsData,
            ["priceLists"]
          )
        );
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load order data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredCustomers =
    useMemo(() => {
      const query =
        customerSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return customers.slice(0, 8);
      }

      return customers
        .filter((customer) => {
          const shop =
            customer.shopName
              ?.toLowerCase() || "";

          const owner =
            customer.ownerName
              ?.toLowerCase() || "";

          const phone =
            customer.phone || "";

          return (
            shop.includes(query) ||
            owner.includes(query) ||
            phone.includes(query)
          );
        })
        .slice(0, 8);
    }, [customers, customerSearch]);

  const filteredProducts =
    useMemo(() => {
      const query =
        productSearch
          .trim()
          .toLowerCase();

      let result = products;

      if (query) {
        result = result.filter(
          (product) => {
            const name =
              product.name
                ?.toLowerCase() || "";

            const sku =
              product.sku
                ?.toLowerCase() || "";

            const category =
              product.category
                ?.toLowerCase() || "";

            return (
              name.includes(query) ||
              sku.includes(query) ||
              category.includes(query)
            );
          }
        );
      }

      return result.slice(0, 12);
    }, [products, productSearch]);

  function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerSearch("");

    const priceListId =
      customer.priceListId?._id ||
      customer.priceListId;

    const priceList =
      priceLists.find(
        (item) =>
          String(
            getPriceListId(item)
          ) ===
          String(priceListId)
      ) || null;

    setSelectedPriceList(priceList);

    setItems([]);
    setError("");
  }

  function addProduct(product) {
    if (!selectedCustomer) {
      setError(
        "Please select a customer first."
      );
      return;
    }

    if (Number(product.stock) <= 0) {
      setError(
        `${product.name} is out of stock.`
      );
      return;
    }

    const productId =
      getProductId(product);

    const existingIndex =
      items.findIndex(
        (item) =>
          String(item.productId) ===
          String(productId)
      );

    if (existingIndex !== -1) {
      setItems((current) =>
        current.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                qty: Math.min(
                  item.qty + 1,
                  Number(product.stock)
                ),
              }
            : item
        )
      );

      setProductSearch("");
      return;
    }

    const price =
      getPriceForProduct(
        product,
        selectedPriceList
      );

    setItems((current) => [
      ...current,
      {
        productId,
        title: product.name,
        sku: product.sku,
        qty: 1,
        price,
        gstPercent: Number(
          product.gstPercent || 0
        ),
        stock: Number(
          product.stock || 0
        ),
        unit: product.unit || "pcs",
      },
    ]);

    setProductSearch("");
    setError("");
  }

  function updateQuantity(
    productId,
    nextQty
  ) {
    setItems((current) =>
      current.map((item) => {
        if (
          String(item.productId) !==
          String(productId)
        ) {
          return item;
        }

        const qty = Math.max(
          1,
          Math.min(
            Number(nextQty),
            item.stock
          )
        );

        return {
          ...item,
          qty,
        };
      })
    );
  }

  function removeItem(productId) {
    setItems((current) =>
      current.filter(
        (item) =>
          String(item.productId) !==
          String(productId)
      )
    );
  }

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          Number(item.qty),
      0
    );
  }, [items]);

  const gstTotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        (Number(item.price) *
          Number(item.qty) *
          Number(item.gstPercent || 0)) /
          100,
      0
    );
  }, [items]);

  const discountAmount = Math.max(
    0,
    Math.min(
      Number(discount || 0),
      subtotal + gstTotal
    )
  );

  const grandTotal =
    subtotal +
    gstTotal -
    discountAmount;

  const outstanding =
    Number(
      selectedCustomer?.outstandingAmount ||
        0
    );

  const creditLimit =
    Number(
      selectedCustomer?.creditLimit || 0
    );

  const projectedOutstanding =
    outstanding + grandTotal;

  const exceedsCreditLimit =
    paymentMode === "Credit" &&
    creditLimit > 0 &&
    projectedOutstanding >
      creditLimit;

  async function handleCreateOrder() {
    try {
      setError("");
      setSuccess("");

      if (!selectedCustomer) {
        setError(
          "Please select a customer."
        );
        return;
      }

      if (!items.length) {
        setError(
          "Please add at least one product."
        );
        return;
      }

      if (exceedsCreditLimit) {
        setError(
          "This order exceeds the customer's credit limit."
        );
        return;
      }

      setSubmitting(true);

      const result =
        await createOrder({
          customerId:
            getCustomerId(
              selectedCustomer
            ),

          items,

          paymentMode,

          discount:
            discountAmount,
        });

      const order =
        result?.order ||
        result?.data ||
        result;

      setSuccess(
        `Order ${
          order?.orderNo ||
          "created"
        } successfully.`
      );

      setTimeout(() => {
        router.push("/orders");
      }, 900);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading order data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 transition hover:text-black"
        >
          <ArrowLeft size={15} />
          Back to Orders
        </Link>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
            Order Management
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Create Order
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new wholesale order for a
            customer.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Customer */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <UserRound size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-black">
                    Customer
                  </h2>

                  <p className="text-xs text-gray-400">
                    Search by shop name, owner, or
                    phone.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {selectedCustomer ? (
                <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-black">
                      {
                        selectedCustomer.shopName
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {selectedCustomer.ownerName ||
                        "Owner not provided"}
                      {" · "}
                      {selectedCustomer.phone}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">
                        {selectedPriceList?.name ||
                          "No Price List"}
                      </span>

                      <span className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">
                        Credit Limit:{" "}
                        {formatCurrency(
                          creditLimit
                        )}
                      </span>

                      <span className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">
                        Outstanding:{" "}
                        {formatCurrency(
                          outstanding
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(
                        null
                      );
                      setSelectedPriceList(
                        null
                      );
                      setItems([]);
                    }}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={customerSearch}
                    onChange={(event) =>
                      setCustomerSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search shop name, owner, or phone..."
                    className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                  />

                  {customerSearch && (
                    <div className="absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      {filteredCustomers.length ===
                      0 ? (
                        <div className="px-4 py-6 text-center text-xs text-gray-400">
                          No customers found.
                        </div>
                      ) : (
                        filteredCustomers.map(
                          (customer) => (
                            <button
                              key={getCustomerId(
                                customer
                              )}
                              type="button"
                              onClick={() =>
                                selectCustomer(
                                  customer
                                )
                              }
                              className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
                            >
                              <div>
                                <p className="text-xs font-medium text-black">
                                  {
                                    customer.shopName
                                  }
                                </p>

                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  {customer.ownerName ||
                                    "—"}{" "}
                                  ·{" "}
                                  {
                                    customer.phone
                                  }
                                </p>
                              </div>

                              <span className="text-[10px] text-gray-400">
                                {customer.priceListId?.name ||
                                  "Price List"}
                              </span>
                            </button>
                          )
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Products */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Package size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-black">
                    Products
                  </h2>

                  <p className="text-xs text-gray-400">
                    Add products and set quantities.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {!selectedCustomer ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-5 py-12 text-center">
                  <ShoppingCart
                    size={22}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm font-medium text-gray-500">
                    Select a customer first
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    The customer's price list will
                    determine product pricing.
                  </p>
                </div>
              ) : (
                <>
                  {/* Product search */}
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      value={productSearch}
                      onChange={(event) =>
                        setProductSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search products by name, SKU, or category..."
                      className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                    />

                    {productSearch && (
                      <div className="absolute left-0 right-0 top-14 z-20 max-h-[360px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                        {filteredProducts.length ===
                        0 ? (
                          <div className="px-4 py-6 text-center text-xs text-gray-400">
                            No products found.
                          </div>
                        ) : (
                          filteredProducts.map(
                            (product) => {
                              const price =
                                getPriceForProduct(
                                  product,
                                  selectedPriceList
                                );

                              return (
                                <button
                                  key={getProductId(
                                    product
                                  )}
                                  type="button"
                                  onClick={() =>
                                    addProduct(
                                      product
                                    )
                                  }
                                  className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-black">
                                      {
                                        product.name
                                      }
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-gray-400">
                                      {
                                        product.sku
                                      }{" "}
                                      ·{" "}
                                      {getStockLabel(
                                        product
                                      )}
                                    </p>
                                  </div>

                                  <div className="ml-4 shrink-0 text-right">
                                    <p className="text-xs font-semibold text-black">
                                      {formatCurrency(
                                        price
                                      )}
                                    </p>

                                    <p className="text-[9px] text-gray-400">
                                      {selectedPriceList?.name ||
                                        "Default price"}
                                    </p>
                                  </div>
                                </button>
                              );
                            }
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  {items.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center">
                      <Plus
                        size={20}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-2 text-xs font-medium text-gray-500">
                        No products added
                      </p>

                      <p className="mt-1 text-[10px] text-gray-400">
                        Search above to add products.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[650px]">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-[0.1em] text-gray-400">
                            <th className="pb-3 font-medium">
                              Product
                            </th>

                            <th className="pb-3 font-medium">
                              Price
                            </th>

                            <th className="pb-3 font-medium">
                              Qty
                            </th>

                            <th className="pb-3 text-right font-medium">
                              Total
                            </th>

                            <th className="w-10 pb-3" />
                          </tr>
                        </thead>

                        <tbody>
                          {items.map(
                            (item) => (
                              <tr
                                key={item.productId}
                                className="border-b border-gray-100 last:border-0"
                              >
                                <td className="py-4">
                                  <p className="text-xs font-medium text-black">
                                    {item.title}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-gray-400">
                                    {item.sku}
                                    {" · "}
                                    GST{" "}
                                    {item.gstPercent}%
                                  </p>
                                </td>

                                <td className="py-4">
                                  <span className="text-xs text-gray-600">
                                    {formatCurrency(
                                      item.price
                                    )}
                                  </span>
                                </td>

                                <td className="py-4">
                                  <div className="flex h-8 w-fit items-center rounded-lg border border-gray-200">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.productId,
                                          item.qty -
                                            1
                                        )
                                      }
                                      disabled={
                                        item.qty <=
                                        1
                                      }
                                      className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                    >
                                      <Minus
                                        size={12}
                                      />
                                    </button>

                                    <span className="w-8 text-center text-xs font-medium text-black">
                                      {item.qty}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.productId,
                                          item.qty +
                                            1
                                        )
                                      }
                                      disabled={
                                        item.qty >=
                                        item.stock
                                      }
                                      className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                                    >
                                      <Plus
                                        size={12}
                                      />
                                    </button>
                                  </div>
                                </td>

                                <td className="py-4 text-right">
                                  <span className="text-xs font-semibold text-black">
                                    {formatCurrency(
                                      item.price *
                                        item.qty
                                    )}
                                  </span>
                                </td>

                                <td className="py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItem(
                                        item.productId
                                      )
                                    }
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                                  >
                                    <Trash2
                                      size={14}
                                    />
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <CreditCard size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-black">
                    Payment
                  </h2>

                  <p className="text-xs text-gray-400">
                    Select how the customer will pay.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Payment Mode
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    "UPI",
                    "Cash",
                    "Credit",
                  ].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setPaymentMode(mode)
                      }
                      className={`h-10 rounded-lg text-xs font-medium transition ${
                        paymentMode === mode
                          ? "bg-black text-white"
                          : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Discount
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(event) =>
                      setDiscount(
                        event.target.value
                      )
                    }
                    placeholder="0"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-7 pr-3 text-sm text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit xl:sticky xl:top-[92px]">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-black">
                Order Summary
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Review before creating the order.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Items
                </span>

                <span className="font-medium text-black">
                  {items.length}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium text-black">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  GST
                </span>

                <span className="font-medium text-black">
                  {formatCurrency(gstTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Discount
                </span>

                <span className="font-medium text-red-500">
                  -{formatCurrency(
                    discountAmount
                  )}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-400">
                      Grand Total
                    </p>

                    <p className="mt-1 text-2xl font-semibold tracking-tight text-black">
                      {formatCurrency(
                        grandTotal
                      )}
                    </p>
                  </div>

                  <ShoppingCart
                    size={20}
                    className="text-gray-300"
                  />
                </div>
              </div>

              {paymentMode === "Credit" &&
                selectedCustomer && (
                  <div
                    className={`rounded-xl border p-3 ${
                      exceedsCreditLimit
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">
                        Current Outstanding
                      </span>

                      <span className="font-medium text-gray-700">
                        {formatCurrency(
                          outstanding
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-[10px]">
                      <span className="text-gray-500">
                        After This Order
                      </span>

                      <span className="font-medium text-gray-700">
                        {formatCurrency(
                          projectedOutstanding
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-[10px]">
                      <span className="text-gray-500">
                        Credit Limit
                      </span>

                      <span className="font-medium text-gray-700">
                        {formatCurrency(
                          creditLimit
                        )}
                      </span>
                    </div>

                    {exceedsCreditLimit && (
                      <p className="mt-3 text-[10px] font-medium text-red-600">
                        Credit limit exceeded.
                      </p>
                    )}
                  </div>
                )}

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={
                  submitting ||
                  !selectedCustomer ||
                  !items.length ||
                  exceedsCreditLimit
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Order
                    <ChevronDown
                      size={15}
                      className="rotate-[-90deg]"
                    />
                  </>
                )}
              </button>

              <Link
                href="/orders"
                className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 text-xs font-medium text-gray-500 transition hover:bg-gray-50 hover:text-black"
              >
                Cancel
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { api } from "@/lib/api/api";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getStockStatus(product) {
  const stock = Number(product.stock || 0);
  const minStock = Number(product.minStock || 0);

  if (stock === 0) {
    return {
      label: "Out of stock",
      className: "bg-red-50 text-red-600",
    };
  }

  if (stock <= minStock) {
    return {
      label: "Low stock",
      className: "bg-orange-50 text-orange-600",
    };
  }

  return {
    label: "In stock",
    className: "bg-green-50 text-green-600",
  };
}

export default function PublicWholesaleStore({
  params,
}) {
  const { subdomain = "demo" } = use(params);

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState("All");

  const [showInquiry, setShowInquiry] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [shopName, setShopName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      try {
        setLoading(true);
        const data = await api(
          `/wholesale/${encodeURIComponent(subdomain)}`,
          { method: "GET" }
        );
        if (!cancelled) {
          setCompany(data.company);
          setProducts(data.products || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load store.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStore();
    return () => {
      cancelled = true;
    };
  }, [subdomain]);

  const filteredProducts = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return products.filter(
      (product) => {
        const matchesCategory =
          category === "All" ||
          product.category === category;

        const matchesSearch =
          !query ||
          product.name
            .toLowerCase()
            .includes(query) ||
          product.sku
            .toLowerCase()
            .includes(query) ||
          product.category
            .toLowerCase()
            .includes(query);

        return (
          matchesCategory &&
          matchesSearch
        );
      }
    );
  }, [products, search, category]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ],
    [products]
  );

  function openInquiry() {
    setError("");
    setSubmitted(false);
    setShowInquiry(true);
  }

  function closeInquiry() {
    if (submitting) return;

    setShowInquiry(false);
  }

  async function handleInquirySubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    const cleanShopName =
      shopName.trim();

    const cleanPhone =
      phone.trim();

    if (!cleanShopName) {
      setError(
        "Please enter your shop name."
      );
      return;
    }

    if (!cleanPhone) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    if (
      cleanPhone.replace(/\D/g, "").length <
      10
    ) {
      setError(
        "Please enter a valid phone number."
      );
      return;
    }

    try {
      setSubmitting(true);

      await api(
        `/wholesale/${encodeURIComponent(subdomain)}/inquiry`,
        {
          method: "POST",
          body: JSON.stringify({
            shopName: cleanShopName,
            phone: cleanPhone,
          }),
        }
      );

      setSubmitted(true);
      setShopName("");
      setPhone("");
    } catch {
      setError(
        "Unable to submit your inquiry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f6] text-sm text-gray-500">
        Loading catalog...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f6] text-black">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
              <Store size={17} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {company?.name || "Wholesale Catalog"}
              </p>

              <p className="text-[10px] text-gray-400">
                Wholesale Catalog
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openInquiry}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-black px-3.5 text-[10px] font-medium text-white transition hover:bg-gray-800 sm:px-4"
          >
            <Phone size={13} />
            <span className="hidden sm:inline">
              Make an Inquiry
            </span>
            <span className="sm:hidden">
              Inquiry
            </span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">
              Wholesale Catalog
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
              Quality products.
              <br />
              Wholesale pricing.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-gray-500">
              Browse our current wholesale catalog
              and contact us for bulk orders and
              business pricing.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openInquiry}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-black px-4 text-xs font-medium text-white transition hover:bg-gray-800"
              >
                Contact Wholesale
                <ArrowRight size={14} />
              </button>

              <a
                href={`tel:${company?.phone || ""}`}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
              >
                <Phone size={14} />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search + category */}
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search products..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setCategory(item)
                  }
                  className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-medium transition ${
                    category === item
                      ? "bg-black text-white"
                      : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        {/* Catalog heading */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
              Products
            </p>

            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Wholesale Catalog
            </h2>
          </div>

          <p className="text-[10px] text-gray-400">
            {filteredProducts.length} products
          </p>
        </div>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-20 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Search size={18} />
            </div>

            <h3 className="mt-4 text-sm font-semibold">
              No products found
            </h3>

            <p className="mt-1 text-xs text-gray-400">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(
              (product) => {
                const stock =
                  getStockStatus(product);

                const outOfStock =
                  Number(product.stock || 0) ===
                  0;

                return (
                  <article
                    key={product._id}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* Product visual */}
                    <div className="relative flex aspect-[4/3] items-center justify-center bg-gray-100">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <Package
                          size={27}
                          strokeWidth={1.5}
                          className="text-gray-400"
                        />
                      </div>

                      <span
                        className={`absolute right-3 top-3 rounded-md px-2 py-1 text-[9px] font-medium ${stock.className}`}
                      >
                        {stock.label}
                      </span>
                    </div>

                    {/* Product info */}
                    <div className="p-4">
                      <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-gray-400">
                        {product.category}
                      </p>

                      <h3 className="mt-1.5 min-h-[40px] text-sm font-semibold leading-5 text-black">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-[10px] text-gray-400">
                        SKU: {product.sku}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[9px] text-gray-400">
                            Wholesale
                          </p>

                          <p className="mt-1 text-sm font-semibold text-black">
                            {formatCurrency(
                              product.wholesalePrice
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[9px] text-gray-400">
                            Retail
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-600">
                            {formatCurrency(
                              product.retailPrice
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400">
                          {product.stock > 0
                            ? `${product.stock} ${product.unit} available`
                            : "Currently unavailable"}
                        </p>

                        <button
                          type="button"
                          onClick={openInquiry}
                          disabled={outOfStock}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-[9px] font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ShoppingBag
                            size={12}
                          />
                          Inquire
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-black px-5 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                Bulk Orders
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Looking for wholesale quantities?
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-5 text-gray-400">
                Send us your shop details and phone
                number. Our team will contact you about
                wholesale pricing and availability.
              </p>
            </div>

            <button
              type="button"
              onClick={openInquiry}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-medium text-black transition hover:bg-gray-100"
            >
              Send Inquiry
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-[10px] text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()}{" "}
            {company?.name || "Wholesale Catalog"}
          </p>

          <p>
            Wholesale catalog · {subdomain}
          </p>
        </div>
      </footer>

      {/* Inquiry modal */}
      {showInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
                  Wholesale Inquiry
                </p>

                <h2 className="mt-1 text-base font-semibold">
                  Tell us about your shop
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  We&apos;ll contact you regarding wholesale
                  products and pricing.
                </p>
              </div>

              <button
                type="button"
                onClick={closeInquiry}
                disabled={submitting}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-black disabled:opacity-50"
              >
                <X size={15} />
              </button>
            </div>

            {submitted ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <Check size={21} />
                </div>

                <h3 className="mt-4 text-sm font-semibold">
                  Inquiry submitted
                </h3>

                <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-gray-400">
                  Thank you. Our wholesale team will
                  contact you shortly.
                </p>

                <button
                  type="button"
                  onClick={closeInquiry}
                  className="mt-6 h-9 rounded-lg bg-black px-5 text-xs font-medium text-white hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={
                  handleInquirySubmit
                }
                className="space-y-5 p-5"
              >
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    Shop Name
                  </label>

                  <div className="relative">
                    <Store
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={shopName}
                      onChange={(event) =>
                        setShopName(
                          event.target.value
                        )
                      }
                      placeholder="Enter your shop name"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      placeholder="Enter your phone number"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-black text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Inquiry"}
                  {!submitting && (
                    <ArrowRight size={13} />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Loader2,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  getCustomers,
} from "@/lib/api/customers";

import {
  getCustomerLedger,
  addPayment,
  normalizeLedgerResponse,
} from "@/lib/api/ledger";

import {
  getCurrentCompany,
} from "@/lib/api/auth";

function getId(item) {
  return item?._id || item?.id;
}

function getCustomerName(customer) {
  return (
    customer?.shopName ||
    customer?.name ||
    customer?.ownerName ||
    "Unknown Customer"
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

function getOrderNumber(entry) {
  if (!entry?.orderId) {
    return "—";
  }

  if (typeof entry.orderId === "string") {
    return entry.orderId;
  }

  return (
    entry.orderId.orderNo ||
    entry.orderId._id ||
    "—"
  );
}

function LedgerContent() {
  const searchParams = useSearchParams();

  const initialCustomerId =
    searchParams.get("customerId") || "";

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] =
    useState(initialCustomerId);

  const [entries, setEntries] = useState([]);
  const [outstanding, setOutstanding] =
    useState(0);

  const [customerSearch, setCustomerSearch] =
    useState("");

  const [loadingCustomers, setLoadingCustomers] =
    useState(true);

  const [loadingLedger, setLoadingLedger] =
    useState(false);

  const [error, setError] = useState("");

  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentMode, setPaymentMode] =
    useState("UPI");

  const [paymentDescription, setPaymentDescription] =
    useState("");

  const [submittingPayment, setSubmittingPayment] =
    useState(false);

  async function loadCustomers() {
    try {
      setLoadingCustomers(true);
      setError("");

      const company =
        getCurrentCompany();

      const companyId =
        company?._id || company?.id;

      const data = await getCustomers({
        companyId,
      });

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.customers)
          ? data.customers
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setCustomers(list);

      if (
        initialCustomerId &&
        list.some(
          (customer) =>
            String(getId(customer)) ===
            String(initialCustomerId)
        )
      ) {
        setSelectedCustomerId(
          initialCustomerId
        );
      } else if (
        !selectedCustomerId &&
        list.length > 0
      ) {
        setSelectedCustomerId(
          getId(list[0])
        );
      }

    } catch (err) {
      setError(
        err?.message ||
          "Unable to load customers."
      );
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadLedger(customerId) {
    if (!customerId) {
      setEntries([]);
      setOutstanding(0);
      return;
    }

    try {
      setLoadingLedger(true);
      setError("");

      const data =
        await getCustomerLedger(
          customerId
        );

      const normalized =
        normalizeLedgerResponse(data);

      setEntries(normalized.entries);
      setOutstanding(normalized.outstanding);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load customer ledger."
      );

      setEntries([]);
      setOutstanding(0);
    } finally {
      setLoadingLedger(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadLedger(selectedCustomerId);
  }, [selectedCustomerId]);

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) =>
          String(getId(customer)) ===
          String(selectedCustomerId)
      ),
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const query =
      customerSearch.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const shopName =
        customer?.shopName?.toLowerCase() || "";

      const ownerName =
        customer?.ownerName?.toLowerCase() || "";

      const phone =
        customer?.phone?.toLowerCase() || "";

      return (
        shopName.includes(query) ||
        ownerName.includes(query) ||
        phone.includes(query)
      );
    });
  }, [customers, customerSearch]);

  const totalDebit = useMemo(
    () =>
      entries
        .filter(
          (entry) => entry.type === "debit"
        )
        .reduce(
          (sum, entry) =>
            sum + Number(entry.amount || 0),
          0
        ),
    [entries]
  );

  const totalCredit = useMemo(
    () =>
      entries
        .filter(
          (entry) => entry.type === "credit"
        )
        .reduce(
          (sum, entry) =>
            sum + Number(entry.amount || 0),
          0
        ),
    [entries]
  );

  async function handlePaymentSubmit(
    event
  ) {
    event.preventDefault();

    setError("");

    const amount = Number(paymentAmount);

    if (!selectedCustomerId) {
      setError(
        "Please select a customer first."
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid payment amount."
      );
      return;
    }

    if (
      outstanding > 0 &&
      amount > outstanding
    ) {
      setError(
        "Payment cannot be greater than the outstanding amount."
      );
      return;
    }

    try {
      setSubmittingPayment(true);

      await addPayment({
        customerId: selectedCustomerId,
        amount,
        paymentMode,
        description:
          paymentDescription.trim() ||
          "Payment received",
      });

      setPaymentAmount("");
      setPaymentDescription("");
      setPaymentMode("UPI");
      setShowPaymentModal(false);

      await loadLedger(
        selectedCustomerId
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to add payment."
      );
    } finally {
      setSubmittingPayment(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Accounts
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Customer Ledger
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track customer debits, payments and
            outstanding balances.
          </p>
        </div>

        <button
          type="button"
          disabled={
            !selectedCustomerId ||
            outstanding <= 0
          }
          onClick={() =>
            setShowPaymentModal(true)
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} />
          Add Payment
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Customer selector */}
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <UserRound size={17} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-black">
                Select Customer
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                View the complete ledger for a
                customer.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700">
              Customer
            </label>

            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(event) =>
                  setSelectedCustomerId(
                    event.target.value
                  )
                }
                disabled={loadingCustomers}
                className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 pr-9 text-xs text-black outline-none transition focus:border-gray-400 focus:bg-white disabled:opacity-50"
              >
                <option value="">
                  Select a customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={getId(customer)}
                    value={getId(customer)}
                  >
                    {getCustomerName(customer)}
                    {customer?.phone
                      ? ` · ${customer.phone}`
                      : ""}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {selectedCustomer && (
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-500">
                  <UserRound size={15} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-black">
                    {getCustomerName(
                      selectedCustomer
                    )}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-gray-400">
                    {selectedCustomer.phone ||
                      "No phone"}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] text-gray-400">
                    Credit Limit
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-gray-700">
                    {formatCurrency(
                      selectedCustomer.creditLimit
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] text-gray-400">
                    Credit Days
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-gray-700">
                    {selectedCustomer.creditDays ??
                      0}{" "}
                    days
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Outstanding
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              <CreditCard size={14} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-black">
            {formatCurrency(outstanding)}
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            Debit − credit
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Total Debit
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <ArrowUpRight size={14} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-black">
            {formatCurrency(totalDebit)}
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            Orders / charges
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Total Credit
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <ArrowDownLeft size={14} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight text-black">
            {formatCurrency(totalCredit)}
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            Payments received
          </p>
        </div>

        <div className="rounded-xl bg-black p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Credit Terms
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
              <CalendarDays size={14} />
            </div>
          </div>

          <p className="mt-4 text-lg font-semibold tracking-tight">
            {selectedCustomer?.creditDays ??
              0}{" "}
            days
          </p>

          <p className="mt-1 text-[10px] text-gray-400">
            Credit period
          </p>
        </div>
      </div>

      {/* Ledger */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-black">
              Ledger Entries
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              All debit and credit transactions for
              this customer.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-[10px] font-medium text-gray-500">
            {entries.length}{" "}
            {entries.length === 1
              ? "entry"
              : "entries"}
          </div>
        </div>

        {loadingLedger ? (
          <div className="flex items-center justify-center py-16 text-xs text-gray-400">
            <Loader2
              size={16}
              className="mr-2 animate-spin"
            />
            Loading ledger...
          </div>
        ) : !selectedCustomerId ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <UserRound size={18} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-black">
              Select a customer
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">
              Choose a customer above to view their
              ledger transactions.
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Banknote size={18} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-black">
              No ledger entries
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">
              Transactions for this customer will
              appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Type
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Order
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Payment Mode
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Description
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {entries.map((entry) => {
                    const isDebit =
                      entry.type === "debit";

                    return (
                      <tr
                        key={getId(entry)}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
                              isDebit
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            {isDebit ? (
                              <ArrowUpRight
                                size={11}
                              />
                            ) : (
                              <ArrowDownLeft
                                size={11}
                              />
                            )}

                            {isDebit
                              ? "Debit"
                              : "Credit"}
                          </span>
                        </td>

                        <td
                          className={`px-5 py-4 text-right text-xs font-semibold ${
                            isDebit
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {isDebit
                            ? "+"
                            : "-"}
                          {formatCurrency(
                            entry.amount
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-gray-700">
                          {getOrderNumber(entry)}
                        </td>

                        <td className="px-5 py-4 text-xs text-gray-500">
                          {entry.paymentMode ||
                            "—"}
                        </td>

                        <td className="max-w-[220px] truncate px-5 py-4 text-xs text-gray-500">
                          {entry.description ||
                            "—"}
                        </td>

                        <td className="px-5 py-4 text-right text-xs text-gray-500">
                          {formatDate(
                            entry.createdAt
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
              {entries.map((entry) => {
                const isDebit =
                  entry.type === "debit";

                return (
                  <div
                    key={getId(entry)}
                    className="space-y-4 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            isDebit
                              ? "bg-red-50 text-red-500"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {isDebit ? (
                            <ArrowUpRight
                              size={15}
                            />
                          ) : (
                            <ArrowDownLeft
                              size={15}
                            />
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-black">
                            {isDebit
                              ? "Debit"
                              : "Credit"}
                          </p>

                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {formatDate(
                              entry.createdAt
                            )}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`text-sm font-semibold ${
                          isDebit
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {isDebit ? "+" : "-"}
                        {formatCurrency(
                          entry.amount
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[9px] text-gray-400">
                          Order
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-gray-700">
                          {getOrderNumber(
                            entry
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-[9px] text-gray-400">
                          Payment Mode
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-gray-700">
                          {entry.paymentMode ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-gray-400">
                        Description
                      </p>

                      <p className="mt-1 text-xs text-gray-600">
                        {entry.description ||
                          "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-black">
                  Add Payment
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Record a payment from{" "}
                  {getCustomerName(
                    selectedCustomer
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPaymentModal(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-black"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={
                handlePaymentSubmit
              }
              className="space-y-5 p-5"
            >
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] text-gray-400">
                  Current Outstanding
                </p>

                <p className="mt-1 text-lg font-semibold tracking-tight text-black">
                  {formatCurrency(
                    outstanding
                  )}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Amount
                </label>

                <div className="flex">
                  <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-xs text-gray-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={outstanding}
                    value={paymentAmount}
                    onChange={(event) =>
                      setPaymentAmount(
                        event.target.value
                      )
                    }
                    placeholder="Enter amount"
                    className="h-10 w-full rounded-r-lg border border-gray-200 bg-white px-3 text-xs text-black outline-none placeholder:text-gray-400 focus:border-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Payment Mode
                </label>

                <div className="relative">
                  <select
                    value={paymentMode}
                    onChange={(event) =>
                      setPaymentMode(
                        event.target.value
                      )
                    }
                    className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 pr-9 text-xs text-black outline-none focus:border-gray-400 focus:bg-white"
                  >
                    <option value="UPI">
                      UPI
                    </option>
                    <option value="Cash">
                      Cash
                    </option>
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Description
                </label>

                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(event) =>
                    setPaymentDescription(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Payment received"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-black outline-none placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowPaymentModal(false)
                  }
                  className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Save Payment
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

export default function LedgerPage() {
  return (
    <Suspense fallback={null}>
      <LedgerContent />
    </Suspense>
  );
}
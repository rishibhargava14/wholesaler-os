"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  ReceiptText,
  CreditCard,
  Wallet,
  Plus,
  RefreshCw,
  CalendarDays,
  IndianRupee,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";

import {
  getCustomer,
  getCustomerLedger,
  addCustomerPayment,
} from "@/lib/api/customers";
import { getCurrentCompany } from "@/lib/api/auth";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon size={14} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-gray-700">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function DetailCard({
  title,
  icon: Icon,
  children,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <Icon size={15} />
        </div>

        <h2 className="text-sm font-semibold text-black">
          {title}
        </h2>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id;

  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [outstanding, setOutstanding] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [paymentOpen, setPaymentOpen] =
    useState(false);

  const [payment, setPayment] = useState({
    amount: "",
    paymentMode: "UPI",
    description: "",
  });

  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] =
    useState("");

  async function loadData({
    silent = false,
  } = {}) {
    try {
      setError("");

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const company = getCurrentCompany();

      const [
        customerData,
        ledgerData,
      ] = await Promise.all([
        getCustomer(
          customerId,
          company?._id || company?.id
        ),
        getCustomerLedger(customerId),
      ]);

      const loadedCustomer =
        customerData?.customer ||
        customerData?.data ||
        customerData;

      const entries =
        ledgerData?.entries ||
        ledgerData?.ledger ||
        ledgerData?.data ||
        [];

      setCustomer(loadedCustomer);
      setLedger(entries);

      const calculatedOutstanding =
        entries.reduce(
          (total, entry) => {
            if (entry.type === "debit") {
              return (
                total +
                Number(entry.amount || 0)
              );
            }

            return (
              total -
              Number(entry.amount || 0)
            );
          },
          0
        );

      setOutstanding(
        ledgerData?.outstanding !== undefined
          ? Number(ledgerData.outstanding)
          : Math.max(
              0,
              calculatedOutstanding
            )
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load customer."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (customerId) {
      loadData();
    }
  }, [customerId]);

  const creditLimit = Number(
    customer?.creditLimit || 0
  );

  const creditUsage =
    creditLimit > 0
      ? Math.min(
          100,
          (outstanding / creditLimit) * 100
        )
      : 0;

  const totalDebit = useMemo(
    () =>
      ledger
        .filter(
          (entry) => entry.type === "debit"
        )
        .reduce(
          (sum, entry) =>
            sum + Number(entry.amount || 0),
          0
        ),
    [ledger]
  );

  const totalCredit = useMemo(
    () =>
      ledger
        .filter(
          (entry) => entry.type === "credit"
        )
        .reduce(
          (sum, entry) =>
            sum + Number(entry.amount || 0),
          0
        ),
    [ledger]
  );

  async function handlePayment(event) {
    event.preventDefault();

    try {
      setPaymentError("");
      setPaying(true);

      const amount = Number(payment.amount);

      if (!amount || amount <= 0) {
        throw new Error(
          "Enter a valid payment amount."
        );
      }

      if (
        creditLimit > 0 &&
        amount > outstanding
      ) {
        throw new Error(
          "Payment cannot be greater than the outstanding amount."
        );
      }

      await addCustomerPayment({
        customerId,
        amount,
        paymentMode: payment.paymentMode,
        description:
          payment.description ||
          "Payment received",
      });

      setPayment({
        amount: "",
        paymentMode: "UPI",
        description: "",
      });

      setPaymentOpen(false);

      await loadData({ silent: true });
    } catch (err) {
      setPaymentError(
        err?.message ||
          "Unable to record payment."
      );
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-44 animate-pulse rounded-2xl bg-gray-100 lg:col-span-2" />
          <div className="h-44 animate-pulse rounded-2xl bg-gray-100" />
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-5">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"
        >
          <ArrowLeft size={15} />
          Back to Customers
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {error || "Customer not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/customers"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-black"
          >
            <ArrowLeft size={17} />
          </Link>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
              Customer Details
            </p>

            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-black">
                {customer.shopName}
              </h1>

              <span
                className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                  customer.status ===
                  "active"
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {customer.status ===
                "active"
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {customer.ownerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              loadData({ silent: true })
            }
            disabled={refreshing}
            className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <Link
            href={`/orders/new?customerId=${customer._id}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <ShoppingCart size={15} />
            Create Order
          </Link>
        </div>
      </div>

      {/* Top Overview */}
      <div className="grid gap-5 lg:grid-cols-3">
        <DetailCard
          title="Customer Information"
          icon={Building2}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem
              icon={Building2}
              label="Shop"
              value={customer.shopName}
            />

            <InfoItem
              icon={Building2}
              label="Owner"
              value={customer.ownerName}
            />

            <InfoItem
              icon={Phone}
              label="Phone"
              value={customer.phone}
            />

            <InfoItem
              icon={Mail}
              label="Email"
              value={customer.email}
            />

            <InfoItem
              icon={MapPin}
              label="Address"
              value={customer.address}
            />

            <InfoItem
              icon={ReceiptText}
              label="GST Number"
              value={customer.gstNo}
            />
          </div>
        </DetailCard>

        <div className="rounded-2xl border border-gray-200 bg-black p-5 text-white shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
            Outstanding Amount
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatCurrency(outstanding)}
          </p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Credit usage
              </span>

              <span>
                {creditUsage.toFixed(0)}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${creditUsage}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-800 pt-4">
            <div>
              <p className="text-[10px] text-gray-500">
                Credit Limit
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatCurrency(creditLimit)}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-gray-500">
                Credit Days
              </p>

              <p className="mt-1 text-sm font-medium">
                {customer.creditDays || 0} days
              </p>
            </div>
          </div>

          {creditUsage >= 80 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
              <AlertTriangle size={14} />
              Customer is near the credit limit.
            </div>
          )}
        </div>
      </div>

      {/* Pricing + Summary */}
      <div className="grid gap-5 lg:grid-cols-3">
        <DetailCard
          title="Pricing & Credit"
          icon={CreditCard}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs text-gray-400">
                Price List
              </span>

              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                {customer.priceListName ||
                  customer.priceList ||
                  "—"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs text-gray-400">
                Credit Limit
              </span>

              <span className="text-sm font-semibold text-black">
                {formatCurrency(creditLimit)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs text-gray-400">
                Credit Days
              </span>

              <span className="text-sm font-medium text-gray-700">
                {customer.creditDays || 0} days
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Current Outstanding
              </span>

              <span className="text-sm font-semibold text-black">
                {formatCurrency(outstanding)}
              </span>
            </div>
          </div>
        </DetailCard>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Wallet size={17} />
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Total Debits
              </p>

              <p className="mt-1 text-xl font-semibold text-black">
                {formatCurrency(totalDebit)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <IndianRupee size={17} />
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Total Payments
              </p>

              <p className="mt-1 text-xl font-semibold text-black">
                {formatCurrency(totalCredit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <ReceiptText size={17} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-black">
                Customer Ledger
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Debit and credit history
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPaymentError("");
              setPaymentOpen(true);
            }}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-black px-3 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={14} />
            Add Payment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="bg-gray-50/80 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                <th className="px-5 py-3">
                  Date
                </th>

                <th className="px-5 py-3">
                  Type
                </th>

                <th className="px-5 py-3">
                  Amount
                </th>

                <th className="px-5 py-3">
                  Order
                </th>

                <th className="px-5 py-3">
                  Payment Mode
                </th>

                <th className="px-5 py-3">
                  Description
                </th>
              </tr>
            </thead>

            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-14 text-center"
                  >
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                      <ReceiptText size={19} />
                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-600">
                      No ledger entries
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Transactions will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                ledger.map((entry) => (
                  <tr
                    key={entry._id}
                    className="border-t border-gray-100 hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <CalendarDays
                          size={13}
                          className="text-gray-400"
                        />
                        {formatDate(
                          entry.createdAt
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${
                          entry.type === "debit"
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {entry.type === "debit"
                          ? "Debit"
                          : "Credit"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-sm font-semibold ${
                          entry.type === "debit"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {entry.type === "debit"
                          ? "+"
                          : "-"}
                        {formatCurrency(
                          entry.amount
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {entry.orderNo ? (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          {entry.orderNo}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-600">
                        {entry.paymentMode ||
                          "—"}
                      </span>
                    </td>

                    <td className="max-w-[250px] px-5 py-4">
                      <span className="block truncate text-xs text-gray-500">
                        {entry.description ||
                          "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-black">
                Add Payment
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Record a payment against this customer's
                outstanding balance.
              </p>
            </div>

            <form
              onSubmit={handlePayment}
              className="space-y-4 p-5"
            >
              {paymentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {paymentError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Amount
                </label>

                <input
                  type="number"
                  min="1"
                  value={payment.amount}
                  onChange={(e) =>
                    setPayment((current) => ({
                      ...current,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="Enter payment amount"
                  required
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-black outline-none focus:border-gray-400 focus:bg-white"
                />

                <p className="mt-1.5 text-[10px] text-gray-400">
                  Outstanding:{" "}
                  {formatCurrency(outstanding)}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Payment Mode
                </label>

                <select
                  value={payment.paymentMode}
                  onChange={(e) =>
                    setPayment((current) => ({
                      ...current,
                      paymentMode:
                        e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
                >
                  <option value="UPI">
                    UPI
                  </option>

                  <option value="Cash">
                    Cash
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Description
                </label>

                <textarea
                  rows={3}
                  value={payment.description}
                  onChange={(e) =>
                    setPayment((current) => ({
                      ...current,
                      description:
                        e.target.value,
                    }))
                  }
                  placeholder="Optional payment description"
                  className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-black outline-none focus:border-gray-400 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setPaymentOpen(false)
                  }
                  className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={paying}
                  className="h-9 rounded-lg bg-black px-4 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {paying
                    ? "Saving..."
                    : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
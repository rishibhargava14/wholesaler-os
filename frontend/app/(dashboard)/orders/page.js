"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronRight,
  FileText,
  IndianRupee,
} from "lucide-react";

import {
  getOrders,
  getOrderStats,
  updateOrderStatus,
} from "@/lib/api/orders";

import { getCurrentCompany } from "@/lib/api/auth";

const STATUS_OPTIONS = [
  "all",
  "new",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

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

function StatusBadge({ status }) {
  const config = {
    new: {
      label: "New",
      className:
        "bg-gray-100 text-gray-700",
    },
    packed: {
      label: "Packed",
      className:
        "bg-blue-50 text-blue-600",
    },
    shipped: {
      label: "Shipped",
      className:
        "bg-purple-50 text-purple-600",
    },
    delivered: {
      label: "Delivered",
      className:
        "bg-green-50 text-green-600",
    },
    cancelled: {
      label: "Cancelled",
      className:
        "bg-red-50 text-red-600",
    },
  };

  const current =
    config[status] || config.new;

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const config = {
    paid: {
      label: "Paid",
      className:
        "bg-green-50 text-green-600",
    },
    pending: {
      label: "Pending",
      className:
        "bg-yellow-50 text-yellow-600",
    },
    credit: {
      label: "Credit",
      className:
        "bg-orange-50 text-orange-600",
    },
  };

  const current =
    config[status] || {
      label: status || "—",
      className:
        "bg-gray-100 text-gray-500",
    };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <Icon
            size={17}
            strokeWidth={1.8}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold tracking-tight text-black">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-[10px] text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] = useState("");

  async function loadOrders({
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

      const companyId =
        company?._id || company?.id;

      const [ordersData, statsData] =
        await Promise.all([
          getOrders({
            companyId,
            status:
              statusFilter === "all"
                ? undefined
                : statusFilter,
          }),
          getOrderStats(companyId),
        ]);

      const loadedOrders =
        Array.isArray(ordersData)
          ? ordersData
          : ordersData?.orders ||
            ordersData?.data ||
            [];

      setOrders(loadedOrders);

      setStats(
        statsData?.stats ||
          statsData?.data ||
          statsData ||
          null
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        order.orderNo
          ?.toLowerCase()
          .includes(query) ||
        order.customerName
          ?.toLowerCase()
          .includes(query) ||
        order.phone
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [orders, search]);

  const totalOrders =
    stats?.totalOrders ??
    orders.filter(
      (order) =>
        order.status !== "cancelled"
    ).length;

  const revenue =
    stats?.revenue ??
    orders
      .filter(
        (order) =>
          order.status !== "cancelled"
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(order.grandTotal || 0),
        0
      );

  const pendingCredit =
    stats?.pendingCredit ??
    orders
      .filter(
        (order) =>
          order.paymentStatus === "credit" ||
          order.paymentStatus === "pending"
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(order.grandTotal || 0),
        0
      );

  const newOrders = orders.filter(
    (order) => order.status === "new"
  ).length;

  async function handleStatusChange(
    orderId,
    nextStatus
  ) {
    try {
      setUpdatingId(orderId);
      setError("");

      await updateOrderStatus(
        orderId,
        nextStatus
      );

      setOrders((current) =>
        current.map((order) =>
          String(order._id) ===
          String(orderId)
            ? {
                ...order,
                status: nextStatus,
              }
            : order
        )
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getNextAction(order) {
    if (order.status === "new") {
      return {
        label: "Pack",
        status: "packed",
      };
    }

    if (order.status === "packed") {
      return {
        label: "Ship",
        status: "shipped",
      };
    }

    if (order.status === "shipped") {
      return {
        label: "Deliver",
        status: "delivered",
      };
    }

    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
            Order Management
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track orders, payments, and fulfillment
            status.
          </p>
        </div>

        <Link
          href="/orders/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} />
          Create Order
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={totalOrders}
          description="Active orders"
        />

        <StatCard
          icon={IndianRupee}
          label="Revenue"
          value={formatCurrency(revenue)}
          description="From active orders"
        />

        <StatCard
          icon={Clock3}
          label="Pending Credit"
          value={formatCurrency(
            pendingCredit
          )}
          description="Credit / pending payments"
        />

        <StatCard
          icon={Package}
          label="New Orders"
          value={newOrders}
          description="Awaiting packing"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search order number, customer, phone..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map(
              (status) => {
                const active =
                  statusFilter === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setStatusFilter(status)
                    }
                    className={`h-9 rounded-lg px-3 text-xs font-medium capitalize transition ${
                      active
                        ? "bg-black text-white"
                        : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    {status === "all"
                      ? "All Orders"
                      : status}
                  </button>
                );
              }
            )}

            <button
              type="button"
              onClick={() =>
                loadOrders({
                  silent: true,
                })
              }
              disabled={refreshing}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-500 transition hover:bg-gray-50 hover:text-black disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-black">
                Order List
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                {filteredOrders.length} order
                {filteredOrders.length !== 1
                  ? "s"
                  : ""}{" "}
                shown
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-lg bg-gray-100"
                />
              )
            )}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <ShoppingCart size={20} />
            </div>

            <p className="mt-3 text-sm font-medium text-gray-600">
              No orders found
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Try changing your search or status
              filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="bg-gray-50/80 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                  <th className="px-5 py-3">
                    Order
                  </th>

                  <th className="px-5 py-3">
                    Customer
                  </th>

                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Items
                  </th>

                  <th className="px-5 py-3">
                    Total
                  </th>

                  <th className="px-5 py-3">
                    Payment
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(
                  (order) => {
                    const nextAction =
                      getNextAction(order);

                    return (
                      <tr
                        key={order._id}
                        className="border-t border-gray-100 transition hover:bg-gray-50/60"
                      >
                        {/* Order */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                              <FileText
                                size={15}
                              />
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-black">
                                {
                                  order.orderNo
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] text-gray-400">
                                {order.items
                                  ?.length ||
                                  0}{" "}
                                line item
                                {order.items
                                  ?.length !==
                                1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {
                                order.customerName
                              }
                            </p>

                            <p className="mt-0.5 text-[10px] text-gray-400">
                              {order.phone ||
                                "No phone"}
                            </p>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500">
                            {formatDate(
                              order.createdAt
                            )}
                          </span>
                        </td>

                        {/* Items */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500">
                            {order.items?.reduce(
                              (
                                total,
                                item
                              ) =>
                                total +
                                Number(
                                  item.qty ||
                                    0
                                ),
                              0
                            ) || 0}{" "}
                            units
                          </span>
                        </td>

                        {/* Total */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-black">
                            {formatCurrency(
                              order.grandTotal
                            )}
                          </span>
                        </td>

                        {/* Payment */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="text-[11px] text-gray-600">
                              {
                                order.paymentMode
                              }
                            </p>

                            <PaymentBadge
                              status={
                                order.paymentStatus
                              }
                            />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              order.status
                            }
                          />
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {nextAction && (
                              <button
                                type="button"
                                disabled={
                                  updatingId ===
                                  order._id
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    order._id,
                                    nextAction.status
                                  )
                                }
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-black px-3 text-[10px] font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updatingId ===
                                order._id ? (
                                  <RefreshCw
                                    size={12}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <ChevronRight
                                    size={12}
                                  />
                                )}

                                {
                                  nextAction.label
                                }
                              </button>
                            )}

                            {order.status ===
                              "delivered" && (
                              <button
                                type="button"
                                onClick={() =>
                                  window.print()
                                }
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[10px] font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
                              >
                                <FileText
                                  size={12}
                                />
                                Invoice
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
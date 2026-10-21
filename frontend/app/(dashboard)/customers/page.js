"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Users,
  Wallet,
  CreditCard,
  AlertTriangle,
  Eye,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
} from "lucide-react";

import { getCustomers } from "@/lib/api/customers";
import { getCurrentCompany } from "@/lib/api/auth";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  alert = false,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
            {label}
          </p>

          <p
            className={`mt-2 text-2xl font-semibold tracking-tight ${
              alert ? "text-red-600" : "text-black"
            }`}
          >
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <Icon size={17} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <tr className="animate-pulse border-t border-gray-100">
      <td className="px-5 py-4">
        <div className="h-4 w-36 rounded bg-gray-100" />
        <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="h-4 w-24 rounded bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="h-4 w-24 rounded bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="h-4 w-20 rounded bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="h-4 w-16 rounded bg-gray-100" />
      </td>

      <td className="px-5 py-4">
        <div className="h-8 w-16 rounded-lg bg-gray-100" />
      </td>
    </tr>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [priceList, setPriceList] = useState("");
  const [status, setStatus] = useState("");

  const loadCustomers = async ({
    silent = false,
  } = {}) => {
    try {
      setError("");

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const company = getCurrentCompany();

      const data = await getCustomers({
        companyId: company?._id || company?.id,
        priceList,
      });

      const list = Array.isArray(data)
        ? data
        : data?.customers ||
          data?.data ||
          [];

      setCustomers(list);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load customers."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [priceList]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.shopName
          ?.toLowerCase()
          .includes(query) ||
        customer.ownerName
          ?.toLowerCase()
          .includes(query) ||
        customer.phone
          ?.toLowerCase()
          .includes(query) ||
        customer.email
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        !status ||
        customer.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, status]);

  const stats = useMemo(() => {
    const total = customers.length;

    const active = customers.filter(
      (customer) =>
        customer.status === "active"
    ).length;

    const outstanding = customers.reduce(
      (sum, customer) =>
        sum +
        Number(
          customer.outstandingAmount || 0
        ),
      0
    );

    const nearLimit = customers.filter(
      (customer) => {
        const limit = Number(
          customer.creditLimit || 0
        );

        const outstanding = Number(
          customer.outstandingAmount || 0
        );

        return (
          limit > 0 &&
          outstanding / limit >= 0.8
        );
      }
    ).length;

    return {
      total,
      active,
      outstanding,
      nearLimit,
    };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
            Customer Management
          </p>

          <h2 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Customers
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage shops, pricing, credit limits and
            outstanding balances.
          </p>
        </div>

        <Link
          href="/customers/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} />
          Add Customer
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={stats.total}
          icon={Users}
          description="All registered shops"
        />

        <StatCard
          label="Active Customers"
          value={stats.active}
          icon={CreditCard}
          description="Currently active"
        />

        <StatCard
          label="Total Outstanding"
          value={formatCurrency(
            stats.outstanding
          )}
          icon={Wallet}
          description="Amount receivable"
        />

        <StatCard
          label="Near Credit Limit"
          value={stats.nearLimit}
          icon={AlertTriangle}
          description="80%+ credit used"
          alert={stats.nearLimit > 0}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search shop, owner, phone or email..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
            />
          </div>

          <select
            value={priceList}
            onChange={(e) =>
              setPriceList(e.target.value)
            }
            className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            <option value="">All Price Lists</option>
            <option value="pl-retail">Retail</option>
            <option value="pl-wholesale">
              Wholesale
            </option>
            <option value="pl-vip">VIP</option>
          </select>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">
              Inactive
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              loadCustomers({ silent: true })
            }
            disabled={refreshing}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
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
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Customer Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-black">
              Customer Directory
            </h3>

            <p className="mt-0.5 text-xs text-gray-400">
              {filteredCustomers.length} customer
              {filteredCustomers.length !== 1
                ? "s"
                : ""}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="bg-gray-50/80 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                <th className="px-5 py-3">
                  Customer
                </th>

                <th className="px-5 py-3">
                  Contact
                </th>

                <th className="px-5 py-3">
                  Price List
                </th>

                <th className="px-5 py-3">
                  Credit Limit
                </th>

                <th className="px-5 py-3">
                  Outstanding
                </th>

                <th className="px-5 py-3">
                  Credit Days
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
              {loading ? (
                <>
                  <CustomerSkeleton />
                  <CustomerSkeleton />
                  <CustomerSkeleton />
                  <CustomerSkeleton />
                  <CustomerSkeleton />
                </>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center"
                  >
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                      <Users size={20} />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-700">
                      No customers found
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      Try changing your filters or
                      add a new customer.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(
                  (customer) => {
                    const creditLimit =
                      Number(
                        customer.creditLimit ||
                          0
                      );

                    const outstanding =
                      Number(
                        customer.outstandingAmount ||
                          0
                      );

                    const creditUsage =
                      creditLimit > 0
                        ? outstanding /
                          creditLimit
                        : 0;

                    return (
                      <tr
                        key={customer._id}
                        className="border-t border-gray-100 transition hover:bg-gray-50/60"
                      >
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-600">
                              {getInitials(
                                customer.shopName
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-black">
                                {customer.shopName ||
                                  "Unnamed Shop"}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                {customer.ownerName ||
                                  "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Phone
                                  size={12}
                                  className="text-gray-400"
                                />
                                {customer.phone}
                              </div>
                            )}

                            {customer.email && (
                              <div className="flex max-w-[190px] items-center gap-1.5 truncate text-xs text-gray-400">
                                <Mail
                                  size={12}
                                  className="shrink-0"
                                />
                                <span className="truncate">
                                  {customer.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Price List */}
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {customer.priceListName ||
                              customer.priceList ||
                              "—"}
                          </span>
                        </td>

                        {/* Credit Limit */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-black">
                            {formatCurrency(
                              creditLimit
                            )}
                          </p>
                        </td>

                        {/* Outstanding */}
                        <td className="px-5 py-4">
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                outstanding > 0
                                  ? "text-black"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatCurrency(
                                outstanding
                              )}
                            </p>

                            {creditUsage >= 0.8 &&
                              creditLimit > 0 && (
                                <span className="mt-1 inline-flex rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                                  Near limit
                                </span>
                              )}
                          </div>
                        </td>

                        {/* Credit Days */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-600">
                            {customer.creditDays ||
                              0}{" "}
                            days
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
                              customer.status ===
                              "active"
                                ? "bg-green-50 text-green-600"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                customer.status ===
                                "active"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {customer.status ===
                            "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/customers/${customer._id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
                          >
                            <Eye size={13} />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
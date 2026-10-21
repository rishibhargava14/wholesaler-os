"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package, Users, ShoppingCart, IndianRupee, CreditCard,
  AlertTriangle, ArrowUpRight, ChevronRight, CircleCheck,
} from "lucide-react";
import { getDashboardStats } from "@/lib/api/dashboard";

const formatCurrency = (v = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const IMGS = [
  "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=280&q=85",
  "https://images.unsplash.com/photo-147497926640dd-7f66e8864cd0?w=280&q=85",
  "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=280&q=85",
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=280&q=85",
];

const statsCfg = [
  { key: "totalProducts", label: "Total Products", icon: Package, href: "/products" },
  { key: "totalCustomers", label: "Total Customers", icon: Users, href: "/customers" },
  { key: "todayOrders", label: "Today's Orders", icon: ShoppingCart, href: "/orders" },
  { key: "revenue", label: "Revenue", icon: IndianRupee },
  { key: "outstandingTotal", label: "Outstanding", icon: CreditCard, href: "/ledger" },
  { key: "creditOverdue", label: "Credit Overdue", icon: AlertTriangle, href: "/ledger" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const data = await getDashboardStats();
        if (m) setStats(data);
      } catch (e) { console.error(e); }
      finally { if (m) setLoading(false); }
    })();
    return () => { m = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="h-9 sm:h-10 w-48 sm:w-72 sk" />
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 sm:h-36 rounded-[18px] sm:rounded-[22px] sk" />)}
        </div>
      </div>
    );
  }

  const d = stats || {
    totalProducts: 0, totalCustomers: 0, todayOrders: 0, revenue: 0,
    outstandingTotal: 0, creditOverdue: 0, lowStock: [], todayOrdersList: [],
  };

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-9 min-w-0">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[18px] sm:rounded-[22px] card a-rise">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=1800&q=85" alt="" className="h-full w-full object-cover opacity-[0.18] sm:opacity-[0.2]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4f0ea] via-[#f4f0ea]/95 to-[#f4f0ea]/50 sm:to-[#f4f0ea]/35" />
        </div>
        <div className="relative p-5 sm:p-8 lg:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="max-w-lg min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] sm:tracking-[0.26em] text-orange-800/85 font-semibold mb-2 sm:mb-3 a-letter">Overview</p>
            <h2 className="text-xl sm:text-[1.85rem] lg:text-[2.15rem] font-semibold tracking-tight text-stone-900 leading-[1.15] a-up d1">
              Business at a glance
            </h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-stone-500 leading-relaxed a-up d2 max-w-md">
              Track products, customers, orders and payments — designed with care.
            </p>
          </div>
          <Link href="/orders/new" className="btn-primary inline-flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl px-5 sm:px-6 text-sm shrink-0 a-bounce d3 touch-manipulation">
            New Order <ArrowUpRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Stats — 2 col on small phones, 2 on tablet, 3 on xl */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
        {statsCfg.map((item, idx) => {
          const Icon = item.icon;
          const value = ["revenue", "outstandingTotal", "creditOverdue"].includes(item.key)
            ? formatCurrency(d[item.key]) : d[item.key] ?? 0;
          const inner = (
            <div className={`card relative overflow-hidden p-3.5 sm:p-6 group a-up d${Math.min(idx + 1, 8)} h-full`}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-[#f4f0ea] border border-[#e2dcd2] shadow-sm group-hover:border-orange-200 group-hover:bg-white group-hover:shadow-md transition-all duration-400">
                    <Icon size={16} strokeWidth={1.7} className="text-orange-800 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  {item.href && <ArrowUpRight size={14} className="text-stone-300 group-hover:text-orange-600 transition-colors duration-300 shrink-0 hidden sm:block" />}
                </div>
                <div className="mt-3 sm:mt-6">
                  <p className="text-[10px] sm:text-[11px] font-medium text-stone-500 tracking-wide leading-tight">{item.label}</p>
                  <p className="mt-1 sm:mt-1.5 text-base sm:text-[1.7rem] font-semibold tracking-tight text-stone-900 tabular-nums break-all sm:break-normal">{value}</p>
                </div>
              </div>
            </div>
          );
          return item.href ? <Link key={item.key} href={item.href} className="min-w-0">{inner}</Link> : <div key={item.key} className="min-w-0">{inner}</div>;
        })}
      </div>

      {/* Secondary grid */}
      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-3 min-w-0">
        {/* Low Stock */}
        <section className="card xl:col-span-1 a-up d3 overflow-hidden min-w-0">
          <div className="flex items-center justify-between border-b border-[#ece7df] px-4 sm:px-6 py-4 sm:py-5 gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight text-stone-900">Low Stock</h3>
              <p className="mt-0.5 text-[11px] text-stone-500">Needs attention</p>
            </div>
            <Link href="/products" className="flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-stone-500 hover:text-orange-700 hover:bg-orange-50 transition-all shrink-0">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-[#ece7df]">
            {d.lowStock?.length ? d.lowStock.slice(0, 4).map((p, i) => (
              <Link key={p.id || p._id} href="/products"
                className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 transition-all duration-300 hover:bg-orange-50/50 group min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl overflow-hidden border border-[#e2dcd2] zoom shadow-sm">
                    <img src={IMGS[i % IMGS.length]} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-[13px] font-medium text-stone-900 group-hover:text-orange-900 transition-colors">{p.name}</p>
                    <p className="mt-0.5 text-[10px] text-stone-400 tracking-wide truncate">SKU · {p.sku}</p>
                  </div>
                </div>
                <span className="inline-flex rounded-lg bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 border border-red-100/80 tabular-nums shrink-0">
                  {p.stock} {p.unit}
                </span>
              </Link>
            )) : (
              <div className="flex flex-col items-center py-12 sm:py-14 text-center px-4">
                <CircleCheck size={22} className="text-emerald-600 mb-2.5" />
                <p className="text-xs text-stone-500">All stock levels healthy</p>
              </div>
            )}
          </div>
        </section>

        {/* Orders — table on md+, cards on mobile */}
        <section className="card xl:col-span-2 a-up d4 overflow-hidden min-w-0">
          <div className="flex items-center justify-between border-b border-[#ece7df] px-4 sm:px-6 py-4 sm:py-5 gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight text-stone-900">Today&apos;s Orders</h3>
              <p className="mt-0.5 text-[11px] text-stone-500">Latest activity</p>
            </div>
            <Link href="/orders" className="flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-stone-500 hover:text-orange-700 hover:bg-orange-50 transition-all shrink-0">
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {d.todayOrdersList?.length ? (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-[#ece7df]">
                {d.todayOrdersList.slice(0, 5).map((o) => (
                  <div key={o.id || o._id} className="px-4 py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-stone-900 tabular-nums">#{o.orderNo || o.orderNumber || o.id}</span>
                      <span className="inline-flex rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-800 border border-orange-100/80 capitalize">
                        {o.status || "new"}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 truncate">{o.customerName || o.shopName || "—"}</p>
                    <p className="text-sm font-semibold text-stone-900 tabular-nums">{formatCurrency(o.grandTotal || o.total || o.amount)}</p>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[#ece7df] text-[10px] uppercase tracking-[0.14em] text-stone-400">
                      <th className="px-6 py-3.5 font-semibold">Order</th>
                      <th className="px-6 py-3.5 font-semibold">Customer</th>
                      <th className="px-6 py-3.5 font-semibold">Amount</th>
                      <th className="px-6 py-3.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece7df]">
                    {d.todayOrdersList.slice(0, 5).map((o) => (
                      <tr key={o.id || o._id} className="hover:bg-orange-50/35 transition-colors duration-200">
                        <td className="px-6 py-4 text-[13px] font-medium text-stone-900 tabular-nums">#{o.orderNo || o.orderNumber || o.id}</td>
                        <td className="px-6 py-4 text-[13px] text-stone-600">{o.customerName || o.shopName || "—"}</td>
                        <td className="px-6 py-4 text-[13px] font-semibold text-stone-900 tabular-nums">{formatCurrency(o.grandTotal || o.total || o.amount)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-800 border border-orange-100/80 capitalize tracking-wide">
                            {o.status || "new"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-12 sm:py-16 text-center px-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden mb-3 sm:mb-4 zoom shadow-md border border-[#e2dcd2]">
                <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=200&q=80" alt="" className="h-full w-full object-cover" />
              </div>
              <p className="text-xs text-stone-500">No orders yet today</p>
            </div>
          )}
        </section>
      </div>

      {/* CTA band */}
      <div className="card relative overflow-hidden p-0 a-up d5 min-w-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-[38%] md:w-[40%] h-40 sm:h-auto sm:min-h-[200px] relative zoom">
            <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&q=85" alt="" className="h-full w-full object-cover absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/5" />
          </div>
          <div className="flex-1 p-5 sm:p-8 lg:p-10 flex flex-col justify-center min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-orange-800/85 font-semibold mb-1.5 sm:mb-2">Quick action</p>
            <h3 className="text-base sm:text-xl font-semibold tracking-tight text-stone-900">Ready to place a new order?</h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-md leading-relaxed">
              Create orders, update stock or manage customers in one elegant workspace.
            </p>
            <Link href="/orders/new" className="btn-primary mt-5 sm:mt-7 inline-flex h-11 w-full sm:w-fit items-center justify-center gap-2 rounded-xl px-5 text-sm touch-manipulation">
              Create Order <ArrowUpRight size={15} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

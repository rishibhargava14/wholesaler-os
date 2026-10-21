"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Users, ShoppingCart, Tags,
  BookOpen, Boxes, Settings, LogOut, ChevronRight, Store, X,
} from "lucide-react";
import { logout } from "@/lib/api/auth";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Price Lists", href: "/pricelists", icon: Tags },
  { label: "Ledger", href: "/ledger", icon: BookOpen },
  { label: "Stock", href: "/stock", icon: Boxes },
];
const secondary = [{ label: "Settings", href: "/settings", icon: Settings }];

export default function Sidebar({ mobileOpen, onClose }) {
  const pathname = usePathname();
  const isActive = (h) => (h === "/dashboard" ? pathname === h : pathname.startsWith(h));

  return (
    <>
      {mobileOpen && (
        <button type="button" aria-label="Close menu" onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md lg:hidden a-fade" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(288px,88vw)] max-w-[288px] flex-col nav-dark transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />

        <div className="flex h-[72px] sm:h-[84px] items-center justify-between border-b border-white/[0.06] px-4 sm:px-6">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 group min-w-0">
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-700 shadow-lg shadow-orange-950/50 transition-all duration-500 group-hover:scale-105">
              <Store size={17} strokeWidth={1.9} className="text-white relative z-10" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-[15px] font-semibold tracking-tight text-white truncate">Wholesaler OS</p>
              <p className="text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.2em] sm:tracking-[0.24em] text-amber-400/85 mt-0.5">Premium Platform</p>
            </div>
          </Link>
          <button type="button" aria-label="Close" onClick={onClose}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-5 sm:py-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">Workspace</p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={onClose}
                  className={`group relative flex h-11 items-center justify-between rounded-xl px-3 sm:px-3.5 text-[13px] sm:text-[13.5px] transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-r from-amber-500/18 to-orange-500/5 text-amber-100 border border-amber-500/25"
                      : "text-stone-400 hover:bg-white/[0.045] hover:text-stone-100 border border-transparent"
                  }`}>
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />}
                  <span className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <Icon size={17} strokeWidth={1.75} className={`shrink-0 ${active ? "text-amber-400" : "text-stone-500 group-hover:text-stone-300 transition-colors"}`} />
                    <span className="font-medium tracking-tight truncate">{item.label}</span>
                  </span>
                  {active && <ChevronRight size={14} className="text-amber-400/80 shrink-0" />}
                </Link>
              );
            })}
          </nav>
          <p className="mb-3 mt-10 sm:mt-12 px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500">Account</p>
          <nav className="space-y-1">
            {secondary.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={onClose}
                  className={`group flex h-11 items-center gap-2.5 sm:gap-3 rounded-xl px-3 sm:px-3.5 text-[13px] sm:text-[13.5px] transition-all duration-300 ${
                    active ? "bg-amber-500/12 text-amber-100 border border-amber-500/20" : "text-stone-400 hover:bg-white/[0.045] hover:text-stone-100 border border-transparent"
                  }`}>
                  <Icon size={17} strokeWidth={1.75} className={active ? "text-amber-400" : "text-stone-500 group-hover:text-stone-300"} />
                  <span className="font-medium tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/[0.06] p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => { logout(); window.location.href = "/login"; }}
            className="flex w-full h-11 items-center gap-3 rounded-xl px-3.5 text-[13.5px] text-stone-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300">
            <LogOut size={17} strokeWidth={1.75} />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

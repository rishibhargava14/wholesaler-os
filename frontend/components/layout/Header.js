"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Bell, Search } from "lucide-react";
import { getInitials, getPageTitle } from "@/lib/utils";
import { getCurrentUser, getCurrentCompany } from "@/lib/api/auth";

export default function Header({ onMenuClick }) {
  const pathname = usePathname();
  const currentPage = getPageTitle(pathname);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  useEffect(() => { setUser(getCurrentUser()); setCompany(getCurrentCompany()); }, []);
  const userName = user?.name || company?.name || "Admin";
  const initials = getInitials(user?.name || company?.name || "Admin");

  return (
    <header className="sticky top-0 z-30 h-[64px] sm:h-[76px] lg:h-[84px] border-b border-[#e2dcd2]/70 bg-[#f4f0ea]/80 backdrop-blur-2xl">
      <div className="flex h-full items-center justify-between gap-2 px-3 sm:px-5 md:px-7 lg:px-10">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
          <button type="button" aria-label="Open menu" onClick={onMenuClick}
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-[#e2dcd2] bg-white text-stone-500 shadow-sm transition-all duration-300 hover:shadow-md hover:text-stone-800 lg:hidden">
            <Menu size={18} strokeWidth={1.8} />
          </button>
          <div className="min-w-0 a-down">
            <h1 className="truncate text-sm sm:text-[15px] font-semibold tracking-tight text-stone-900">{currentPage.title}</h1>
            <p className="hidden truncate text-[11px] text-stone-500 mt-0.5 md:block">{currentPage.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <button type="button" aria-label="Search"
            className="hidden h-10 items-center gap-2.5 rounded-xl border border-[#e2dcd2] bg-white/90 px-4 text-xs text-stone-400 shadow-sm transition-all duration-300 hover:bg-white hover:text-stone-600 hover:shadow-md md:flex">
            <Search size={14} strokeWidth={1.8} />
            <span className="tracking-tight hidden lg:inline">Search anything...</span>
            <span className="tracking-tight lg:hidden">Search</span>
            <kbd className="ml-2 lg:ml-3 rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[9px] font-medium text-stone-400">⌘K</kbd>
          </button>
          <button type="button" aria-label="Search" className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2dcd2] bg-white text-stone-500 shadow-sm">
            <Search size={16} strokeWidth={1.8} />
          </button>
          <button type="button" aria-label="Notifications"
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#e2dcd2] bg-white/90 text-stone-500 shadow-sm transition-all duration-300 hover:bg-white hover:shadow-md">
            <Bell size={16} strokeWidth={1.8} />
            <span className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white a-pulse" />
          </button>
          <div className="flex h-9 sm:h-10 items-center gap-2 rounded-xl border border-[#e2dcd2] bg-white/90 pl-1 pr-1.5 sm:pl-1.5 sm:pr-3 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-700 text-[9px] sm:text-[10px] font-bold text-white shadow-sm">
              {initials}
            </div>
            <p className="hidden sm:block truncate max-w-[80px] md:max-w-[110px] text-xs font-medium tracking-tight text-stone-800">{userName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

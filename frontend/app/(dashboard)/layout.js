"use client";
import { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f4f0ea] overflow-x-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-[288px] transition-all duration-500 ease-out min-w-0">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="min-h-[calc(100vh-84px)] min-w-0 p-4 sm:p-6 md:p-7 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

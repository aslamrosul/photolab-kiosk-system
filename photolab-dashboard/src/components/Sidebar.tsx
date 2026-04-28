"use client";
import {
  LayoutDashboard,
  Monitor,
  Image as ImageIcon,
  BarChart3,
  Receipt,
  Frame,
  Ticket,
  Key,
  Layers,
  QrCode,
  Building2,
  Film,
  Settings2,
  CopyPlus
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Monitor, label: "Kiosk", href: "/kiosk" },
  { icon: ImageIcon, label: "Gallery", href: "/gallery" },
  { icon: BarChart3, label: "Statistics", href: "/statistic" },
  { icon: Receipt, label: "Transaction", href: "/transaction" },
  { icon: Frame, label: "Frame Photo", href: "/frames" },
  { icon: Film, label: "Frame GIF", href: "/frames-gif" },
  { icon: Layers, label: "Frame Category", href: "/frame-category" },
  { icon: QrCode, label: "Digital QR", href: "/digital-qr" },
  { icon: Ticket, label: "Voucher", href: "/vouchers" },
  { icon: Settings2, label: "Kiosk Engine", href: "/kiosk-config" },
  { icon: Key, label: "Payment Key", href: "/settings" },
  { icon: Building2, label: "Branch Manager", href: "/branch-manager" },
  { icon: CopyPlus, label: "Print Packages", href: "/packages" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[260px] min-w-[260px] h-screen bg-white border-r border-gray-100 flex flex-col py-6 shadow-sm overflow-y-auto">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight text-gray-900">Photolab</span>
          <p className="text-[10px] text-gray-400 font-medium -mt-0.5">Dashboard v2.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-[#6366f1] text-white font-semibold shadow-md shadow-indigo-200"
                : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
            >
              <item.icon size={19} className={isActive ? "text-white" : "group-hover:text-indigo-600"} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mx-4 mt-auto p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-800">Admin Lab</span>
            <span className="text-[10px] text-indigo-400 font-medium">admin@photolab.id</span>
          </div>
        </div>
      </div>
    </div>
  );
}
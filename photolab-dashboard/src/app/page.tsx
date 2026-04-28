"use client";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { Camera, LayoutDashboard, LogIn, Zap, BarChart3, Settings } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const features = [
    { icon: <Camera size={22} />, title: "Photo Kiosk", desc: "Aplikasi kiosk untuk capture foto, filter, dan frame langsung dari booth." },
    { icon: <BarChart3 size={22} />, title: "Statistik & Transaksi", desc: "Pantau penjualan, transaksi, dan performa bisnis secara real-time." },
    { icon: <Settings size={22} />, title: "Manajemen Lengkap", desc: "Kelola cabang, paket, frame, voucher, dan konfigurasi kiosk dengan mudah." },
    { icon: <Zap size={22} />, title: "Payment Gateway", desc: "Integrasi Midtrans untuk pembayaran yang cepat dan aman." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
            <Camera size={18} color="white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">Photolab</span>
        </div>

        {loading ? null : user ? (
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 bg-[#6366f1] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#4f46e5] transition-all shadow-md shadow-indigo-200"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 bg-[#6366f1] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#4f46e5] transition-all shadow-md shadow-indigo-200"
          >
            <LogIn size={16} />
            Login
          </button>
        )}
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Zap size={13} />
          Photo Booth Management System
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          Kelola Photo Booth<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">
            Lebih Mudah & Efisien
          </span>
        </h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          Platform all-in-one untuk mengelola kiosk foto, transaksi, frame, paket, dan laporan bisnis photo booth Anda.
        </p>
        <div className="flex items-center justify-center gap-4">
          {!loading && (
            user ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 bg-[#6366f1] text-white px-7 py-3.5 rounded-xl font-bold hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-200"
              >
                <LayoutDashboard size={18} />
                Buka Dashboard
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 bg-[#6366f1] text-white px-7 py-3.5 rounded-xl font-bold hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-200"
              >
                <LogIn size={18} />
                Mulai Sekarang
              </button>
            )
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              {f.icon}
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm">{f.title}</h3>
            <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 pb-8">
        Photolab Dashboard v2.0 · Powered by Supabase & Midtrans
      </footer>
    </div>
  );
}

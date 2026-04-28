"use client";
import { Settings, Bell, User, LogOut, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { signOut, supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/kiosk": "Kiosk Management",
  "/gallery": "Cloud Gallery",
  "/statistic": "Statistics",
  "/transaction": "Transactions",
  "/frames": "Frame Photo",
  "/frames-gif": "Frame GIF",
  "/frame-category": "Frame Category",
  "/digital-qr": "Digital QR",
  "/vouchers": "Vouchers",
  "/settings": "Payment Key",
  "/kiosk-config": "Kiosk Engine",
  "/branch-manager": "Branch Manager",
  "/account": "Account",
};

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const title = pageTitles[pathname] || "Dashboard";
  
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch recent transactions as notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, amount, created_at, kiosk_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setNotifications(data.map(t => ({
          id: t.id,
          message: `New transaction Rp ${t.amount.toLocaleString()}`,
          time: new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          read: false,
        })));
      }
    };
    fetchNotifications();

    // Supabase Realtime subscription for new transactions
    const channel = supabase
      .channel('transactions-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        const t = payload.new as any;
        setNotifications(prev => [{
          id: t.id,
          message: `New transaction Rp ${t.amount?.toLocaleString()}`,
          time: 'Just now',
          read: false,
        }, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const userEmail = user?.email || "Admin";
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Page Title */}
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                <button onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                  className="text-xs text-indigo-600 font-medium hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-gray-400 text-sm">No notifications</p>
                ) : notifications.map(n => (
                  <div key={n.id} className={`p-3 border-b border-gray-50 last:border-0 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
                    <div>
                      <p className="text-sm text-gray-700">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Link */}
        <Link href="/settings" className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <Settings size={20} />
        </Link>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 mx-1"></div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="flex items-center gap-3 bg-[#6366f1] text-white pl-2 pr-4 py-1.5 rounded-xl hover:bg-[#4f46e5] transition-colors shadow-sm"
          >
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm">
              {userInitial}
            </div>
            <span className="text-sm font-semibold max-w-[120px] truncate">{userEmail}</span>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-slide-up overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">{userEmail}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
              <div className="p-1.5">
                <Link href="/account" onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                  <User size={16} className="text-gray-400" /> Account Settings
                </Link>
                <Link href="/settings" onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                  <Settings size={16} className="text-gray-400" /> Payment Key
                </Link>
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 transition-colors">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

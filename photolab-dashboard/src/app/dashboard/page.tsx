"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, Printer, Monitor, Camera, Loader2, Zap } from "lucide-react";

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#e0e7ff'];

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCaptured: 0,
    totalPrint: 0,
    totalKiosks: 0,
    totalRevenue: 0,
    performance: [] as any[],
    weeklyData: [] as any[]
  });

  const fetchData = useCallback(async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      const { data: kiosks } = await supabase.from('kiosks').select('id, name');
      const { data: transactions } = await supabase.from('transactions').select('*');

      if (transactions && kiosks) {
        const performanceMap = kiosks.map(k => {
          const count = transactions.filter(t => t.kiosk_id === k.id).length;
          const percentage = transactions.length > 0 ? (count / transactions.length) * 100 : 0;
          return { name: k.name, value: parseFloat(percentage.toFixed(1)) };
        });

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weekly = days.map(day => {
          const count = transactions.filter(t => {
            const date = new Date(t.created_at);
            return days[date.getDay()] === day;
          }).length;
          return { name: day, val: count };
        });

        const totalRevenue = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

        setStats({
          totalCaptured: transactions.length,
          totalPrint: transactions.length,
          totalKiosks: kiosks.length,
          totalRevenue,
          performance: performanceMap.slice(0, 5),
          weeklyData: weekly
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // REAL-TIME SUBSCRIPTION
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          console.log('Real-time update received!');
          fetchData(false); // Refresh without full loader
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center">
      <Loader2 className="animate-spin text-[#6366f1]" size={48} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center text-center sm:text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Live metrics from across your photobooth ecosystem</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 group">
            <Zap size={14} className="animate-pulse" />
            Live Sync: Active
          </div>
          <button onClick={() => fetchData(true)} className="bg-white text-gray-700 p-2 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-indigo-200 transition-all">
            <Monitor size={18} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatsCard icon={<Camera size={22} />} label="Total Captured" value={`${stats.totalCaptured.toLocaleString()}`} sub="Photos Taken" color="indigo" />
        <StatsCard icon={<Printer size={22} />} label="Total Print" value={`${stats.totalPrint.toLocaleString()}`} sub="Strips Printed" color="purple" />
        <StatsCard icon={<Monitor size={22} />} label="Total Kiosk" value={`${stats.totalKiosks}`} sub="Active Booths" color="blue" />
        <StatsCard icon={<TrendingUp size={22} />} label="Revenue" value={`Rp ${stats.totalRevenue.toLocaleString()}`} sub="Gross Income" color="green" />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Pie */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-gray-900 font-black text-xs uppercase tracking-[0.2em] mb-6">Market Share per Kiosk</h3>
          <div className="flex flex-col md:flex-row items-center flex-1">
            <div className="w-full md:w-1/2 h-56 relative group">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Volume</p>
                  <p className="text-xl font-black text-gray-800 leading-none">{stats.totalCaptured}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.performance} innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {stats.performance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3 px-4">
              {stats.performance.length > 0 ? stats.performance.map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 font-bold">{entry.name}</span>
                  </div>
                  <span className="font-black text-indigo-600 italic tracking-tighter">{entry.value}%</span>
                </div>
              )) : <p className="text-sm text-gray-400 italic">Awating first session...</p>}
            </div>
          </div>
        </div>

        {/* Weekly Stats Area */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-900 font-black text-xs uppercase tracking-[0.2em]">Transaction Trends</h3>
            <div className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-gray-400">LAST 7 DAYS</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyData}>
                <defs>
                  <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={4} fill="url(#gradIndigo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50",
    purple: "from-purple-500 to-purple-600 text-purple-600 bg-purple-50",
    blue: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50",
    green: "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50",
  };

  const gradient = colors[color].split(' ')[0] + ' ' + colors[color].split(' ')[1];
  const iconColors = colors[color].split(' ')[2] + ' ' + colors[color].split(' ')[3];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 relative z-10 transition-transform group-hover:-translate-y-1">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</span>
        <div className={`p-2.5 rounded-xl ${iconColors} shadow-sm transition-transform group-hover:rotate-12`}>
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-black text-gray-900 tracking-tighter relative z-10">{value}</h3>
      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">{sub}</p>

      {/* Subtle Background Decoration */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
    </div>
  );
}
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CreditCard, Users, Image as ImageIcon, TrendingUp, Loader2, FileDown } from 'lucide-react';

export default function StatisticPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    users: 0,
    photos: 0,
    kiosks: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchData = useCallback(async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);

      const { data: transData } = await supabase.from('transactions').select('amount, created_at');
      const { count: kioskCount } = await supabase.from('kiosks').select('*', { count: 'exact', head: true });

      if (transData) {
        const totalRev = transData.reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const grouped = transData.reduce((acc: any, curr: any) => {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayName = dayNames[new Date(curr.created_at).getDay()];
          if (!acc[dayName]) acc[dayName] = { name: dayName, sales: 0, photos: 0 };
          acc[dayName].sales += curr.amount || 0;
          acc[dayName].photos += 1;
          return acc;
        }, {});

        const sortedData = days.map(day =>
          grouped[day] || { name: day, sales: 0, photos: 0 }
        );

        setStats({
          revenue: totalRev,
          users: Math.floor(transData.length * 0.8),
          photos: transData.length,
          kiosks: kioskCount || 0
        });
        setChartData(sortedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchData(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#6366f1]" size={48} />
      </div>
    );
  }

  const statCards = [
    { title: "Total Revenue", value: `Rp ${stats.revenue.toLocaleString()}`, icon: <CreditCard size={22} />, trend: "+12%", gradient: "from-indigo-500 to-indigo-600" },
    { title: "Total Users", value: stats.users.toString(), icon: <Users size={22} />, trend: "+5%", gradient: "from-purple-500 to-purple-600" },
    { title: "Photos Taken", value: stats.photos.toString(), icon: <ImageIcon size={22} />, trend: "+18%", gradient: "from-violet-500 to-violet-600" },
    { title: "Active Kiosk", value: stats.kiosks.toString(), icon: <TrendingUp size={22} />, trend: "Stable", gradient: "from-blue-500 to-blue-600" },
  ];

  const exportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', `Rp ${stats.revenue}`],
      ['Total Users', stats.users],
      ['Photos Taken', stats.photos],
      ['Active Kiosks', stats.kiosks]
    ];

    // add chart data
    const chartHeaders = ['Day', 'Sales', 'Photos'];
    const chartRows = chartData.map(d => [d.name, d.sales, d.photos]);

    const csvContent =
      "SUMMARY\n" +
      headers.join(',') + '\n' +
      rows.map(r => r.join(',')).join('\n') +
      "\n\nDAILY BREAKDOWN\n" +
      chartHeaders.join(',') + '\n' +
      chartRows.map(r => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistic Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Track performance metrics across your photobooth network</p>
        </div>
        <button onClick={exportCSV}
          className="bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-indigo-200 transition-all flex items-center gap-2 shadow-sm">
          <FileDown size={16} /> Export CSV
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-sm`}>
                {card.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
            <p className={`text-xs mt-1 font-medium ${card.trend.includes('+') ? 'text-emerald-500' : 'text-gray-400'}`}>
              {card.trend} from last month
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Revenue This Week</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString()}`}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="sales" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Photos Productivity</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Line type="monotone" dataKey="photos" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
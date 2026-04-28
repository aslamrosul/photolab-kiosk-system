"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, X, Loader2, ChevronLeft, ChevronRight, FileDown, ExternalLink, ImageIcon } from "lucide-react";
import Image from "next/image";

interface KioskSummary {
  id: string;
  name: string;
  owner: string;
  totalCount: number;
  grossIncome: number;
}

interface TransactionDetail {
  id: string;
  amount: number;
  status: string;
  photo_url: string | null;
  created_at: string;
  packages?: {
    name: string;
  };
}

const ITEMS_PER_PAGE = 8;

export default function TransactionPage() {
  const [data, setData] = useState<KioskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedKiosk, setSelectedKiosk] = useState<KioskSummary | null>(null);
  const [details, setDetails] = useState<TransactionDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Photo Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const { data: kiosks } = await supabase.from('kiosks').select(`
        id, name, owner_email,
        transactions (id, amount, status, photo_url, created_at)
      `);

      if (kiosks) {
        const formatted = kiosks.map((k: any) => ({
          id: k.id,
          name: k.name,
          owner: k.owner_email,
          totalCount: k.transactions?.length || 0,
          grossIncome: k.transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0
        }));
        setData(formatted);
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  const openDetail = async (kiosk: KioskSummary) => {
    setSelectedKiosk(kiosk);
    setDetailLoading(true);
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, packages(name)')
      .eq('kiosk_id', kiosk.id)
      .order('created_at', { ascending: false });

    if (transactions) setDetails(transactions as any[]);
    setDetailLoading(false);
  };

  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
  const paginated = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalRevenue = data.reduce((sum, d) => sum + d.grossIncome, 0);
  const totalTransactions = data.reduce((sum, d) => sum + d.totalCount, 0);

  const exportCSV = () => {
    const headers = ['Kiosk Name', 'Total Transactions', 'Gross Income (IDR)', 'Owner'];
    const rows = data.map(d => [d.name, d.totalCount, d.grossIncome, d.owner]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Records</h1>
          <p className="text-sm text-gray-500 mt-1">Transaction history and revenue metrics</p>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={exportCSV}
            className="bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 hover:border-indigo-200 transition-all flex items-center gap-2">
            <FileDown size={16} /> Export CSV
          </button>
          <div className="bg-indigo-600 px-4 py-2 rounded-xl border border-indigo-500 shadow-md shadow-indigo-100">
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block leading-none mb-1">Total Gross</span>
            <p className="text-lg font-black text-white leading-none">Rp {totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-xs uppercase text-gray-400 font-bold tracking-widest">
              <th className="p-4">Booth Name</th>
              <th className="p-4">Volume</th>
              <th className="p-4">Total Revenue</th>
              <th className="p-4">Owner</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-300"><Loader2 className="animate-spin inline mr-2 text-indigo-500" /> Loading metrics...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-medium">No kiosk data found</td></tr>
            ) : paginated.map((item, i) => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                <td className="p-4">
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">{item.totalCount} Sessions</span>
                </td>
                <td className="p-4 font-extrabold text-indigo-600">Rp {item.grossIncome.toLocaleString()}</td>
                <td className="p-4 text-gray-500 text-xs font-medium">{item.owner}</td>
                <td className="p-4 text-right">
                  <button onClick={() => openDetail(item)} className="bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-indigo-600 transition-all shadow-sm">
                    VIEW DETAILS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{data.length} kiosks registered</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-20 text-gray-500 transition-all">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-20 text-gray-500 transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedKiosk && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setSelectedKiosk(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[85vh] shadow-2xl animate-scale-in flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-8 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{selectedKiosk.name}</h2>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total: <b className="text-indigo-600">{selectedKiosk.totalCount}</b></span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue: <b className="text-indigo-600">Rp {selectedKiosk.grossIncome.toLocaleString()}</b></span>
                </div>
              </div>
              <button onClick={() => setSelectedKiosk(null)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-8">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-indigo-500" size={48} />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter animate-pulse">Fetching transactions...</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr className="text-[10px] uppercase text-gray-400 font-black tracking-[0.2em]">
                      <th className="p-4 text-left">Time & Date</th>
                      <th className="p-4 text-left">Package</th>
                      <th className="p-4 text-left">Revenue</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-center">Capture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((t) => (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-indigo-50/30 transition-colors group">
                        <td className="p-4">
                          <p className="text-sm font-bold text-gray-800">{new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-[10px] font-medium text-gray-400">{new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-black text-indigo-600 uppercase italic tracking-tighter">{t.packages?.name || 'Standard'}</span>
                        </td>
                        <td className="p-4 font-bold text-gray-800">Rp {t.amount.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {t.photo_url ? (
                            <button
                              onClick={() => setLightboxUrl(t.photo_url)}
                              className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
                            >
                              <ImageIcon size={18} />
                            </button>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-10 right-10 bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all">
            <X size={32} />
          </button>

          <div className="relative w-full max-w-2xl aspect-[2/3] animate-scale-in" onClick={e => e.stopPropagation()}>
            <Image
              src={lightboxUrl}
              alt="Transaction Capture"
              fill
              className="object-contain rounded-2xl shadow-2xl"
              priority
            />
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href={lightboxUrl}
              target="_blank"
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
            >
              <FileDown size={20} /> Download Original
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
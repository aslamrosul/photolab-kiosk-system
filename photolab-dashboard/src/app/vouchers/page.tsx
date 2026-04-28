"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket, Plus, Trash2, Loader2, X } from "lucide-react";

interface Voucher {
  id: string;
  code: string;
  discount_amount: number;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

export default function VoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_amount: 5000
  });

  const fetchVouchers = async () => {
    setLoading(true);
    const { data } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false });
    if (data) setVouchers(data as Voucher[]);
    setLoading(false);
  };

  useEffect(() => { fetchVouchers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('vouchers').insert([formData]);
    if (!error) {
      setIsModalOpen(false);
      setFormData({ code: "", discount_amount: 5000 });
      fetchVouchers();
    }
  };

  const deleteVoucher = async (id: string) => {
    if (!confirm("Delete this voucher?")) return;
    await supabase.from('vouchers').delete().eq('id', id);
    fetchVouchers();
  };

  const activeCount = vouchers.filter(v => !v.is_used).length;
  const usedCount = vouchers.filter(v => v.is_used).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Vouchers</h1>
          <p className="text-sm text-gray-500 mt-1">{activeCount} active · {usedCount} used</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#6366f1] text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-[#4f46e5] transition-all shadow-md shadow-indigo-200 font-semibold text-sm">
          <Plus size={18} /> Generate Voucher
        </button>
      </div>

      {/* Generate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">New Voucher</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Voucher Code (optional)</label>
                <input type="text"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm font-mono uppercase"
                  placeholder="Auto-generated if empty"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Amount (IDR)</label>
                <input type="number"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <button type="submit"
                className="w-full bg-[#6366f1] text-white py-3 rounded-xl font-bold hover:bg-[#4f46e5] transition-all shadow-md shadow-indigo-200 text-sm">
                Generate Voucher
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
      ) : vouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Ticket size={48} className="text-gray-300 mb-3" />
          <p className="text-gray-400 font-medium">No vouchers yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((v) => (
            <div key={v.id} className={`bg-white p-5 rounded-2xl border-2 shadow-sm flex items-center justify-between transition-all hover:shadow-md ${v.is_used ? 'opacity-60 grayscale border-gray-200' : 'border-indigo-100 hover:border-indigo-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${v.is_used ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-600'}`}>
                  <Ticket size={22} />
                </div>
                <div>
                  <h3 className="text-base font-mono font-bold text-gray-800">{v.code}</h3>
                  <p className="text-xs text-gray-500">Disc: Rp {v.discount_amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(v.created_at).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${v.is_used ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                    {v.is_used ? 'USED' : 'ACTIVE'}
                  </span>
                  {v.is_used && v.used_at && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(v.used_at).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
                {!v.is_used && (
                  <button onClick={() => deleteVoucher(v.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
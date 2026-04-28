"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Loader2, Plus, X, Trash2, Search, ChevronLeft, ChevronRight, Building2, MapPin } from "lucide-react";

interface Kiosk {
  id: string;
  name: string;
  total_frames: number;
  license_key: string;
  price_per_print: number;
  owner_email: string;
  branch_id: string | null;
  orientation: string;
  last_seen: string | null;
  allowed_frames?: string[];
  branch?: {
    name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

interface FrameCompact {
  id: string;
  name: string;
  type: string;
}

const ITEMS_PER_PAGE = 8;

export default function KioskPage() {
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [framesList, setFramesList] = useState<FrameCompact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingKiosk, setEditingKiosk] = useState<Kiosk | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price_per_print: 35000,
    owner_email: "",
    total_frames: 0,
    branch_id: "",
    orientation: "landscape",
    allowed_frames: [] as string[]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: kiosksData }, { data: branchesData }, { data: framesData }, { count: frameCount }] = await Promise.all([
        supabase.from('kiosks').select('*, branch:branches(name)').order('created_at', { ascending: false }),
        supabase.from('branches').select('id, name'),
        supabase.from('frames').select('id, name, type'),
        supabase.from('frames').select('id', { count: 'exact', head: true })
      ]);

      // Auto-update total_frames on each kiosk with real frame count
      if (kiosksData && frameCount !== null) {
        const enriched = kiosksData.map((k: any) => ({ ...k, total_frames: frameCount }));
        setKiosks(enriched as any[]);
      } else if (kiosksData) {
        setKiosks(kiosksData as any[]);
      }
      if (branchesData) setBranches(branchesData as Branch[]);
      if (framesData) setFramesList(framesData as FrameCompact[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = kiosks.filter(k =>
    k.name.toLowerCase().includes(search.toLowerCase()) ||
    k.owner_email?.toLowerCase().includes(search.toLowerCase()) ||
    k.branch?.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openAddModal = () => {
    setEditingKiosk(null);
    setFormData({ name: "", price_per_print: 35000, owner_email: "", total_frames: 0, branch_id: "", orientation: "landscape", allowed_frames: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (kiosk: Kiosk) => {
    setEditingKiosk(kiosk);
    setFormData({
      name: kiosk.name,
      price_per_print: kiosk.price_per_print,
      owner_email: kiosk.owner_email || "",
      total_frames: kiosk.total_frames,
      branch_id: kiosk.branch_id || "",
      orientation: kiosk.orientation || "landscape",
      allowed_frames: kiosk.allowed_frames || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      price_per_print: formData.price_per_print,
      owner_email: formData.owner_email,
      total_frames: formData.total_frames,
      branch_id: formData.branch_id || null,
      orientation: formData.orientation,
      allowed_frames: formData.allowed_frames
    };

    try {
      if (editingKiosk) {
        const { error } = await supabase.from('kiosks').update(payload).eq('id', editingKiosk.id);
        if (error) {
          console.error('Update error:', error);
          alert(`Failed to update: ${error.message}`);
          return;
        }
      } else {
        const licenseKey = "LCS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase.from('kiosks').insert([{ ...payload, license_key: licenseKey }]);
        if (error) {
          console.error('Insert error:', error);
          alert(`Failed to add kiosk: ${error.message}\n\nPlease run schema.sql in Supabase SQL Editor to set up tables and disable RLS.`);
          return;
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Unexpected error:', err);
      alert(`Unexpected error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (kiosk: Kiosk) => {
    if (!confirm(`Delete kiosk "${kiosk.name}"?`)) return;
    await supabase.from('kiosks').delete().eq('id', kiosk.id);
    fetchData();
  };

  return (
    <div className="relative space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kiosk Pool</h1>
          <p className="text-sm text-gray-500 mt-1">{kiosks.length} machines in network</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or branch..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 w-72 bg-white"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button onClick={openAddModal} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-md transition-all text-sm">
            <Plus size={18} /> Add Machine
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[10px] uppercase text-gray-400 font-black tracking-widest">
              <th className="p-4">Machine Details</th>
              <th className="p-4">Branch Location</th>
              <th className="p-4">License Key</th>
              <th className="p-4">Config Summary</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-300"><Loader2 className="animate-spin inline mr-2" /> Loading list...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-medium">No machines found</td></tr>
            ) : paginated.map((k) => (
              <tr key={k.id} className="border-b last:border-0 hover:bg-indigo-50/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const isOnline = k.last_seen && (new Date().getTime() - new Date(k.last_seen).getTime() < 60000);
                      return (
                        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}
                          title={isOnline ? "Online" : "Offline"}></div>
                      );
                    })()}
                    <p className="font-bold text-gray-800">{k.name}</p>
                  </div>
                  <p className="text-xs text-gray-400 ml-4.5">{k.owner_email}</p>
                </td>
                <td className="p-4">
                  {k.branch ? (
                    <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                      <Building2 size={14} /> {k.branch.name}
                    </span>
                  ) : (
                    <span className="text-gray-300 italic text-xs">Unassigned</span>
                  )}
                </td>
                <td className="p-4 font-mono text-[10px] text-gray-400 bg-gray-50/50">{k.license_key}</td>
                <td className="p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">{k.total_frames} Frames</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold">Rp {k.price_per_print.toLocaleString()}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase">{k.orientation || 'landscape'}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEditModal(k)} className="p-2 hover:bg-white rounded-lg text-indigo-600 border border-transparent hover:border-gray-200 transition-all">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(k)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-scale-in space-y-5">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-gray-900">{editingKiosk ? "Edit Machine" : "Register Machine"}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Machine Label</label>
                <input required type="text"
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-bold"
                  placeholder="Ex: Main Lobby Booth"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Assign to Branch</label>
                <select
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-bold"
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                >
                  <option value="">Select a Branch...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Allowed Frames (Leave empty for all)</label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50 flex flex-col gap-2">
                  {framesList.map(f => (
                    <label key={f.id} className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.allowed_frames.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, allowed_frames: [...formData.allowed_frames, f.id] });
                          } else {
                            setFormData({ ...formData, allowed_frames: formData.allowed_frames.filter(id => id !== f.id) });
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                      />
                      {f.name} <span className="text-[10px] text-gray-400 font-normal px-1 bg-white border border-gray-200 rounded">{f.type}</span>
                    </label>
                  ))}
                  {framesList.length === 0 && <span className="text-xs text-gray-400 italic p-2">No frames available.</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Frames</label>
                  <input required type="number"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold"
                    value={formData.total_frames}
                    onChange={(e) => setFormData({ ...formData, total_frames: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Base Price</label>
                  <input required type="number"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold"
                    value={formData.price_per_print}
                    onChange={(e) => setFormData({ ...formData, price_per_print: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Display Orientation</label>
                <select
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-bold"
                  value={formData.orientation}
                  onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
                >
                  <option value="landscape">Landscape (Horizontal)</option>
                  <option value="portrait">Portrait (Vertical)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Technical PIC Email</label>
                <input required type="email"
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold"
                  placeholder="admin@branch.com"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                />
              </div>
            </div>

            <button disabled={isSubmitting} type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 disabled:bg-gray-300 mt-4"
            >
              {isSubmitting ? "Updating Network..." : (editingKiosk ? "Save Configuration" : "Deploy Machine")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
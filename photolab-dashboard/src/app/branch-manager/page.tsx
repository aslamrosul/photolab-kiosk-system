"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MapPin, Users, Building2, Loader2, Plus, X, Pencil, Trash2, Monitor } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  location: string;
  staff_name: string;
  created_at: string;
  _count_kiosks?: number;
}

export default function BranchManagerPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    staff_name: ""
  });

  const fetchBranches = async () => {
    setLoading(true);
    const { data: branchesData } = await supabase.from('branches').select('*').order('created_at', { ascending: false });
    const { data: kiosksData } = await supabase.from('kiosks').select('branch_id');

    if (branchesData) {
      const merged = branchesData.map(b => ({
        ...b,
        _count_kiosks: kiosksData?.filter(k => k.branch_id === b.id).length || 0
      }));
      setBranches(merged as Branch[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBranches(); }, []);

  const openAddModal = () => {
    setEditingBranch(null);
    setFormData({ name: "", location: "", staff_name: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location || "",
      staff_name: branch.staff_name || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingBranch) {
      const { error } = await supabase.from('branches').update(formData).eq('id', editingBranch.id);
      if (!error) {
        setIsModalOpen(false);
        fetchBranches();
      }
    } else {
      const { error } = await supabase.from('branches').insert([formData]);
      if (!error) {
        setIsModalOpen(false);
        setFormData({ name: "", location: "", staff_name: "" });
        fetchBranches();
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`Delete branch "${branch.name}"?`)) return;
    await supabase.from('branches').delete().eq('id', branch.id);
    fetchBranches();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Network</h1>
          <p className="text-sm text-gray-500 mt-1">Manage physical locations and local staff</p>
        </div>
        <button onClick={openAddModal}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md transition-all text-sm uppercase tracking-widest">
          <Plus size={18} /> Add Branch
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <Building2 size={48} className="text-gray-200 mb-3" />
          <p className="text-gray-400 font-bold">No branches registered</p>
          <p className="text-gray-300 text-sm">Organize your kiosks by location</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white p-6 border border-gray-100 rounded-[2rem] hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all shadow-sm group overflow-hidden relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {branch.name.charAt(0)}
                </div>
                <div className="flex gap-1 z-10">
                  <button onClick={() => openEditModal(branch)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(branch)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-lg text-gray-900 leading-tight">{branch.name}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1.5"><MapPin size={12} /> {branch.location}</p>
                </div>

                <div className="h-px bg-gray-50 w-full"></div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Assigned PIC</span>
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Users size={14} className="text-indigo-500" /> {branch.staff_name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Machine Units</span>
                    <span className="text-sm font-black text-indigo-600 flex items-center gap-1.5"><Monitor size={14} /> {branch._count_kiosks}</span>
                  </div>
                </div>
              </div>

              {/* Decorative BG */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{editingBranch ? "Edit Branch" : "Add New Branch"}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Branch Name</label>
                <input required type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all text-sm font-bold"
                  placeholder="EX: Grand Indonesia"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Detailed Address</label>
                <input required type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all text-sm font-bold"
                  placeholder="Floor 3, East Mall"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">PIC / Branch Head</label>
                <input required type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all text-sm font-bold"
                  placeholder="Staff Name"
                  value={formData.staff_name}
                  onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
                />
              </div>
              <button disabled={isSubmitting} type="submit"
                className="w-full bg-slate-900 text-white py-4 mt-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 disabled:bg-gray-300">
                {isSubmitting ? "Saving Discovery..." : (editingBranch ? "Update Branch" : "Establish Branch")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FolderPlus, Trash2, Loader2, Pencil, X, Check, Layers } from "lucide-react";

interface Category {
  id: string;
  name: string;
  created_at: string;
  frameCount?: number;
}

export default function FrameCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('frame_categories').select('*').order('name');
    const { data: frameData } = await supabase.from('frames').select('category_id');

    if (catData) {
      const enriched = catData.map(cat => ({
        ...cat,
        frameCount: frameData?.filter(f => f.category_id === cat.id).length || 0
      }));
      setCategories(enriched as Category[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const { error } = await supabase.from('frame_categories').insert([{ name: newCat.trim() }]);
    if (error) alert(error.message);
    else {
      setNewCat("");
      fetchCategories();
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    const { error } = await supabase.from('frame_categories').update({ name: editName.trim() }).eq('id', editingId);
    if (error) alert(error.message);
    else {
      setEditingId(null);
      setEditName("");
      fetchCategories();
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    await supabase.from('frame_categories').delete().eq('id', id);
    fetchCategories();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingId) saveEdit();
      else addCategory();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Frame Category</h1>
        <p className="text-sm text-gray-500 mt-1">Organize your frames into categories</p>
      </div>

      {/* Add Input */}
      <div className="flex gap-3 max-w-lg">
        <input
          type="text"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New category name..."
          className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm transition-all"
        />
        <button onClick={addCategory} className="bg-[#6366f1] text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-[#4f46e5] transition-all shadow-md shadow-indigo-200 font-semibold text-sm">
          <FolderPlus size={18} /> Add
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Layers size={48} className="text-gray-300 mb-3" />
          <p className="text-gray-400 font-medium">No categories yet</p>
          <p className="text-gray-300 text-sm">Create your first category above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white p-4 border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
              {editingId === cat.id ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 p-2 border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Layers size={18} className="text-indigo-500" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{cat.name}</span>
                      <p className="text-xs text-gray-400">{cat.frameCount} frames</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(cat)} className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteCategory(cat.id, cat.name)} className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
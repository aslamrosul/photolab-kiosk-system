"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Loader2, Film, Pencil, X } from "lucide-react";
import Image from "next/image";

interface GifFrame {
    id: string;
    name: string;
    image_url: string;
    type: string;
    category_id?: string;
    category?: { name: string };
    layout_config?: any[];
    required_photos?: number;
}

interface Category {
    id: string;
    name: string;
}

export default function FrameGifPage() {
    const [frames, setFrames] = useState<GifFrame[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingFrame, setEditingFrame] = useState<GifFrame | null>(null);

    const fetchGifFrames = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("frames")
            .select("*, category:frame_categories(name)")
            .eq("type", "GIF")
            .order("created_at", { ascending: false });
        if (data) setFrames(data as any[]);
        setLoading(false);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('frame_categories').select('*').order('name');
        if (data) setCategories(data as Category[]);
    };

    useEffect(() => { fetchGifFrames(); fetchCategories(); }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `gif-${Date.now()}.${fileExt}`;
            const filePath = `frame-assets/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('frames')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('frames').getPublicUrl(filePath);

            // Open Layout Designer for the new frame
            setEditingFrame({
                id: '',
                name: file.name.replace(/\.[^/.]+$/, ""),
                image_url: publicUrl,
                type: "GIF",
                category_id: selectedCategoryId || undefined,
                layout_config: [
                    { id: 1, x: 10, y: 10, w: 80, h: 25 },
                    { id: 2, x: 10, y: 37, w: 80, h: 25 },
                    { id: 3, x: 10, y: 64, w: 80, h: 25 }
                ],
                required_photos: 3
            });
        } catch (error: any) {
            console.error("Upload Error:", error);
            alert(`Error: ${error.message || "Something went wrong"}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (frame: GifFrame) => {
        if (!confirm(`Delete GIF frame "${frame.name}"?`)) return;
        try {
            const urlParts = frame.image_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `frame-assets/${fileName}`;

            await supabase.storage.from('frames').remove([filePath]);
            await supabase.from('frames').delete().eq('id', frame.id);
            fetchGifFrames();
        } catch (error: any) {
            alert(`Failed to delete: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Frame GIF</h1>
                    <p className="text-sm text-gray-500 mt-1">{frames.length} animated frames uploaded</p>
                </div>
                <div className="flex gap-3 items-center">
                    <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white font-medium">
                        <option value="">No Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <label className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-200 font-semibold text-sm">
                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        <span>{uploading ? "Uploading..." : "Upload GIF Frame"}</span>
                        <input type="file" className="hidden" accept="image/gif,image/png" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Layout Designer Modal */}
            {editingFrame && (
                <GifLayoutDesigner
                    frame={editingFrame}
                    categories={categories}
                    onClose={() => {
                        setEditingFrame(null);
                        fetchGifFrames();
                    }}
                />
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            ) : frames.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="p-4 bg-purple-100 text-purple-600 rounded-full mb-4">
                        <Film size={40} />
                    </div>
                    <p className="text-gray-500 font-semibold text-lg">No GIF Frames Yet</p>
                    <p className="text-gray-400 text-sm mt-1">Upload GIF overlays for boomerang and animation mode</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {frames.map((frame) => (
                        <div key={frame.id} className="bg-white rounded-2xl border border-gray-100 p-3 group relative shadow-sm hover:shadow-md transition-all">
                            <div className="relative mb-3 bg-gray-50 flex items-center justify-center rounded-xl border border-gray-100 overflow-hidden">
                                <div className="relative w-full">
                                    <img
                                        src={frame.image_url}
                                        alt={frame.name}
                                        className="w-full h-auto z-0 block"
                                    />

                                    {/* Mini Layout Preview */}
                                    <div className="absolute inset-0 z-10 pointer-events-none">
                                        {Array.isArray(frame.layout_config) && frame.layout_config.map((slot: any, index: number) => (
                                            <div
                                                key={index}
                                                className="absolute bg-black border border-white/10"
                                                style={{
                                                    left: `${slot.x}%`,
                                                    top: `${slot.y}%`,
                                                    width: `${slot.w}%`,
                                                    height: `${slot.h}%`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="absolute top-2 right-2 z-30">
                                    <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">GIF</span>
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                                    <button onClick={() => setEditingFrame(frame)}
                                        className="bg-indigo-500 text-white p-2.5 rounded-xl hover:bg-indigo-600 shadow-lg transition-all transform scale-90 group-hover:scale-100">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(frame)}
                                        className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 shadow-lg transition-all transform scale-90 group-hover:scale-100">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-sm truncate text-gray-800">{frame.name}</h3>
                            <div className="flex gap-1.5 mt-1">
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg font-medium">Animated</span>
                                {frame.required_photos && frame.required_photos > 0 && (
                                    <span className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-lg font-medium">{frame.required_photos} slots</span>
                                )}
                                {frame.category && (
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg font-medium">{frame.category.name}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================
// GIF Layout Designer (same as Frame Photo's)
// ============================================
function GifLayoutDesigner({ frame, categories, onClose }: { frame: GifFrame, categories: Category[], onClose: () => void }) {
    const [slots, setSlots] = useState<any[]>(frame.layout_config || []);
    const [saving, setSaving] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(frame.category_id || '');
    const [frameName, setFrameName] = useState(frame.name);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const getRelativePosition = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = getRelativePosition(e);
        setIsDrawing(true);
        setStartPos(pos);
        setCurrentRect(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const pos = getRelativePosition(e);
        setCurrentRect({
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            w: Math.abs(pos.x - startPos.x),
            h: Math.abs(pos.y - startPos.y)
        });
    };

    const handleMouseUp = () => {
        if (currentRect && currentRect.w > 2 && currentRect.h > 2) {
            setSlots([...slots, { id: slots.length + 1, ...currentRect }]);
        }
        setIsDrawing(false);
        setCurrentRect(null);
    };

    const removeSlot = (index: number) => {
        setSlots(slots.filter((_, i) => i !== index).map((s, i) => ({ ...s, id: i + 1 })));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const selectedCat = categories.find(c => c.id === selectedCategoryId);

            if (frame.id) {
                const { error } = await supabase.from('frames').update({
                    name: frameName,
                    category_id: selectedCategoryId || null,
                    type: 'GIF',
                    layout_config: slots,
                    required_photos: slots.length
                }).eq('id', frame.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('frames').insert([{
                    name: frameName,
                    image_url: frame.image_url,
                    type: 'GIF',
                    category_id: selectedCategoryId || null,
                    layout_config: slots,
                    required_photos: slots.length
                }]);
                if (error) throw error;
            }
            onClose();
        } catch (err: any) {
            alert(`Save failed: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
            <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-none">GIF Layout Designer</h2>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium tracking-wide flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                            Drag on the frame to create photo slots • {slots.length} shots required
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-100 text-gray-400 hover:text-gray-900 text-xs flex items-center gap-1.5 font-bold uppercase tracking-widest">
                        <X size={16} /> Close
                    </button>
                </div>

                {/* Frame Name + Category */}
                <div className="px-6 py-4 border-b border-gray-100 flex gap-4 bg-white">
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Frame Name</label>
                        <input type="text" value={frameName} onChange={(e) => setFrameName(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" />
                    </div>
                    <div className="w-48">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</label>
                        <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                            <option value="">No Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-50 shadow-inner">
                    <div className="relative group shadow-2xl rounded-sm overflow-hidden" style={{ height: '70vh', aspectRatio: '2/3' }}>
                        <img src={frame.image_url} className="absolute inset-0 w-full h-full object-fill" alt="GIF Frame" />
                        <div
                            ref={containerRef}
                            className="absolute inset-0 cursor-crosshair z-10"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        >
                            {slots.map((slot, i) => (
                                <div key={i} className="absolute bg-black flex items-center justify-center group/slot shadow-lg"
                                    style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}>
                                    <span className="text-[10px] font-black text-indigo-600 bg-white/80 px-1.5 py-0.5 rounded">{slot.id}</span>
                                    <button onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:bg-red-600">
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {currentRect && (
                                <div className="absolute border-2 border-purple-500 bg-purple-500/20"
                                    style={{ left: `${currentRect.x}%`, top: `${currentRect.y}%`, width: `${currentRect.w}%`, height: `${currentRect.h}%` }} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                        <button onClick={() => setSlots([])} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors uppercase tracking-widest">
                            Clear All
                        </button>
                    </div>
                    <button onClick={handleSave} disabled={saving}
                        className="bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2">
                        {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : `Save Layout (${slots.length} slots)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
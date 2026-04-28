"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Loader2, ImageIcon, Layout, Save, X, Check } from "lucide-react";
import Image from "next/image";

interface Frame {
    id: string;
    name: string;
    image_url: string;
    type: string;
    category_id?: string;
    layout_config?: any;
    required_photos?: number;
}

interface Category {
    id: string;
    name: string;
}

export default function FramePage() {
    const [frames, setFrames] = useState<Frame[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [uploading, setUploading] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const [editingFrame, setEditingFrame] = useState<Frame | null>(null);

    const fetchFrames = async () => {
        const { data } = await supabase.from("frames").select("*").order("created_at", { ascending: false });
        if (data) setFrames(data as Frame[]);
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from("frame_categories").select("*").order("name");
        if (data) setCategories(data as Category[]);
    };

    useEffect(() => { fetchFrames(); fetchCategories(); }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `frame-assets/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('frames')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('frames').getPublicUrl(filePath);

            // Find category_id from selected filter
            const selectedCat = categories.find(c => c.name === filterType);

            // Open Designer with temporary frame (no id means it's new)
            setEditingFrame({
                id: '', // Empty ID signifies a new frame record needed
                name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for default name
                image_url: publicUrl,
                type: filterType !== "all" ? filterType : (categories[0]?.name || "Standard"),
                category_id: selectedCat?.id || categories[0]?.id || undefined,
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
            // Clear input so same file can be selected again if needed
            e.target.value = '';
        }
    };

    const handleDelete = async (frame: Frame) => {
        if (!confirm(`Delete frame "${frame.name}"?`)) return;

        try {
            const urlParts = frame.image_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `frame-assets/${fileName}`;

            const { error: storageError } = await supabase.storage.from('frames').remove([filePath]);
            if (storageError) console.warn("Storage removal warning:", storageError);

            const { error: dbError } = await supabase.from('frames').delete().eq('id', frame.id);
            if (dbError) throw dbError;

            fetchFrames();
        } catch (error: any) {
            console.error(error);
            alert(`Failed to delete: ${error.message}`);
        }
    };

    const filtered = filterType === "all" ? frames : frames.filter(f => f.type === filterType || f.category_id === filterType);
    const uniqueTypes = [...new Set(frames.map(f => f.type))];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Frame Photo</h1>
                    <p className="text-sm text-gray-500 mt-1">{frames.length} frames uploaded</p>
                </div>
                <div className="flex gap-3">
                    {/* Filter by Category */}
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white font-medium">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        {uniqueTypes.filter(t => !categories.some(c => c.name === t)).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {/* Upload */}
                    <label className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-200 font-semibold text-sm">
                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        <span>{uploading ? "Uploading..." : "Upload Frame"}</span>
                        <input type="file" className="hidden" accept="image/png" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Layout Designer Modal Integration */}
            {editingFrame && (
                <LayoutDesigner
                    frame={editingFrame}
                    categories={categories}
                    onClose={() => {
                        setEditingFrame(null);
                        fetchFrames();
                    }}
                />
            )}

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <ImageIcon size={48} className="text-gray-300 mb-3" />
                    <p className="text-gray-400 font-medium">No frames uploaded yet</p>
                    <p className="text-gray-300 text-sm">Upload PNG frames to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {filtered.map((frame) => (
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
                                                className="absolute bg-black border border-white/5"
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
                            </div>

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                                <button
                                    onClick={() => setEditingFrame(frame)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-xl transition-all transform scale-90 group-hover:scale-100 flex items-center gap-2 font-bold text-xs"
                                >
                                    <Layout size={14} /> Design Layout
                                </button>
                                <button
                                    onClick={() => handleDelete(frame)}
                                    className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 shadow-lg transition-all transform scale-90 group-hover:scale-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <h3 className="font-semibold text-sm truncate text-gray-800">{frame.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg font-medium">{frame.type}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{frame.required_photos || 0} Slots</span>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    );
}

function LayoutDesigner({ frame, categories, onClose }: { frame: Frame, categories: Category[], onClose: () => void }) {
    const [slots, setSlots] = useState<any[]>(frame.layout_config || []);
    const [saving, setSaving] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(frame.category_id || categories[0]?.id || '');
    const [frameName, setFrameName] = useState(frame.name);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setStartPos({ x, y });
        setIsDrawing(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;

        let w = Math.abs(x - startPos.x);
        let h = Math.abs(y - startPos.y);

        // Aspect Ratio Locking (Shift Key) - Lock to 1:1 if Shift is pressed
        if (e.shiftKey) {
            // Use the smaller dimension to maintain 1:1
            const side = Math.min(w, h * (rect.height / rect.width));
            const sideInY = side * (rect.width / rect.height);

            w = side;
            h = sideInY;

            // Re-calculate x and y based on which direction we're dragging
            x = x < startPos.x ? startPos.x - w : startPos.x + w;
            y = y < startPos.y ? startPos.y - h : startPos.y + h;
        }

        setCurrentRect({
            x: Math.min(x, startPos.x),
            y: Math.min(y, startPos.y),
            w: w,
            h: h
        });
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentRect && currentRect.w > 1 && currentRect.h > 1) {
            setSlots([...slots, { ...currentRect, id: Date.now() }]);
        }
        setCurrentRect(null);
    };

    const removeSlot = (id: number) => {
        setSlots(slots.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        if (slots.length === 0) {
            alert("Please add at least one photo slot");
            return;
        }

        try {
            setSaving(true);

            const selectedCat = categories.find(c => c.id === selectedCategoryId);

            if (frame.id) {
                // Update existing frame
                const { error } = await supabase.from('frames').update({
                    name: frameName,
                    category_id: selectedCategoryId || null,
                    type: selectedCat?.name || frame.type,
                    layout_config: slots,
                    required_photos: slots.length
                }).eq('id', frame.id);

                if (error) throw error;
            } else {
                // Insert new frame record
                const { error } = await supabase.from('frames').insert([{
                    name: frameName,
                    image_url: frame.image_url,
                    type: selectedCat?.name || frame.type,
                    category_id: selectedCategoryId || null,
                    layout_config: slots,
                    required_photos: slots.length
                }]);

                if (error) throw error;
            }

            onClose();
        } catch (err: any) {
            console.error("Save Error:", err);
            alert(`Failed to save layout: ${err.message || "Database error"}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-none">Layout Designer</h2>
                        <p className="text-xs text-gray-500 mt-1.5 font-medium tracking-wide flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
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

                {/* Editor Body */}
                <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-50 shadow-inner">
                    <div className="relative group shadow-2xl rounded-sm overflow-hidden flex items-center justify-center p-0" style={{ height: '70vh', aspectRatio: '2/3' }}>
                        <div className="relative w-full h-full bg-white/50">
                            {/* The Actual Frame Image */}
                            <img
                                src={frame.image_url}
                                className="absolute inset-0 w-full h-full object-fill z-0"
                                draggable={false}
                                alt="Frame"
                            />

                            {/* Drawing Layer */}
                            <div
                                ref={containerRef}
                                className="absolute inset-0 cursor-crosshair z-20"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                            >
                                {/* Existing Slots */}
                                {slots.map((slot, i) => (
                                    <div
                                        key={slot.id}
                                        className="absolute bg-black group/slot flex items-center justify-center shadow-lg"
                                        style={{
                                            left: `${slot.x}%`,
                                            top: `${slot.y}%`,
                                            width: `${slot.w}%`,
                                            height: `${slot.h}%`
                                        }}
                                    >
                                        <div className="bg-indigo-600 text-white text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center shadow-lg border border-indigo-400">
                                            {i + 1}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeSlot(slot.id); }}
                                            className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/slot:opacity-100 transition-all hover:scale-110 shadow-lg"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                {/* Current Rectangle (While Drawing) */}
                                {currentRect && (
                                    <div
                                        className="absolute border-2 border-dashed border-indigo-400 bg-indigo-400/10"
                                        style={{
                                            left: `${currentRect.x}%`,
                                            top: `${currentRect.y}%`,
                                            width: `${currentRect.w}%`,
                                            height: `${currentRect.h}%`
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setSlots([])}
                            className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-1.5 p-2"
                        >
                            <Trash2 size={14} /> Clear All
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {frame.id ? "Save Layout" : "Create Frame"}
                    </button>
                </div>
            </div>
        </div>
    );
}
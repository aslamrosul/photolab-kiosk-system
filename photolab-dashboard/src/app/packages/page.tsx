"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CopyPlus, Plus, Pencil, Trash2, Loader2, X, CheckCircle } from "lucide-react";

interface Package {
    id: string;
    name: string;
    print_amount: number;
    price: number;
    is_active: boolean;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        print_amount: 2,
        price: 25000,
        is_active: true
    });

    const fetchPackages = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('packages')
            .select('*')
            .order('price', { ascending: true });
        if (data) setPackages(data as Package[]);
        setLoading(false);
    };

    useEffect(() => { fetchPackages(); }, []);

    const openAddModal = () => {
        setEditingPackage(null);
        setFormData({ name: "", print_amount: 2, price: 25000, is_active: true });
        setShowModal(true);
    };

    const openEditModal = (pkg: Package) => {
        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            print_amount: pkg.print_amount,
            price: pkg.price,
            is_active: pkg.is_active
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingPackage) {
                const { error } = await supabase.from('packages').update(formData).eq('id', editingPackage.id);
                if (error) {
                    console.error('Update error:', error);
                    alert(`Failed to update: ${error.message}`);
                    return;
                }
            } else {
                const { error } = await supabase.from('packages').insert([formData]);
                if (error) {
                    console.error('Insert error:', error);
                    alert(`Failed to create package: ${error.message}\n\nPlease run schema.sql in Supabase SQL Editor to set up tables and disable RLS.`);
                    return;
                }
            }
            setShowModal(false);
            fetchPackages();
        } catch (err: any) {
            console.error('Unexpected error:', err);
            alert(`Unexpected error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deletePackage = async (id: string) => {
        if (!confirm("Delete this package? This will affect all kiosks.")) return;
        await supabase.from('packages').delete().eq('id', id);
        fetchPackages();
    };

    const toggleStatus = async (pkg: Package) => {
        await supabase.from('packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
        fetchPackages();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Print Packages</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage print counts and pricing for all kiosks</p>
                </div>
                <button onClick={openAddModal} className="bg-indigo-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 font-semibold text-sm">
                    <Plus size={18} /> Add Package
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className={`bg-white p-6 rounded-2xl border ${pkg.is_active ? 'border-gray-100 shadow-sm' : 'border-gray-200 bg-gray-50 opacity-70'} transition-all relative group`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${pkg.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                                    <CopyPlus size={24} />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEditModal(pkg)} className="p-2 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-lg transition-colors">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => deletePackage(pkg.id)} className="p-2 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{pkg.print_amount} Physical Strips</p>

                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 mb-6">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price</span>
                                <span className="text-lg font-black text-indigo-600">Rp {pkg.price.toLocaleString()}</span>
                            </div>

                            <button
                                onClick={() => toggleStatus(pkg)}
                                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${pkg.is_active
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                    : 'bg-gray-200 text-gray-600 border border-gray-300 hover:bg-gray-300'}`}
                            >
                                {pkg.is_active ? <><CheckCircle size={16} /> Active on Kiosk</> : 'Disabled'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-gray-900">{editingPackage ? 'Edit Package' : 'New Package'}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                                <X size={22} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Package Name</label>
                                <input required type="text"
                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
                                    placeholder="Ex: Standard Strip"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Print Count</label>
                                    <input required type="number"
                                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
                                        value={formData.print_amount}
                                        onChange={(e) => setFormData({ ...formData, print_amount: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (IDR)</label>
                                    <input required type="number"
                                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input type="checkbox" id="is_active"
                                    className="w-5 h-5 accent-indigo-600"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">Display on Kiosks</label>
                            </div>
                        </div>

                        <button disabled={isSubmitting} type="submit"
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:bg-gray-300 shadow-md shadow-indigo-200 text-sm mt-4"
                        >
                            {isSubmitting ? 'Saving...' : (editingPackage ? 'Update Package' : 'Create Package')}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

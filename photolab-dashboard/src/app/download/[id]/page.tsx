"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Download, Film, Camera, ImageIcon, Loader2, PlaySquare, Images } from "lucide-react";
import Image from "next/image";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Transaction {
    id: string;
    photo_url: string;
    original_urls?: string[];
    gif_url?: string;
    video_url?: string;
    created_at: string;
    amount: number;
    kiosks?: { name: string; branch?: { name: string } };
}

export default function DownloadPage() {
    const params = useParams();
    const transactionId = params.id as string;
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchTransaction() {
            if (!transactionId) {
                setError("No transaction ID provided.");
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from("transactions")
                .select("id, photo_url, original_urls, gif_url, video_url, created_at, amount, kiosks(name, branch:branches(name))")
                .eq("id", transactionId)
                .single();

            if (fetchError || !data) {
                setError("Transaction not found or has expired.");
            } else {
                setTransaction(data as any);
            }
            setLoading(false);
        }
        fetchTransaction();
    }, [transactionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                    <p className="text-white font-bold text-lg animate-pulse">Loading your memories...</p>
                </div>
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ImageIcon size={40} className="text-red-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3">Not Found</h1>
                    <p className="text-slate-400 text-lg">{error || "This download link may have expired."}</p>
                </div>
            </div>
        );
    }

    const createdDate = new Date(transaction.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const branchName = transaction.kiosks?.branch?.name || "";
    const locationText = branchName ? `${branchName} • ${transaction.kiosks?.name}` : transaction.kiosks?.name || "Photobooth";

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">

            {/* Hero Header */}
            <div className="relative pt-20 pb-16 px-6 text-center overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-indigo-300 mb-6">
                        Your Session is Ready
                    </div>
                    <h1 className="text-5xl md:text-7xl font-[900] tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        snapmanner
                    </h1>
                    <p className="text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
                        Download your photos, GIFs, and videos before they expire.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 bg-black/20 px-6 py-3 rounded-2xl backdrop-blur-xl">
                        <Camera size={16} />
                        <span>{createdDate}</span>
                        <span className="mx-2">•</span>
                        <span>{locationText}</span>
                    </div>
                </div>
            </div>

            {/* Content grid */}
            <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

                {/* 1. Printed Strip (Picture) */}
                {transaction.photo_url && (
                    <section className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-8 md:p-12">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="w-full md:w-1/2 flex flex-col items-start text-left">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                                    <ImageIcon size={28} />
                                </div>
                                <h2 className="text-3xl font-extrabold mb-3">Photo Strip</h2>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    Your physical print, beautifully framed and ready to share on your feed.
                                </p>
                                <a
                                    href={transaction.photo_url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 shadow-xl shadow-indigo-600/20"
                                >
                                    <Download size={20} /> Download Image
                                </a>
                            </div>
                            <div className="w-full md:w-1/2 flex justify-center">
                                <div className="relative w-64 md:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 rotate-1 hover:rotate-0 transition-transform duration-500">
                                    <img
                                        src={transaction.photo_url}
                                        alt="Photo Strip"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. Original Images */}
                {transaction.original_urls && transaction.original_urls.length > 0 && (
                    <section className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-8 md:p-12">
                        <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
                            <div className="w-full md:w-1/2 flex flex-col items-start text-left">
                                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-6">
                                    <Images size={28} />
                                </div>
                                <h2 className="text-3xl font-extrabold mb-3">Original Photos</h2>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    Every single shot you took, in full high resolution without any frames or watermarks.
                                </p>
                                <button
                                    onClick={() => {
                                        transaction.original_urls?.forEach(url => window.open(url, '_blank'));
                                    }}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 shadow-xl shadow-fuchsia-600/20"
                                >
                                    <Download size={20} /> Download All {transaction.original_urls.length}
                                </button>
                            </div>
                            <div className="w-full md:w-1/2 flex justify-center">
                                <div className="grid grid-cols-2 gap-3 -rotate-2 hover:rotate-0 transition-transform duration-500">
                                    {transaction.original_urls.slice(0, 4).map((url, i) => (
                                        <img key={i} src={url} alt={`Original ${i + 1}`} className="w-32 h-32 object-cover rounded-xl border-2 border-white/10" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. GIF */}
                {transaction.gif_url && (
                    <section className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-8 md:p-12">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="w-full md:w-1/2 flex flex-col items-start text-left">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                                    <PlaySquare size={28} />
                                </div>
                                <h2 className="text-3xl font-extrabold mb-3">Animated GIF</h2>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    A fun, looping animation of all your captured moments together. Perfect for Instagram Stories.
                                </p>
                                <a
                                    href={transaction.gif_url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 shadow-xl shadow-emerald-600/20"
                                >
                                    <Download size={20} /> Download GIF
                                </a>
                            </div>
                            <div className="w-full md:w-1/2 flex justify-center">
                                <div className="relative w-64 md:w-72 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <img
                                        src={transaction.gif_url}
                                        alt="Animated GIF"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">GIF</div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 4. Boomerang Video */}
                {transaction.video_url && (
                    <section className="bg-slate-900/50 rounded-[2.5rem] border border-white/5 p-8 md:p-12">
                        <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
                            <div className="w-full md:w-1/2 flex flex-col items-start text-left">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-6">
                                    <Film size={28} />
                                </div>
                                <h2 className="text-3xl font-extrabold mb-3">Boomerang Video</h2>
                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                    Your full live session recorded as a high-quality looping video, fully composed in the frame.
                                </p>
                                <a
                                    href={transaction.video_url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 shadow-xl shadow-orange-600/20"
                                >
                                    <Download size={20} /> Download Video
                                </a>
                            </div>
                            <div className="w-full md:w-1/2 flex justify-center">
                                <div className="relative w-64 md:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 -rotate-1 hover:rotate-0 transition-transform duration-500">
                                    <video
                                        src={transaction.video_url}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">VIDEO</div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

            </div>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center px-6 mt-12 bg-black/40">
                <p className="text-slate-300 font-bold mb-2">Don't forget to save your files! 🤩</p>
                <p className="text-slate-500 text-sm">Your files will be automatically erased in 30 days.</p>
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center">
                    <span className="text-slate-600 text-xs font-black uppercase tracking-[0.2em]">POWERED BY SNAPMANNER CLOUD</span>
                </div>
            </footer>
        </div>
    );
}

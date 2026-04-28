"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Loader2, X, ImageIcon, Download, MapPin, Film, PlaySquare, Images } from "lucide-react";

interface Transaction {
  id: string;
  photo_url: string | null;
  original_urls: string[] | null;
  gif_url: string | null;
  video_url: string | null;
  created_at: string;
  kiosk_id: string;
  kiosks?: { name: string; branch?: { name: string } };
}

interface Kiosk {
  id: string;
  name: string;
  branch?: { name: string; };
}

type TabType = 'pictures' | 'originals' | 'gifs' | 'videos';

export default function GalleryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKiosk, setFilterKiosk] = useState("all");
  const [activeTab, setActiveTab] = useState<TabType>('pictures');
  const [lightbox, setLightbox] = useState<{ url: string; item: Transaction; type: TabType } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: txData }, { data: kioskData }] = await Promise.all([
        supabase.from('transactions')
          .select('id, photo_url, original_urls, gif_url, video_url, created_at, kiosk_id, kiosks(name, branch:branches(name))')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('kiosks').select('id, name, branch:branches(name)')
      ]);
      if (txData) setTransactions(txData as any[]);
      if (kioskData) setKiosks(kioskData as any[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredTx = filterKiosk === "all" ? transactions : transactions.filter(t => t.kiosk_id === filterKiosk);

  // Derive display items based on tab
  const displayItems = filteredTx.flatMap(tx => {
    if (activeTab === 'pictures' && tx.photo_url) {
      return [{ url: tx.photo_url, tx, type: 'pictures' as TabType }];
    } else if (activeTab === 'originals' && tx.original_urls && tx.original_urls.length > 0) {
      // Show first original as cover for the grid
      return [{ url: tx.original_urls[0], tx, type: 'originals' as TabType }];
    } else if (activeTab === 'gifs' && tx.gif_url) {
      return [{ url: tx.gif_url, tx, type: 'gifs' as TabType }];
    } else if (activeTab === 'videos' && tx.video_url) {
      return [{ url: tx.video_url, tx, type: 'videos' as TabType }];
    }
    return [];
  });

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'pictures': return <ImageIcon size={16} />;
      case 'originals': return <Images size={16} />;
      case 'gifs': return <PlaySquare size={16} />;
      case 'videos': return <Film size={16} />;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">{displayItems.length} media files found</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Tabs */}
          <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm w-full sm:w-auto">
            {(['pictures', 'originals', 'gifs', 'videos'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                {getTabIcon(tab)}
                <span className="hidden sm:inline">{tab}</span>
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          {/* Location Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <MapPin size={18} className="text-gray-400" />
            <select
              value={filterKiosk}
              onChange={(e) => setFilterKiosk(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-200 bg-white font-bold text-gray-700"
            >
              <option value="all">ALL LOCATIONS</option>
              {kiosks.map(k => (
                <option key={k.id} value={k.id}>
                  {k.branch?.name ? `${k.branch.name} - ${k.name}` : k.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8" onClick={() => setLightbox(null)}>
          <div className="absolute top-6 right-6 flex items-center gap-4">
            <a
              href={lightbox.url}
              download
              target="_blank"
              onClick={e => e.stopPropagation()}
              className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <Download size={24} />
            </a>
            <button className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="relative w-full max-w-4xl max-h-[80vh] flex flex-col justify-center items-center animate-scale-in" onClick={e => e.stopPropagation()}>
            {lightbox.type === 'videos' ? (
              <video src={lightbox.url} autoPlay loop controls className="max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
            ) : lightbox.type === 'originals' && lightbox.item.original_urls && lightbox.item.original_urls.length > 0 ? (
              <div className="w-full max-h-[75vh] overflow-y-auto custom-scrollbar px-2 sm:px-4 py-4">
                <div className={`mx-auto grid gap-6 ${lightbox.item.original_urls.length === 1 ? 'grid-cols-1 max-w-xs' : lightbox.item.original_urls.length === 2 ? 'grid-cols-2 max-w-md' : 'grid-cols-2 sm:grid-cols-3 max-w-3xl'}`}>
                  {lightbox.item.original_urls.map((u, i) => (
                    <div key={i} className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black/50 hover:scale-[1.02] transition-transform">
                      <Image src={u} alt={`Original ${i+1}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                      <a href={u} download target="_blank" onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 rounded-full text-white backdrop-blur-md transition-all z-10">
                        <Download size={16} />
                      </a>
                      <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-black tracking-widest rounded-full border border-white/20 z-10 shadow-lg">
                        #{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <img src={lightbox.url} alt="Media" className="max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
            )}
          </div>

          <div className="mt-8 bg-white/5 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{lightbox.item.kiosks?.branch?.name || "Global"}</p>
            <h3 className="text-xl font-black text-white">{lightbox.item.kiosks?.name || "Unknown Booth"}</h3>
            <p className="text-sm font-bold text-white/40">{new Date(lightbox.item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <ImageIcon size={64} className="text-gray-100 mb-4" />
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest leading-none">No {activeTab} Found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {displayItems.map((item, idx) => (
            <div key={`${item.tx.id}-${idx}`} onClick={() => setLightbox({ url: item.url, item: item.tx, type: item.type })}
              className="aspect-[3/4] relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer group hover:shadow-2xl transition-all hover:-translate-y-2 bg-slate-100">

              {item.type === 'videos' ? (
                <video src={item.url} muted loop playsInline onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} className="w-full h-full object-cover" />
              ) : (
                <Image src={item.url} alt="Booth Media" fill className="object-cover" />
              )}

              {item.type === 'originals' && item.tx.original_urls && item.tx.original_urls.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20">
                  +{item.tx.original_urls.length - 1} more
                </div>
              )}

              {item.type === 'videos' && (
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full border border-white/20">
                  <Film size={12} />
                </div>
              )}
              {item.type === 'gifs' && (
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 flex items-center rounded-full border border-white/20">
                  GIF
                </div>
              )}

              {/* Prevent errors by properly structuring the card's ending layers */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 pointer-events-none z-20">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{item.tx.kiosks?.branch?.name || 'Booth'}</p>
                <p className="text-xs font-bold text-white leading-tight">{item.tx.kiosks?.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
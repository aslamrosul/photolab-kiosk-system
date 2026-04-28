"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { QrCode, Link as LinkIcon, Save, Loader2, CheckCircle, ToggleLeft, ToggleRight } from "lucide-react";

export default function DigitalQrPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrEnabled, setQrEnabled] = useState(true);
  const [baseUrl, setBaseUrl] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) {
        setBaseUrl((data as any).qr_base_url || `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]}/storage/v1/object/public/photos/`);
        setQrEnabled((data as any).qr_enabled !== false);
        setExpiryDays((data as any).qr_expiry_days || 30);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    
    const { error } = await supabase.from('settings').update({
      qr_base_url: baseUrl,
      qr_enabled: qrEnabled,
      qr_expiry_days: expiryDays
    } as any).eq('id', 1);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Digital QR Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage how customers access their digital photos</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        {/* QR Status Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${qrEnabled ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <QrCode className={qrEnabled ? "text-emerald-600" : "text-gray-400"} size={22} />
            <div>
              <p className={`font-bold ${qrEnabled ? 'text-emerald-800' : 'text-gray-500'}`}>
                QR Service is {qrEnabled ? "Active" : "Disabled"}
              </p>
              <p className={`text-xs ${qrEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                {qrEnabled ? "Customers can scan to download their photos" : "QR download service is turned off"}
              </p>
            </div>
          </div>
          <button onClick={() => setQrEnabled(!qrEnabled)} className="text-gray-600 hover:text-gray-800 transition-colors">
            {qrEnabled ? <ToggleRight size={36} className="text-emerald-500" /> : <ToggleLeft size={36} className="text-gray-400" />}
          </button>
        </div>

        {/* Success Banner */}
        {saved && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 animate-fade-in">
            <CheckCircle size={20} />
            <span className="font-medium">QR settings saved successfully!</span>
          </div>
        )}

        {/* Config Fields */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Storage Base URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                placeholder="https://your-storage-url.com/photos/"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">The base URL used for generating QR codes to photo downloads</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photo Expiry (Days)</label>
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
              min={1}
              max={365}
            />
            <p className="text-xs text-gray-400 mt-1.5">Photos will be auto-deleted after this many days</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#6366f1] text-white w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4f46e5] transition-all disabled:bg-gray-300 shadow-md shadow-indigo-200 text-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save Configuration
        </button>
      </div>
    </div>
  );
}
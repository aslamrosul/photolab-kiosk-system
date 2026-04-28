"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Key, Save, ShieldCheck, Loader2, CheckCircle, Zap, Hand, CreditCard,
  QrCode, Image, Link2
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Core URLs
  const [qrBaseUrl, setQrBaseUrl] = useState("http://localhost:3000");
  const [dashboardApiUrl, setDashboardApiUrl] = useState("http://localhost:3000");

  // Payment
  const [paymentMode, setPaymentMode] = useState<'manual' | 'auto' | 'midtrans'>('manual');
  const [keys, setKeys] = useState({ client: "", server: "" });

  // QR Code
  const [qrEnabled, setQrEnabled] = useState(true);
  const [qrExpiryDays, setQrExpiryDays] = useState(30);
  const [qrisImageUrl, setQrisImageUrl] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) {
        setKeys({ client: data.midtrans_client_key || "", server: data.midtrans_server_key || "" });
        setQrBaseUrl(data.qr_base_url || "http://localhost:3000");
        setDashboardApiUrl(data.dashboard_api_url || "http://localhost:3000");
        if (data.payment_mode) setPaymentMode(data.payment_mode as any);
        setQrEnabled(data.qr_enabled ?? true);
        setQrExpiryDays(data.qr_expiry_days ?? 30);
        setQrisImageUrl(data.qris_image_url || "");
      }
      setInitialLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    const { error } = await supabase.from('settings').update({
      midtrans_client_key: keys.client,
      midtrans_server_key: keys.server,
      qr_base_url: qrBaseUrl,
      dashboard_api_url: dashboardApiUrl,
      payment_mode: paymentMode,
      qr_enabled: qrEnabled,
      qr_expiry_days: qrExpiryDays,
      qris_image_url: qrisImageUrl || null,
    }).eq('id', 1);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  const paymentModes = [
    { value: 'manual', label: 'Manual', desc: 'Operator confirms', icon: Hand },
    { value: 'auto', label: 'Auto (Test)', desc: 'Auto-confirms 5s', icon: Zap },
    { value: 'midtrans', label: 'Midtrans QRIS', desc: 'Real QRIS payment', icon: CreditCard },
  ];

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const helpTextClass = "text-xs text-gray-400 mt-1.5";

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment & QR Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure payment gateways, QR code behavior, and system URLs.</p>
      </div>

      {/* Success Banner */}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 animate-fade-in sticky top-4 z-50 shadow-lg">
          <CheckCircle size={20} />
          <span className="font-medium">Settings updated successfully!</span>
        </div>
      )}

      {/* ========== SECTION 1: Payment ========== */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
        <h2 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-indigo-500" /> Payment
        </h2>

        {/* Payment Mode Selector */}
        <div>
          <label className={labelClass}>Payment Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {paymentModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = paymentMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => setPaymentMode(mode.value as any)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all text-center ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                      : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <Icon size={24} className={isActive ? 'text-indigo-600' : ''} />
                  <span className="text-xs font-black uppercase tracking-wider">{mode.label}</span>
                  <span className="text-[10px] font-medium leading-tight">{mode.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard API URL */}
        <div>
          <label className={labelClass}>Dashboard API URL</label>
          <div className="flex items-center gap-3">
            <Link2 size={18} className="text-gray-400 shrink-0" />
            <input type="text" className={inputClass} value={dashboardApiUrl} onChange={(e) => setDashboardApiUrl(e.target.value)} placeholder="http://localhost:3000" />
          </div>
          <p className={helpTextClass}>Kiosk calls this URL for Midtrans payment APIs.</p>
        </div>

        {/* Static QRIS Image */}
        <div>
          <label className={labelClass}>Static QRIS Image URL (Manual Mode)</label>
          <div className="flex items-center gap-3">
            <Image size={18} className="text-gray-400 shrink-0" />
            <input type="text" className={inputClass} value={qrisImageUrl} onChange={(e) => setQrisImageUrl(e.target.value)} placeholder="https://example.com/qris.png" />
          </div>
          <p className={helpTextClass}>Static QRIS image shown in Manual payment mode. Not used in Midtrans mode.</p>
        </div>

        {/* Midtrans Keys */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs border border-indigo-100">
            <ShieldCheck size={16} />
            <span className="font-medium">API keys are stored securely in the database.</span>
          </div>

          <div>
            <label className={labelClass}>Midtrans Client Key</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input type="text" className={inputClass + " pl-11 font-mono"} placeholder="SB-Mid-client-xxxx" value={keys.client} onChange={(e) => setKeys({ ...keys, client: e.target.value })} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Midtrans Server Key</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input type="password" className={inputClass + " pl-11 font-mono"} placeholder="SB-Mid-server-xxxx" value={keys.server} onChange={(e) => setKeys({ ...keys, server: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION 2: QR Code ========== */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
        <h2 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
          <QrCode size={18} className="text-indigo-500" /> QR Code & Downloads
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>QR Code Enabled</label>
            <button
              onClick={() => setQrEnabled(!qrEnabled)}
              className={`w-full px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${qrEnabled ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
            >
              {qrEnabled ? '✓ Enabled' : '✗ Disabled'}
            </button>
            <p className={helpTextClass}>Show QR code on the final screen.</p>
          </div>

          <div>
            <label className={labelClass}>QR Link Expiry</label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={365}
                className={inputClass + " text-center font-bold text-lg"}
                value={qrExpiryDays}
                onChange={(e) => setQrExpiryDays(Number(e.target.value))}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">days</span>
            </div>
            <p className={helpTextClass}>How long the download link stays active.</p>
          </div>
        </div>

        <div>
          <label className={labelClass}>QR Code Base URL</label>
          <div className="flex items-center gap-3">
            <Link2 size={18} className="text-gray-400 shrink-0" />
            <input type="text" className={inputClass} value={qrBaseUrl} onChange={(e) => setQrBaseUrl(e.target.value)} placeholder="http://localhost:3000" />
          </div>
          <p className={helpTextClass}>Public URL used for generating QR codes. Point this to your Dashboard's host address.</p>
        </div>
      </div>

      {/* ========== SAVE BUTTON ========== */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-[#6366f1] text-white w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4f46e5] transition-all disabled:bg-gray-300 shadow-lg shadow-indigo-200 text-sm sticky bottom-6"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
        Save Payment & QR Settings
      </button>
    </div>
  );
}
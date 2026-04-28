"use client";
import { useState, useEffect } from "react";
import { CreditCard, Rocket, CheckCircle2, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    snap: any;
  }
}

export default function MidtransTestPage() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Midtrans Snap script
  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "YOUR_CLIENT_KEY";

    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const generateToken = async () => {
    setLoading(true);
    setError(null);
    setToken(null);
    setStatus(null);

    const orderId = `TEST-${Date.now()}`;
    const amount = 50000; // Rp 50.000

    try {
      const res = await fetch("/api/payment/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          orderId,
          customerName: "Photolab Tester",
          customerEmail: "tester@photolab.id"
        }),
      });

      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        // Automatically trigger Snap popup
        window.snap.pay(data.token, {
          onSuccess: (result: any) => {
            console.log("Success:", result);
            setStatus("success");
          },
          onPending: (result: any) => {
            console.log("Pending:", result);
            setStatus("pending");
          },
          onError: (result: any) => {
            console.log("Error:", result);
            setStatus("error");
          },
          onClose: () => {
            console.log("Closed without paying");
          }
        });
      } else {
        setError(data.error || "Failed to get token. Check Server Key in .env.local");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <CreditCard size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600 mb-2">
            <Rocket size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Midtrans Sandbox Integration</h1>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            Verify your configuration and test the payment flow using Midtrans Snap popup.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center space-y-6 relative z-10">
          <button
            onClick={generateToken}
            disabled={loading}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl ${
              loading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-indigo-500/30'
            }`}
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div> PROCESSING...</>
            ) : (
              <><CreditCard size={20} /> Generate Snap Token</>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-shake">
              <AlertCircle size={20} />
              <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 p-6 bg-emerald-50 text-emerald-600 rounded-[2rem] border border-emerald-100 animate-bounce">
              <CheckCircle2 size={48} />
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-widest">Payment Successful</p>
                <p className="text-xs font-medium opacity-70">Simulation completed normally.</p>
              </div>
            </div>
          )}

          <div className="w-full max-w-lg p-6 bg-slate-50 rounded-2xl border border-slate-200 mt-4">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Environment Keys Check</h4>
             <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">NEXT_PUBLIC_MIDTRANS_CLIENT_KEY</span>
                  <code className="bg-slate-200 px-2 py-1 rounded text-[10px] truncate max-w-[200px]">
                    {process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Not Found'}
                  </code>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                   <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                   <p className="text-[10px] font-semibold text-amber-700 leading-normal">
                     Make sure to replace the placeholder keys in <code className="bg-amber-100/50 px-1 rounded">.env.local</code> with your actual <b>Sandbox Keys</b> from Midtrans Dashboard.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

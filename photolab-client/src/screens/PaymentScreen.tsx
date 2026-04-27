import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, CheckCircle2, Ticket, CreditCard, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function PaymentScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    packageId?: string;
    amount?: number;
    price?: number;
    appliedVoucher?: string;
    voucherId?: string;
    discountAmount?: number;
  } | null;

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes for real payment
  const [paid, setPaid] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [paymentMode, setPaymentMode] = useState<'manual' | 'auto' | 'midtrans'>('manual');
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [dashboardUrl, setDashboardUrl] = useState<string>("http://localhost:3000");

  // Midtrans state
  const [midtransOrderId, setMidtransOrderId] = useState<string | null>(null);
  const [midtransLoading, setMidtransLoading] = useState(false);
  const [midtransError, setMidtransError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const createdRef = useRef(false);

  const discount = state?.discountAmount || 0;
  const voucherId = state?.voucherId || null;
  const basePrice = state?.price || 25000;
  const finalPrice = Math.max(0, basePrice - discount);

  // 1. Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await supabase.from('settings').select('payment_mode, qris_image_url, qr_base_url, dashboard_api_url').single();
        if (data) {
          if (data.payment_mode) setPaymentMode(data.payment_mode as any);
          if (data.qris_image_url) setQrisUrl(data.qris_image_url);
          if (data.dashboard_api_url) setDashboardUrl(data.dashboard_api_url);
        }
      } catch (e) {
        console.error("Failed fetching settings", e);
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchSettings();
  }, []);

  // 2. Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !paid) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timeLeft === 0 && !paid) {
      navigate('/');
    }
  }, [timeLeft, paid, navigate]);

  // 3. Auto mode (testing)
  useEffect(() => {
    if (!loadingConfig && paymentMode === 'auto' && !paid) {
      const dummyPayment = setTimeout(() => handlePaymentSuccess('auto'), 5000);
      return () => clearTimeout(dummyPayment);
    }
  }, [loadingConfig, paymentMode, paid]);

  // 4. Midtrans mode: Create QRIS transaction
  useEffect(() => {
    if (!loadingConfig && paymentMode === 'midtrans' && !paid && !createdRef.current) {
      createdRef.current = true;
      createMidtransTransaction();
    }
  }, [loadingConfig, paymentMode, paid]);

  // 5. Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const createMidtransTransaction = async () => {
    setMidtransLoading(true);
    setMidtransError(null);

    const orderId = `PB-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      const res = await fetch(`${dashboardUrl}/api/payment/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalPrice,
          orderId,
          customerName: "Photobooth Customer",
        }),
      });

      const data = await res.json();
      console.log("[Midtrans] Create response:", data);

      if (data.qrUrl) {
        setQrisUrl(data.qrUrl);
        setMidtransOrderId(data.orderId || orderId);
        // Start polling for payment status
        startPolling(data.orderId || orderId);
      } else {
        setMidtransError(data.error || "Failed to generate QRIS. Check Dashboard API.");
      }
    } catch (err: any) {
      console.error("[Midtrans] Create error:", err);
      setMidtransError("Cannot connect to Dashboard API. Make sure Dashboard is running.");
    } finally {
      setMidtransLoading(false);
    }
  };

  const startPolling = (orderId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${dashboardUrl}/api/payment/status?orderId=${orderId}`);
        const data = await res.json();
        console.log("[Midtrans] Poll status:", data.transactionStatus);

        if (data.transactionStatus === 'settlement' || data.transactionStatus === 'capture') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          handlePaymentSuccess('midtrans', orderId, data.grossAmount);
        } else if (data.transactionStatus === 'expire' || data.transactionStatus === 'cancel' || data.transactionStatus === 'deny') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setMidtransError("Payment expired or cancelled. Please try again.");
        }
      } catch (err) {
        console.warn("[Midtrans] Poll error (will retry):", err);
      }
    }, 3000);
  };

  const handlePaymentSuccess = (method: string = 'manual', orderId?: string, grossAmount?: string) => {
    setPaid(true);
    if (pollingRef.current) clearInterval(pollingRef.current);

    setTimeout(() => {
      navigate('/frame', {
        state: {
          ...state,
          finalPrice,
          voucherId,
          transactionStatus: 'success',
          paymentMethod: method.toUpperCase(),
          midtransOrderId: orderId || null,
          midtransAmount: grossAmount || finalPrice.toString(),
        }
      });
    }, 2000);
  };

  return (
    <div className="h-screen w-screen bg-slate-900 border-none outline-none overflow-hidden animate-kiosk-in text-white flex flex-col md:flex-row">
      {/* Left Panel: Payment details */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full p-10 md:p-20 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/50 bg-slate-800/20">
        <div>
          <button
            onClick={() => navigate(-1)}
            disabled={paid}
            className="text-slate-400 hover:text-white mb-16 text-lg tracking-widest uppercase font-bold disabled:opacity-50 flex items-center gap-2"
          >
            ← Change Package
          </button>

          <h1 className="text-6xl font-extrabold mb-4 tracking-tighter">Complete Payment</h1>
          <p className="text-xl text-slate-400 mb-12">
            {paymentMode === 'midtrans' ? 'Scan the QRIS code below to pay' : 'Scan the QRIS code to start your session'}
          </p>

          <div className="bg-slate-800/80 border border-slate-700 rounded-[32px] p-10 mb-8 shadow-2xl">
            <p className="text-slate-500 mb-6 uppercase tracking-[0.2em] font-bold text-xs">Session Summary</p>

            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl text-slate-300 font-medium">{state?.amount || 0} Physical Strips</span>
              <span className="text-2xl font-bold">Rp {basePrice.toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between items-center mb-4 text-emerald-400 font-bold bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                <span className="flex items-center gap-2"><Ticket size={20} /> Voucher Applied</span>
                <span>- Rp {discount.toLocaleString()}</span>
              </div>
            )}

            <div className="w-full h-px bg-slate-700/50 my-6"></div>

            <div className="flex justify-between items-end">
              <span className="text-lg text-slate-400 font-bold uppercase tracking-widest">Total to Pay</span>
              <span className="text-5xl font-black text-indigo-400">Rp {finalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <ShieldCheck size={24} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                {paymentMode === 'midtrans' ? 'Midtrans Secure Payment' : 'Secure Checkout'}
              </p>
              <p className="text-slate-500 text-xs">
                {paymentMode === 'midtrans'
                  ? 'Payment processed securely via Midtrans QRIS.'
                  : 'Payment is encrypted and processed locally.'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-xl bg-slate-900/50 self-start px-6 py-3 rounded-2xl border border-slate-800">
          Payment Window: <span className="text-white font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Right Panel: QR Code & Actions */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center relative bg-white">
        {paid ? (
          <div className="flex flex-col items-center animate-kiosk-in">
            <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 size={64} className="text-emerald-500" />
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">SUCCESS!</h2>
            <p className="text-2xl text-slate-500 font-medium">Get ready for your session...</p>
          </div>
        ) : loadingConfig || midtransLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest">
              {midtransLoading ? 'Generating QRIS...' : 'Loading Payment...'}
            </p>
          </div>
        ) : midtransError ? (
          <div className="flex flex-col items-center max-w-sm text-center px-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Payment Error</h3>
            <p className="text-slate-500 text-sm mb-8">{midtransError}</p>
            <button
              onClick={() => { createdRef.current = false; setMidtransError(null); createMidtransTransaction(); }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-sm">
            {/* QRIS Image */}
            <div className="w-full aspect-[3/4] bg-slate-50 p-6 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center mb-8 border-[8px] border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 w-full h-16 bg-blue-600 flex items-center justify-center shadow-lg z-10">
                <span className="text-white font-black text-2xl tracking-[0.3em]">QRIS</span>
              </div>

              {qrisUrl ? (
                <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain mt-12 z-0" />
              ) : (
                <div className="mt-12 flex flex-col items-center justify-center text-slate-300">
                  <CreditCard size={64} className="mb-4" />
                  <p className="font-bold text-center">No QRIS Image Setup</p>
                  <p className="text-xs text-center px-4">Admin needs to configure payment in the Dashboard Settings.</p>
                </div>
              )}
            </div>

            {paymentMode === 'midtrans' ? (
              <div className="animate-pulse bg-indigo-100 text-indigo-600 px-8 py-4 rounded-full font-black text-lg flex items-center gap-3 shadow-lg shadow-indigo-500/10 border border-indigo-200 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
                Waiting for payment...
              </div>
            ) : paymentMode === 'manual' ? (
              <button
                onClick={() => handlePaymentSuccess('manual')}
                className="w-full py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-3"
              >
                <CheckCircle2 size={24} /> Confirm Payment
              </button>
            ) : (
              <div className="animate-pulse bg-indigo-100 text-indigo-600 px-8 py-4 rounded-full font-black text-lg flex items-center gap-3 shadow-lg shadow-indigo-500/10 border border-indigo-200 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
                Waiting for transaction...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

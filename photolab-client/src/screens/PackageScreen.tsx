import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CopyPlus, Loader2, Ticket, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Package {
  id: string;
  name: string;
  print_amount: number;
  price: number;
}

export default function PackageScreen() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState("");
  const [showVoucherInput, setShowVoucherInput] = useState(false);
  const [voucherStatus, setVoucherStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [voucherError, setVoucherError] = useState("");
  const [validatedVoucher, setValidatedVoucher] = useState<{ id: string; code: string; discount_amount: number } | null>(null);

  useEffect(() => {
    async function fetchPackages() {
      const { data } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (data) setPackages(data);
      setLoading(false);
    }
    fetchPackages();
  }, []);

  const handleSelect = (pkg: Package) => {
    navigate('/payment', {
      state: {
        packageId: pkg.id,
        amount: pkg.print_amount,
        price: pkg.price,
        appliedVoucher: validatedVoucher?.code || "",
        voucherId: validatedVoucher?.id || null,
        discountAmount: validatedVoucher?.discount_amount || 0
      }
    });
  };

  const validateVoucher = async () => {
    const code = voucherCode.trim();
    if (!code) {
      setVoucherError("Please enter a code");
      setVoucherStatus('invalid');
      return;
    }

    setVoucherStatus('checking');
    setVoucherError("");

    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('id, code, discount_amount, is_used')
        .eq('code', code)
        .single();

      if (error || !data) {
        setVoucherStatus('invalid');
        setVoucherError("Voucher code not found");
        return;
      }

      if (data.is_used) {
        setVoucherStatus('invalid');
        setVoucherError("This voucher has already been used");
        return;
      }

      // Valid!
      setVoucherStatus('valid');
      setValidatedVoucher({ id: data.id, code: data.code, discount_amount: data.discount_amount });
      setTimeout(() => {
        setShowVoucherInput(false);
      }, 1200);
    } catch {
      setVoucherStatus('invalid');
      setVoucherError("Failed to validate voucher");
    }
  };

  const clearVoucher = () => {
    setVoucherCode("");
    setValidatedVoucher(null);
    setVoucherStatus('idle');
    setVoucherError("");
  };

  return (
    <div className="h-screen w-screen bg-slate-900 border-none outline-none overflow-hidden animate-kiosk-in text-white relative">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-8 z-20 flex justify-center">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-indigo-400">Select Package</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center h-full gap-12 px-12">
        <div className="relative text-center mb-8">
          <h1 className="text-5xl font-black italic tracking-tighter text-white mb-4">
            SELECT PRINTOUT AMOUNT
          </h1>
          <p className="text-xl text-slate-400 font-medium">
            Choose how many physical copies you want to print.<br />
            <span className="text-indigo-400">(This does not affect the number of photos taken)</span>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="text-slate-400 animate-pulse font-bold tracking-widest uppercase">Fetching Packages...</p>
          </div>
        ) : (
          <div className="flex gap-8 w-full max-w-6xl overflow-auto pb-8 snap-x snap-mandatory flex-row-portrait-fix scrollbar-hide py-4 px-4 h-full md:h-auto items-center">
            {packages.map((pkg, idx) => (
              <button
                key={pkg.id}
                onClick={() => handleSelect(pkg)}
                className={`flex-none w-[300px] h-[350px] snap-center bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center transition-all hover:scale-105 group relative overflow-hidden ${idx === 1 ? 'shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/20' : ''}`}
              >
                {idx === 1 && (
                  <div className="absolute -top-4 -right-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-2 px-10 rotate-45 z-10">Best Choice</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex gap-2 mb-6">
                  {Array.from({ length: Math.min(pkg.print_amount, 3) }).map((_, i) => (
                    <CopyPlus key={i} size={idx === 1 ? 72 : 56} className={`${idx === 1 ? 'text-indigo-400' : 'text-slate-400'} group-hover:text-indigo-400 transition-colors`} />
                  ))}
                </div>

                <h3 className="text-4xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-xl text-slate-400 mb-8">{pkg.print_amount} Physical Strips</p>
                {validatedVoucher ? (
                  <div className="flex flex-col items-center">
                    <div className="text-xl text-slate-500 line-through">Rp {pkg.price.toLocaleString()}</div>
                    <div className="text-3xl font-extrabold text-emerald-400">Rp {Math.max(0, pkg.price - validatedVoucher.discount_amount).toLocaleString()}</div>
                  </div>
                ) : (
                  <div className="text-3xl font-extrabold text-indigo-400">Rp {pkg.price.toLocaleString()}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute bottom-12 left-12 text-slate-400 hover:text-white px-8 py-4 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700 transition-colors text-lg font-bold flex items-center gap-2"
      >
        Cancel session
      </button>

      {/* Voucher Code Area */}
      <div className="absolute bottom-12 right-12">
        {validatedVoucher ? (
          <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-lg font-bold text-emerald-400">
            <CheckCircle size={24} />
            <span>Voucher: {validatedVoucher.code} (-Rp {validatedVoucher.discount_amount.toLocaleString()})</span>
            <button onClick={clearVoucher} className="ml-2 text-slate-400 hover:text-white text-sm">✕</button>
          </div>
        ) : (
          <button
            onClick={() => { setShowVoucherInput(true); setVoucherStatus('idle'); setVoucherError(''); }}
            className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300 px-8 py-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 transition-colors text-lg font-bold group"
          >
            <Ticket size={24} className="group-hover:rotate-12 transition-transform" /> USE VOUCHER
          </button>
        )}
      </div>

      {/* Voucher Popup Modal */}
      {showVoucherInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowVoucherInput(false)}></div>

          <div className="relative bg-slate-900 border-2 border-indigo-500/50 rounded-[2rem] p-8 w-full max-w-lg shadow-[0_0_60px_rgba(99,102,241,0.15)] animate-scale-in flex flex-col items-center">
            <div className={`mb-6 p-4 rounded-full transition-colors ${voucherStatus === 'valid' ? 'bg-emerald-500/20' : voucherStatus === 'invalid' ? 'bg-red-500/20' : 'bg-indigo-500/10'}`}>
              {voucherStatus === 'valid' ? (
                <CheckCircle size={40} className="text-emerald-400" />
              ) : voucherStatus === 'invalid' ? (
                <XCircle size={40} className="text-red-400" />
              ) : (
                <Ticket size={40} className="text-indigo-400" />
              )}
            </div>

            <h2 className="text-2xl font-black italic tracking-tight mb-1 uppercase">
              {voucherStatus === 'valid' ? 'Voucher Applied!' : voucherStatus === 'invalid' ? 'Invalid Code' : 'Have a Promo Code?'}
            </h2>
            <p className={`text-sm mb-6 font-medium ${voucherStatus === 'invalid' ? 'text-red-400' : 'text-slate-400'}`}>
              {voucherError || (voucherStatus === 'valid' ? `Discount: Rp ${validatedVoucher?.discount_amount.toLocaleString()}` : 'Enter your voucher code below to get a discount')}
            </p>

            <div className="w-full relative mb-6">
              <input
                type="text"
                placeholder="PROMO123"
                value={voucherCode}
                onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherStatus('idle'); setVoucherError(''); }}
                className={`w-full bg-slate-800 border-3 rounded-2xl p-5 text-3xl font-black text-center text-white tracking-[0.15em] outline-none transition-all placeholder:text-slate-700 uppercase ${voucherStatus === 'invalid' ? 'border-red-500' : voucherStatus === 'valid' ? 'border-emerald-500' : 'border-slate-700 focus:border-indigo-500'
                  }`}
                autoFocus
                disabled={voucherStatus === 'checking' || voucherStatus === 'valid'}
              />
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setShowVoucherInput(false); if (voucherStatus !== 'valid') { setVoucherCode(''); setVoucherStatus('idle'); } }}
                className="flex-1 py-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold uppercase tracking-widest text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={validateVoucher}
                disabled={voucherStatus === 'checking' || voucherStatus === 'valid'}
                className={`flex-[2] py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${voucherStatus === 'checking' ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  }`}
              >
                {voucherStatus === 'checking' ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> Checking...</span>
                ) : 'Apply Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

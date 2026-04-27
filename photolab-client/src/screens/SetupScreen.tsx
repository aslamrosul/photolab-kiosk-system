import { useState } from "react";
import { registerKiosk } from "../lib/supabase";
import { useKiosk } from "../lib/KioskContext";
import { KeyRound, Loader2, CheckCircle, XCircle, Settings } from "lucide-react";

export default function SetupScreen() {
    const { setKiosk } = useKiosk();
    const [licenseKey, setLicenseKey] = useState("");
    const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState("");

    const handleRegister = async () => {
        if (!licenseKey.trim()) return;
        setStatus('checking');
        setErrorMsg("");

        const result = await registerKiosk(licenseKey.trim());
        if (result) {
            setStatus('success');
            setTimeout(() => {
                setKiosk(result);
            }, 1500);
        } else {
            setStatus('error');
            setErrorMsg("License key not found. Please check and try again.");
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center overflow-hidden relative">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-lg p-10 flex flex-col items-center">
                {/* Icon */}
                <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 transition-colors ${status === 'success' ? 'bg-emerald-500/20' :
                        status === 'error' ? 'bg-red-500/20' : 'bg-indigo-500/10'
                    }`}>
                    {status === 'success' ? (
                        <CheckCircle size={56} className="text-emerald-400" />
                    ) : status === 'error' ? (
                        <XCircle size={56} className="text-red-400" />
                    ) : status === 'checking' ? (
                        <Loader2 size={56} className="text-indigo-400 animate-spin" />
                    ) : (
                        <Settings size={56} className="text-indigo-400" />
                    )}
                </div>

                <h1 className="text-4xl font-black text-white text-center mb-2">
                    {status === 'success' ? 'Registered!' : 'Kiosk Setup'}
                </h1>
                <p className="text-slate-400 text-center text-lg mb-10">
                    {status === 'success'
                        ? 'This machine is now connected.'
                        : 'Enter the license key from your Dashboard to register this machine.'}
                </p>

                {status !== 'success' && (
                    <>
                        <div className="w-full relative mb-6">
                            <KeyRound size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Enter License Key..."
                                value={licenseKey}
                                onChange={(e) => { setLicenseKey(e.target.value.toUpperCase()); setStatus('idle'); }}
                                className={`w-full bg-slate-900 border-2 rounded-2xl pl-14 pr-6 py-5 text-xl font-bold text-white tracking-wider outline-none transition-all placeholder:text-slate-700 ${status === 'error' ? 'border-red-500' : 'border-slate-700 focus:border-indigo-500'
                                    }`}
                                autoFocus
                                disabled={status === 'checking'}
                            />
                        </div>

                        {errorMsg && (
                            <p className="text-red-400 text-sm font-bold mb-4 text-center">{errorMsg}</p>
                        )}

                        <button
                            onClick={handleRegister}
                            disabled={status === 'checking' || !licenseKey.trim()}
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-3"
                        >
                            {status === 'checking' ? (
                                <><Loader2 size={20} className="animate-spin" /> Verifying...</>
                            ) : (
                                'Register Machine'
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

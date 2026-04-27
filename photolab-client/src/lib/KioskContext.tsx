import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateStoredKiosk } from './supabase';

interface KioskInfo {
    kioskId: string;
    kioskName: string;
    branchName?: string;
    orientation?: 'landscape' | 'portrait';
    allowed_frames?: string[];
}

interface KioskContextValue {
    kiosk: KioskInfo | null;
    isLoading: boolean;
    isRegistered: boolean;
    setKiosk: (kiosk: KioskInfo | null) => void;
}

const KioskContext = createContext<KioskContextValue>({
    kiosk: null,
    isLoading: true,
    isRegistered: false,
    setKiosk: () => { }
});

export function KioskProvider({ children }: { children: React.ReactNode }) {
    const [kiosk, setKiosk] = useState<KioskInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkRegistration() {
            const result = await validateStoredKiosk();
            if (result) {
                setKiosk(result);
            }
            setIsLoading(false);
        }
        checkRegistration();
    }, []);

    return (
        <KioskContext.Provider value={{
            kiosk,
            isLoading,
            isRegistered: !!kiosk,
            setKiosk
        }}>
            {children}
        </KioskContext.Provider>
    );
}

export function useKiosk() {
    return useContext(KioskContext);
}

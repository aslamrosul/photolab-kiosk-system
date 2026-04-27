import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tukwbzgpkbzozchaqrcz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1a3diemdwa2J6b3pjaGFxcmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTQxNjgsImV4cCI6MjA4ODM5MDE2OH0.MJh2I-ZoJgjZke1DC9TNtqnDfHxlFwOS_fh5irnIg3U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// Kiosk Identity System
// ============================================
const KIOSK_KEY = 'photobooth_kiosk_id';
const LICENSE_KEY = 'photobooth_license_key';

export function getStoredKioskId(): string | null {
    return localStorage.getItem(KIOSK_KEY);
}

export function getStoredLicenseKey(): string | null {
    return localStorage.getItem(LICENSE_KEY);
}

export async function registerKiosk(licenseKey: string): Promise<{ kioskId: string; kioskName: string; branchName?: string; orientation?: 'landscape' | 'portrait'; allowed_frames?: string[] } | null> {
    const { data, error } = await supabase
        .from('kiosks')
        .select('id, name, license_key, orientation, allowed_frames, branch:branches(name)')
        .eq('license_key', licenseKey)
        .single();

    if (error || !data) return null;

    localStorage.setItem(KIOSK_KEY, data.id);
    localStorage.setItem(LICENSE_KEY, licenseKey);
    return {
        kioskId: data.id,
        kioskName: data.name,
        branchName: (data.branch as any)?.name,
        orientation: data.orientation || 'landscape',
        allowed_frames: data.allowed_frames || []
    };
}

export async function validateStoredKiosk(): Promise<{ kioskId: string; kioskName: string; branchName?: string; orientation?: 'landscape' | 'portrait'; allowed_frames?: string[] } | null> {
    const kioskId = getStoredKioskId();
    if (!kioskId) return null;

    const { data, error } = await supabase
        .from('kiosks')
        .select('id, name, orientation, allowed_frames, branch:branches(name)')
        .eq('id', kioskId)
        .single();

    if (error || !data) {
        localStorage.removeItem(KIOSK_KEY);
        localStorage.removeItem(LICENSE_KEY);
        return null;
    }

    return {
        kioskId: data.id,
        kioskName: data.name,
        branchName: (data.branch as any)?.name,
        orientation: data.orientation || 'landscape',
        allowed_frames: data.allowed_frames || []
    };
}

export function clearKioskRegistration() {
    localStorage.removeItem(KIOSK_KEY);
    localStorage.removeItem(LICENSE_KEY);
}

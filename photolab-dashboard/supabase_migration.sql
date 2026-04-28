-- Run this SQL in Supabase SQL Editor to add Digital QR config columns
-- These columns are needed for the Digital QR page to save its settings

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS qr_base_url text,
ADD COLUMN IF NOT EXISTS qr_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS qr_expiry_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS timer_frame_select integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS timer_session_limit integer DEFAULT 300,
ADD COLUMN IF NOT EXISTS max_retake_limit integer DEFAULT 1;

-- Make sure there's at least one row in settings
INSERT INTO public.settings (id, qr_enabled, qr_expiry_days)
VALUES (1, true, 30)
ON CONFLICT (id) DO NOTHING;

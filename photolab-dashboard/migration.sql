-- ============================================
-- PHOTOBOOTH SYSTEM - MIGRATION SCRIPT
-- Run this in Supabase SQL Editor to add missing columns
-- Safe to run multiple times (uses IF NOT EXISTS checks)
-- ============================================

-- ============================================
-- 1. KIOSKS: Add branch_id + last_seen
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='kiosks' AND column_name='branch_id') THEN
        ALTER TABLE public.kiosks ADD COLUMN branch_id uuid REFERENCES public.branches(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='kiosks' AND column_name='last_seen') THEN
        ALTER TABLE public.kiosks ADD COLUMN last_seen timestamptz;
    END IF;
END $$;

-- ============================================
-- 2. FRAMES: Add category_id
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='frames' AND column_name='category_id') THEN
        ALTER TABLE public.frames ADD COLUMN category_id uuid REFERENCES public.frame_categories(id);
    END IF;
END $$;

-- ============================================
-- 3. TRANSACTIONS: Add package_id, voucher_id, video_url, payment_method
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='package_id') THEN
        ALTER TABLE public.transactions ADD COLUMN package_id uuid REFERENCES public.packages(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='voucher_id') THEN
        ALTER TABLE public.transactions ADD COLUMN voucher_id uuid REFERENCES public.vouchers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='video_url') THEN
        ALTER TABLE public.transactions ADD COLUMN video_url text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='payment_method') THEN
        ALTER TABLE public.transactions ADD COLUMN payment_method text;
    END IF;
END $$;

-- ============================================
-- 4. VOUCHERS: Add used_at
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vouchers' AND column_name='used_at') THEN
        ALTER TABLE public.vouchers ADD COLUMN used_at timestamptz;
    END IF;
END $$;

-- ============================================
-- 5. PACKAGES: Create table if not exists
-- (This table doesn't exist in your current schema)
-- ============================================
CREATE TABLE IF NOT EXISTS public.packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    print_amount integer NOT NULL,
    price integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- 6. SEED: Add default packages if table is empty
-- ============================================
INSERT INTO public.packages (name, print_amount, price)
SELECT '2 Strips', 2, 25000
WHERE NOT EXISTS (SELECT 1 FROM public.packages LIMIT 1);

INSERT INTO public.packages (name, print_amount, price)
SELECT '4 Strips', 4, 45000
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE name = '4 Strips');

-- ============================================
-- 7. SEED: Add default settings row if empty
-- ============================================
INSERT INTO public.settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE id = 1);

-- ============================================
-- 8. SEED: Add default 'Standard' frame category
-- ============================================
INSERT INTO public.frame_categories (name)
SELECT 'Standard'
WHERE NOT EXISTS (SELECT 1 FROM public.frame_categories WHERE name = 'Standard');

-- ============================================
-- 9. SCHEMA ADDITIONS (V2 Features)
-- ============================================
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS original_urls jsonb;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS gif_url text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS midtrans_order_id text;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'manual';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS qris_image_url text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS dashboard_api_url text DEFAULT 'http://localhost:3000';

-- Theming
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS theme_bg_color text DEFAULT '#020617';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS theme_accent_color text DEFAULT '#4f46e5';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS idle_bg_image text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS brand_logo_url text;

-- Kiosk Allowed Frames
ALTER TABLE public.kiosks ADD COLUMN IF NOT EXISTS allowed_frames uuid[] DEFAULT '{}';

-- ============================================
-- 10. DISABLE RLS (so Dashboard & Kiosk can read/write freely)
-- ============================================
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. STORAGE: Create photos bucket and enable public access
-- Run this in Supabase SQL Editor to fix gallery image URLs
-- ============================================

-- Create photos bucket if it doesn't exist (public = true means URLs are accessible)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/gif', 'video/webm', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Allow anyone to VIEW files (SELECT) - needed for gallery public URLs
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Allow any authenticated OR anonymous upload (INSERT) from kiosk client
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
CREATE POLICY "Allow uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

-- Allow deletes for dashboard management
DROP POLICY IF EXISTS "Allow deletes" ON storage.objects;
CREATE POLICY "Allow deletes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos');

-- Disable RLS on storage.objects so all paths are accessible without row restrictions
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

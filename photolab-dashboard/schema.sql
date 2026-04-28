-- ============================================
-- PHOTOBOOTH SYSTEM - FULL DATABASE SCHEMA REFERENCE
-- This reflects the complete schema AFTER running migration.sql
-- WARNING: Do NOT run this directly if tables already exist.
-- Use migration.sql instead to safely add missing columns.
-- ============================================

-- 0. Branches
CREATE TABLE public.branches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    location text,
    staff_name text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT branches_pkey PRIMARY KEY (id)
);

-- 1. Kiosks
CREATE TABLE public.kiosks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    license_key text UNIQUE,
    price_per_print integer DEFAULT 35000,
    total_frames integer DEFAULT 0,
    owner_email text,
    branch_id uuid REFERENCES public.branches(id),
    orientation text DEFAULT 'landscape',
    last_seen timestamptz,
    created_at timestamptz DEFAULT timezone('utc', now()),
    CONSTRAINT kiosks_pkey PRIMARY KEY (id)
);

-- 2. Packages
CREATE TABLE public.packages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    print_amount integer NOT NULL,
    price integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT packages_pkey PRIMARY KEY (id)
);

-- 3. Vouchers
CREATE TABLE public.vouchers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    discount_amount integer DEFAULT 0,
    is_used boolean DEFAULT false,
    used_at timestamptz,
    created_at timestamptz DEFAULT timezone('utc', now()),
    CONSTRAINT vouchers_pkey PRIMARY KEY (id)
);

-- 4. Frame Categories
CREATE TABLE public.frame_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT frame_categories_pkey PRIMARY KEY (id)
);

-- 5. Frames
CREATE TABLE public.frames (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    image_url text NOT NULL,
    type text DEFAULT '4-Slots',
    category_id uuid REFERENCES public.frame_categories(id),
    layout_config jsonb DEFAULT '[]',
    required_photos integer DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now()),
    CONSTRAINT frames_pkey PRIMARY KEY (id)
);

-- 6. Transactions
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    kiosk_id uuid REFERENCES public.kiosks(id),
    package_id uuid REFERENCES public.packages(id),
    voucher_id uuid REFERENCES public.vouchers(id),
    amount integer NOT NULL,
    photo_url text,
    video_url text,
    payment_method text,
    status text DEFAULT 'success',
    created_at timestamptz DEFAULT timezone('utc', now()),
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);

-- 7. Settings
CREATE TABLE public.settings (
    id integer NOT NULL DEFAULT 1,
    midtrans_client_key text,
    midtrans_server_key text,
    updated_at timestamptz DEFAULT timezone('utc', now()),
    qr_base_url text,
    qr_enabled boolean DEFAULT true,
    qr_expiry_days integer DEFAULT 30,
    timer_frame_select integer DEFAULT 60,
    timer_session_limit integer DEFAULT 300,
    max_retake_limit integer DEFAULT 1,
    CONSTRAINT settings_pkey PRIMARY KEY (id)
);

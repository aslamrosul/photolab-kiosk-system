-- Add orientation column to Kiosks table
ALTER TABLE public.kiosks 
ADD COLUMN IF NOT EXISTS orientation text DEFAULT 'landscape';

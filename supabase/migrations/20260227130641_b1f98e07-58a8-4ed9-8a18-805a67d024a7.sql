
-- Add whatsapp column to profiles
ALTER TABLE public.profiles ADD COLUMN whatsapp text NOT NULL DEFAULT '';

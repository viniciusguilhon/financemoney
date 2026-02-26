
-- Create app_settings table for admin-configurable settings
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Insert default WhatsApp support button config
INSERT INTO public.app_settings (key, value) VALUES (
  'whatsapp_support',
  '{"enabled": false, "url": "", "label": "Suporte", "color": "hsl(142, 70%, 45%)"}'::jsonb
);

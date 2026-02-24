
-- Templates de bancos gerenciados pelo admin
CREATE TABLE public.bank_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  logo_url text,
  cor text NOT NULL DEFAULT '',
  abbr text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_templates ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler templates
CREATE POLICY "Authenticated users can read bank templates"
  ON public.bank_templates FOR SELECT
  TO authenticated
  USING (true);

-- Templates de cartões gerenciados pelo admin
CREATE TABLE public.card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  image_url text,
  bandeira text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read card templates"
  ON public.card_templates FOR SELECT
  TO authenticated
  USING (true);

-- Storage bucket para imagens dos templates
INSERT INTO storage.buckets (id, name, public) VALUES ('template-images', 'template-images', true);

CREATE POLICY "Anyone can read template images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'template-images');

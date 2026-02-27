
-- Update handle_new_user to include whatsapp from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, email, whatsapp)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email, COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''));
  RETURN NEW;
END;
$function$;

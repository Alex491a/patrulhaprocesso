-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.report_number := 'RPP-' || LPAD(nextval('patrol_report_number_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$;
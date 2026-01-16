-- Add a sequential report number column
ALTER TABLE public.patrol_reports 
ADD COLUMN report_number TEXT UNIQUE;

-- Create a sequence for the report numbers
CREATE SEQUENCE IF NOT EXISTS patrol_report_number_seq START 1;

-- Create a function to generate the report number
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.report_number := 'RPP-' || LPAD(nextval('patrol_report_number_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate report number on insert
CREATE TRIGGER set_report_number
  BEFORE INSERT ON public.patrol_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_report_number();

-- Update existing records with sequential numbers
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.patrol_reports
)
UPDATE public.patrol_reports pr
SET report_number = 'RPP-' || LPAD(numbered.rn::TEXT, 3, '0')
FROM numbered
WHERE pr.id = numbered.id;

-- Update sequence to continue from the last number
SELECT setval('patrol_report_number_seq', COALESCE((SELECT MAX(SUBSTRING(report_number FROM 5)::INT) FROM public.patrol_reports), 0));
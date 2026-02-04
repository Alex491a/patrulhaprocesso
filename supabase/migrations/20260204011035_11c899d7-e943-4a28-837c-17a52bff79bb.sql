-- Drop and recreate the trigger function with better handling
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num INTEGER;
  new_report_number TEXT;
  max_retries INTEGER := 10;
  retry_count INTEGER := 0;
BEGIN
  -- Only generate if report_number is null
  IF NEW.report_number IS NULL THEN
    LOOP
      -- Get the next value from sequence
      next_num := nextval('patrol_report_number_seq');
      new_report_number := 'RPP-' || LPAD(next_num::TEXT, 4, '0');
      
      -- Check if this number already exists
      IF NOT EXISTS (SELECT 1 FROM patrol_reports WHERE report_number = new_report_number) THEN
        NEW.report_number := new_report_number;
        EXIT; -- Exit loop, we found a unique number
      END IF;
      
      retry_count := retry_count + 1;
      IF retry_count >= max_retries THEN
        -- If we can't find a unique number after retries, use timestamp-based fallback
        NEW.report_number := 'RPP-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the sequence to be ahead of any existing numbers
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(report_number FROM 5) AS INTEGER)), 0)
  INTO max_num
  FROM patrol_reports
  WHERE report_number ~ '^RPP-[0-9]+$';
  
  -- Set sequence to be at least max_num + 1
  IF max_num >= (SELECT last_value FROM patrol_report_number_seq) THEN
    PERFORM setval('patrol_report_number_seq', max_num + 1, false);
  END IF;
END $$;
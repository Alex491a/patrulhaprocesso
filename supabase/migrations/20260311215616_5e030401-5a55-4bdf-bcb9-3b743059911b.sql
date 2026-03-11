
ALTER TABLE public.informal_rnc DROP COLUMN count;
ALTER TABLE public.informal_rnc ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;

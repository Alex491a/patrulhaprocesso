-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Authenticated users can delete reports" ON public.patrol_reports;
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON public.patrol_reports;
DROP POLICY IF EXISTS "Authenticated users can view all reports" ON public.patrol_reports;
DROP POLICY IF EXISTS "Authenticated users can update reports" ON public.patrol_reports;

-- Criar políticas permissivas para acesso público (inclui anon e authenticated)
CREATE POLICY "Allow all select on patrol_reports"
ON public.patrol_reports
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow all insert on patrol_reports"
ON public.patrol_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow all update on patrol_reports"
ON public.patrol_reports
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all delete on patrol_reports"
ON public.patrol_reports
FOR DELETE
TO anon, authenticated
USING (true);
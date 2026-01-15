-- Remover a política permissiva de INSERT
DROP POLICY IF EXISTS "Authenticated users can insert reports" ON public.patrol_reports;

-- Criar nova política de INSERT mais segura (apenas usuários autenticados)
CREATE POLICY "Authenticated users can insert reports" 
ON public.patrol_reports 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Garantir que SELECT também está restrito a usuários autenticados
DROP POLICY IF EXISTS "Authenticated users can view reports" ON public.patrol_reports;

CREATE POLICY "Authenticated users can view reports" 
ON public.patrol_reports 
FOR SELECT 
TO authenticated
USING (true);
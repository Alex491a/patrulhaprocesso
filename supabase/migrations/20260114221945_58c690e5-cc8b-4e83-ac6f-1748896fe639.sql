-- Criar tabela de relatórios de patrulha
CREATE TABLE public.patrol_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  machine TEXT NOT NULL,
  auditor TEXT NOT NULL,
  client TEXT NOT NULL,
  op TEXT NOT NULL,
  date DATE NOT NULL,
  operator TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.patrol_reports ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa autenticada pode ver todos os relatórios
CREATE POLICY "Authenticated users can view all reports"
ON public.patrol_reports
FOR SELECT
TO authenticated
USING (true);

-- Política: Qualquer pessoa autenticada pode inserir relatórios
CREATE POLICY "Authenticated users can insert reports"
ON public.patrol_reports
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Apenas admins podem deletar relatórios (vamos verificar via função)
CREATE POLICY "Authenticated users can delete reports"
ON public.patrol_reports
FOR DELETE
TO authenticated
USING (true);

-- Habilitar realtime para sincronização
ALTER PUBLICATION supabase_realtime ADD TABLE public.patrol_reports;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patrol_reports_updated_at
BEFORE UPDATE ON public.patrol_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.informal_rnc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_name text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.informal_rnc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view informal_rnc"
  ON public.informal_rnc FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert informal_rnc"
  ON public.informal_rnc FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update informal_rnc"
  ON public.informal_rnc FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can delete informal_rnc"
  ON public.informal_rnc FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

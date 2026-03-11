import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InformalRncRecord {
  id: string;
  inspector_name: string;
  count: number;
}

export const useInformalRnc = () => {
  const [records, setRecords] = useState<InformalRncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    const { data, error } = await supabase
      .from('informal_rnc')
      .select('id, inspector_name, count')
      .order('inspector_name');

    if (error) {
      console.error('Erro ao buscar RNC informais:', error);
      return;
    }
    setRecords(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addInspector = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const exists = records.some(
      (r) => r.inspector_name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.error('Inspetor já cadastrado');
      return;
    }

    const { error } = await supabase
      .from('informal_rnc')
      .insert({ inspector_name: trimmed, count: 0 });

    if (error) {
      toast.error('Erro ao adicionar inspetor');
      console.error(error);
      return;
    }

    toast.success('Inspetor adicionado');
    await fetchRecords();
  }, [records, fetchRecords]);

  const incrementCount = useCallback(async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;

    const { error } = await supabase
      .from('informal_rnc')
      .update({ count: record.count + 1, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao incrementar RNC');
      console.error(error);
      return;
    }

    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, count: r.count + 1 } : r))
    );
  }, [records]);

  const decrementCount = useCallback(async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (!record || record.count <= 0) return;

    const { error } = await supabase
      .from('informal_rnc')
      .update({ count: record.count - 1, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao decrementar RNC');
      console.error(error);
      return;
    }

    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, count: r.count - 1 } : r))
    );
  }, [records]);

  const getRncCountByInspector = useCallback((inspectorName: string): number => {
    const record = records.find(
      (r) => r.inspector_name.toLowerCase() === inspectorName.toLowerCase()
    );
    return record?.count || 0;
  }, [records]);

  return {
    records,
    isLoading,
    addInspector,
    incrementCount,
    decrementCount,
    getRncCountByInspector,
  };
};

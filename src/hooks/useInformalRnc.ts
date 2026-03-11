import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InformalRncRecord {
  id: string;
  inspector_name: string;
  date: string;
  created_at: string;
}

export const useInformalRnc = () => {
  const [records, setRecords] = useState<InformalRncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    const { data, error } = await supabase
      .from('informal_rnc')
      .select('id, inspector_name, date, created_at')
      .order('date', { ascending: false });

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

  const addRecord = useCallback(async (inspectorName: string, date: string) => {
    const trimmed = inspectorName.trim();
    if (!trimmed || !date) return;

    const { error } = await supabase
      .from('informal_rnc')
      .insert({ inspector_name: trimmed, date });

    if (error) {
      toast.error('Erro ao registrar RNC informal');
      console.error(error);
      return;
    }

    toast.success('RNC informal registrada');
    await fetchRecords();
  }, [fetchRecords]);

  const deleteRecord = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('informal_rnc')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir RNC informal');
      console.error(error);
      return;
    }

    toast.success('RNC informal excluída');
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getRncCountByInspector = useCallback((inspectorName: string): number => {
    return records.filter(
      (r) => r.inspector_name.toLowerCase() === inspectorName.toLowerCase()
    ).length;
  }, [records]);

  return {
    records,
    isLoading,
    addRecord,
    deleteRecord,
    getRncCountByInspector,
  };
};

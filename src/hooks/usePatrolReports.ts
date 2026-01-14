import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PatrolReport, RequirementStats, ProblemByType, DEFAULT_REQUIREMENTS, PatrolRequirement } from '@/types/patrol';
import { Json } from '@/integrations/supabase/types';

interface DbPatrolReport {
  id: string;
  machine: string;
  auditor: string;
  client: string;
  op: string;
  date: string;
  operator: string;
  requirements: PatrolRequirement[];
  approved: boolean;
  created_at: string;
  updated_at: string;
}

const mapDbToPatrolReport = (dbReport: DbPatrolReport): PatrolReport => ({
  id: dbReport.id,
  machine: dbReport.machine,
  itemNumber: '',
  auditors: dbReport.auditor,
  client: dbReport.client,
  opNumber: dbReport.op,
  date: dbReport.date,
  operatorName: dbReport.operator,
  operatorRegistry: '',
  requirements: dbReport.requirements,
  overallStatus: dbReport.approved ? 'APPROVED' : 'REJECTED',
  createdAt: dbReport.created_at,
});

export const usePatrolReports = () => {
  const [reports, setReports] = useState<PatrolReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar relatórios do banco de dados
  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('patrol_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar relatórios:', error);
        return;
      }

      if (data) {
        const mappedReports = data.map((dbReport) => 
          mapDbToPatrolReport(dbReport as unknown as DbPatrolReport)
        );
        setReports(mappedReports);
      }
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Configurar realtime subscription
  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('patrol_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patrol_reports',
        },
        () => {
          // Recarregar dados quando houver mudanças
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  const addReport = useCallback(async (report: Omit<PatrolReport, 'id' | 'createdAt'>) => {
    const hasNok = report.requirements.some((r) => r.status === 'NOK');
    
    const { data, error } = await supabase
      .from('patrol_reports')
      .insert([{
        machine: report.machine,
        auditor: report.auditors,
        client: report.client,
        op: report.opNumber,
        date: report.date,
        operator: report.operatorName,
        requirements: report.requirements as unknown as Json,
        approved: !hasNok,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar relatório:', error);
      throw error;
    }

    return mapDbToPatrolReport(data as unknown as DbPatrolReport);
  }, []);

  const deleteReport = useCallback(async (reportId: string) => {
    const { error } = await supabase
      .from('patrol_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Erro ao deletar relatório:', error);
      throw error;
    }
  }, []);

  const requirementStats = useMemo((): RequirementStats[] => {
    return DEFAULT_REQUIREMENTS.map((req) => {
      let okCount = 0;
      let nokCount = 0;
      let naCount = 0;

      reports.forEach((report) => {
        const requirement = report.requirements.find((r) => r.id === req.id);
        if (requirement) {
          if (requirement.status === 'OK') okCount++;
          else if (requirement.status === 'NOK') nokCount++;
          else naCount++;
        }
      });

      const total = okCount + nokCount;
      const recurrenceRate = total > 0 ? (nokCount / total) * 100 : 0;

      return {
        requirementId: req.id,
        description: req.description,
        okCount,
        nokCount,
        naCount,
        recurrenceRate,
      };
    });
  }, [reports]);

  const problemsByType = useMemo((): ProblemByType[] => {
    const problemCounts = new Map<string, number>();

    reports.forEach((report) => {
      report.requirements.forEach((req) => {
        if (req.status === 'NOK') {
          const currentCount = problemCounts.get(req.description) || 0;
          problemCounts.set(req.description, currentCount + 1);
        }
      });
    });

    const total = Array.from(problemCounts.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(problemCounts.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  const totalReports = reports.length;
  const approvedReports = reports.filter((r) => r.overallStatus === 'APPROVED').length;
  const rejectedReports = reports.filter((r) => r.overallStatus === 'REJECTED').length;
  const approvalRate = totalReports > 0 ? (approvedReports / totalReports) * 100 : 0;

  return {
    reports,
    loading,
    addReport,
    deleteReport,
    requirementStats,
    problemsByType,
    totalReports,
    approvedReports,
    rejectedReports,
    approvalRate,
  };
};

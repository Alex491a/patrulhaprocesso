import { useState, useCallback, useMemo } from 'react';
import { PatrolReport, RequirementStats, ProblemByType, DEFAULT_REQUIREMENTS } from '@/types/patrol';

// Sample data for demonstration
const generateSampleData = (): PatrolReport[] => {
  const machines = ['CNC-01', 'CNC-02', 'TORNO-01', 'FRESA-01', 'RETIFICA-01'];
  const clients = ['Cliente A', 'Cliente B', 'Cliente C', 'Cliente D'];
  const auditors = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira'];
  const operators = ['Carlos Souza', 'Lucas Lima', 'Fernanda Alves', 'Ricardo Mendes'];

  const reports: PatrolReport[] = [];

  for (let i = 0; i < 25; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));

    const requirements = DEFAULT_REQUIREMENTS.map((req) => {
      const random = Math.random();
      let status: 'OK' | 'NOK' | 'N/A';
      if (random > 0.15) {
        status = 'OK';
      } else if (random > 0.05) {
        status = 'NOK';
      } else {
        status = 'N/A';
      }

      return {
        ...req,
        status,
        evidence: status === 'NOK' ? `Evidência do problema #${req.id}` : undefined,
      };
    });

    const hasNok = requirements.some((r) => r.status === 'NOK');

    reports.push({
      id: `RPT-${String(i + 1).padStart(4, '0')}`,
      machine: machines[Math.floor(Math.random() * machines.length)],
      itemNumber: `DES-${Math.floor(Math.random() * 9000) + 1000}`,
      auditors: auditors[Math.floor(Math.random() * auditors.length)],
      client: clients[Math.floor(Math.random() * clients.length)],
      opNumber: `OP-${Math.floor(Math.random() * 9000) + 1000}`,
      date: date.toISOString().split('T')[0],
      operatorName: operators[Math.floor(Math.random() * operators.length)],
      operatorRegistry: String(Math.floor(Math.random() * 9000) + 1000),
      requirements,
      overallStatus: hasNok ? 'REJECTED' : 'APPROVED',
      createdAt: date.toISOString(),
    });
  }

  return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const usePatrolReports = () => {
  const [reports, setReports] = useState<PatrolReport[]>(generateSampleData);

  const addReport = useCallback((report: Omit<PatrolReport, 'id' | 'createdAt'>) => {
    const newReport: PatrolReport = {
      ...report,
      id: `RPT-${String(Date.now()).slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    return newReport;
  }, []);

  const deleteReport = useCallback((reportId: string) => {
    setReports((prev) => prev.filter((report) => report.id !== reportId));
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

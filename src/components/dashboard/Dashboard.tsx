import { useState, useMemo, useCallback } from 'react';
import { FileText, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import { RecurrenceTable } from './RecurrenceTable';
import { ProblemTypeChart } from './ProblemTypeChart';
import { OverallStatusChart } from './OverallStatusChart';
import { InspectorStats } from './InspectorStats';
import { MachineStats } from './MachineStats';
import { MachineNokChart } from './MachineNokChart';
import { PeriodFilter, filterReportsByPeriod } from './PeriodFilter';
import { RequirementStats, ProblemByType, PatrolReport, DEFAULT_REQUIREMENTS } from '@/types/patrol';
import { exportDashboardToPDF } from '@/lib/pdfExport';
import { toast } from 'sonner';

interface DashboardProps {
  totalReports: number;
  approvedReports: number;
  rejectedReports: number;
  approvalRate: number;
  requirementStats: RequirementStats[];
  problemsByType: ProblemByType[];
  reports?: PatrolReport[];
  userRole?: string;
}

export const Dashboard = ({
  totalReports: allTotalReports,
  approvedReports: allApprovedReports,
  rejectedReports: allRejectedReports,
  approvalRate: allApprovalRate,
  requirementStats: allRequirementStats,
  problemsByType: allProblemsByType,
  reports = [],
  userRole,
}: DashboardProps) => {
  const isAdmin = userRole === 'admin';
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [periodLabel, setPeriodLabel] = useState<string>('Todo o período');

  const handlePeriodChange = (start: Date | null, end: Date | null, label: string) => {
    setStartDate(start);
    setEndDate(end);
    setPeriodLabel(label);
  };

  // Filter reports by selected period
  const filteredReports = useMemo(() => {
    return filterReportsByPeriod(reports, startDate, endDate);
  }, [reports, startDate, endDate]);

  // Recalculate stats based on filtered reports
  const { totalReports, approvedReports, rejectedReports, approvalRate } = useMemo(() => {
    const total = filteredReports.length;
    const approved = filteredReports.filter((r) => r.overallStatus === 'APPROVED').length;
    const rejected = filteredReports.filter((r) => r.overallStatus === 'REJECTED').length;
    const rate = total > 0 ? (approved / total) * 100 : 0;

    return { totalReports: total, approvedReports: approved, rejectedReports: rejected, approvalRate: rate };
  }, [filteredReports]);

  // Recalculate requirement stats based on filtered reports
  const requirementStats = useMemo((): RequirementStats[] => {
    return DEFAULT_REQUIREMENTS.map((req) => {
      let okCount = 0;
      let nokCount = 0;
      let naCount = 0;

      filteredReports.forEach((report) => {
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
  }, [filteredReports]);

  // Recalculate problems by type based on filtered reports
  const problemsByType = useMemo((): ProblemByType[] => {
    const problemCounts = new Map<string, number>();

    filteredReports.forEach((report) => {
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
  }, [filteredReports]);

  // Calculate machine stats for PDF export
  const machineStats = useMemo(() => {
    const machineMap = new Map<string, { totalNok: number; audits: number; rejectedAudits: number }>();

    filteredReports.forEach((report) => {
      const machine = report.machine;
      const nokCount = report.requirements.filter((r) => r.status === 'NOK').length;
      const isRejected = report.overallStatus === 'REJECTED';

      const current = machineMap.get(machine) || { totalNok: 0, audits: 0, rejectedAudits: 0 };
      machineMap.set(machine, {
        totalNok: current.totalNok + nokCount,
        audits: current.audits + 1,
        rejectedAudits: current.rejectedAudits + (isRejected ? 1 : 0),
      });
    });

    return Array.from(machineMap.entries())
      .map(([machine, stats]) => ({
        machine,
        ...stats,
        avgNok: stats.audits > 0 ? stats.totalNok / stats.audits : 0,
      }))
      .sort((a, b) => b.totalNok - a.totalNok);
  }, [filteredReports]);

  // Calculate inspector stats for PDF export (admin only)
  const inspectorStats = useMemo(() => {
    if (!isAdmin) return [];

    const inspectorMap = new Map<string, { totalReports: number; totalNok: number }>();

    filteredReports.forEach((report) => {
      const auditor = report.auditors.trim();
      if (!auditor) return;

      const current = inspectorMap.get(auditor) || { totalReports: 0, totalNok: 0 };
      const nokCount = report.requirements.filter((r) => r.status === 'NOK').length;

      inspectorMap.set(auditor, {
        totalReports: current.totalReports + 1,
        totalNok: current.totalNok + nokCount,
      });
    });

    return Array.from(inspectorMap.entries())
      .map(([name, data]) => ({
        name,
        totalReports: data.totalReports,
        totalNok: data.totalNok,
        nokRate: data.totalReports > 0 ? data.totalNok / data.totalReports : 0,
      }))
      .sort((a, b) => b.totalReports - a.totalReports);
  }, [filteredReports, isAdmin]);

  const handleExportPDF = useCallback(() => {
    try {
      exportDashboardToPDF({
        periodLabel,
        totalReports,
        approvedReports,
        rejectedReports,
        approvalRate,
        requirementStats,
        problemsByType,
        machineStats,
        inspectorStats: isAdmin ? inspectorStats : undefined,
        isAdmin,
      });
      toast.success('Dashboard exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar o dashboard');
    }
  }, [periodLabel, totalReports, approvedReports, rejectedReports, approvalRate, requirementStats, problemsByType, machineStats, inspectorStats, isAdmin]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Period Filter */}
      <PeriodFilter onPeriodChange={handlePeriodChange} onExportPDF={handleExportPDF} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Relatórios"
          value={totalReports}
          subtitle={startDate ? 'Período selecionado' : 'Todo o período'}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Aprovados"
          value={approvedReports}
          subtitle={`${approvalRate.toFixed(1)}% de aprovação`}
          icon={CheckCircle2}
          variant="success"
          trend={{ value: 2.5, isPositive: true }}
        />
        <StatCard
          title="Rejeitados"
          value={rejectedReports}
          subtitle="Requer ação corretiva"
          icon={XCircle}
          variant="danger"
        />
        <StatCard
          title="Taxa de Qualidade"
          value={`${approvalRate.toFixed(1)}%`}
          subtitle="Meta: 95%"
          icon={TrendingUp}
          variant={approvalRate >= 95 ? 'success' : 'default'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverallStatusChart approved={approvedReports} rejected={rejectedReports} />
        <ProblemTypeChart data={problemsByType} />
      </div>

      {/* Recurrence Table */}
      <RecurrenceTable stats={requirementStats} />

      {/* Machine Charts and Stats */}
      {filteredReports.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MachineNokChart reports={filteredReports} />
          <MachineStats reports={filteredReports} />
        </div>
      )}

      {/* Inspector Stats - Admin Only */}
      {isAdmin && filteredReports.length > 0 && (
        <InspectorStats reports={filteredReports} />
      )}
    </div>
  );
};

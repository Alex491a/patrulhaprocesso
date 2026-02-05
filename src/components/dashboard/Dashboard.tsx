import { useState, useMemo } from 'react';
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

  const handlePeriodChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Period Filter */}
      <PeriodFilter onPeriodChange={handlePeriodChange} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Relatórios"
          value={totalReports}
          subtitle={startDate ? 'Período selecionado' : 'Últimos 60 dias'}
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

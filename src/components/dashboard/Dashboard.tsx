import { FileText, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import { RecurrenceTable } from './RecurrenceTable';
import { ProblemTypeChart } from './ProblemTypeChart';
import { OverallStatusChart } from './OverallStatusChart';
import { InspectorStats } from './InspectorStats';
import { MachineStats } from './MachineStats';
import { RequirementStats, ProblemByType, PatrolReport } from '@/types/patrol';

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
  totalReports,
  approvedReports,
  rejectedReports,
  approvalRate,
  requirementStats,
  problemsByType,
  reports = [],
  userRole,
}: DashboardProps) => {
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Relatórios"
          value={totalReports}
          subtitle="Últimos 60 dias"
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

      {/* Machine Stats */}
      {reports.length > 0 && (
        <MachineStats reports={reports} />
      )}

      {/* Inspector Stats - Admin Only */}
      {isAdmin && reports.length > 0 && (
        <InspectorStats reports={reports} />
      )}
    </div>
  );
};

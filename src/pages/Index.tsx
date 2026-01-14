import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { NewPatrolForm } from '@/components/form/NewPatrolForm';
import { usePatrolReports } from '@/hooks/usePatrolReports';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    reports,
    addReport,
    requirementStats,
    problemsByType,
    totalReports,
    approvedReports,
    rejectedReports,
    approvalRate,
  } = usePatrolReports();

  const handleNewReport = (report: Parameters<typeof addReport>[0]) => {
    addReport(report);
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            totalReports={totalReports}
            approvedReports={approvedReports}
            rejectedReports={rejectedReports}
            approvalRate={approvalRate}
            requirementStats={requirementStats}
            problemsByType={problemsByType}
          />
        )}

        {activeTab === 'reports' && <ReportsTable reports={reports} />}

        {activeTab === 'new' && <NewPatrolForm onSubmit={handleNewReport} />}
      </main>
    </div>
  );
};

export default Index;

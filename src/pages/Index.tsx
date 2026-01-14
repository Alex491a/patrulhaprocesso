import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { NewPatrolForm } from '@/components/form/NewPatrolForm';
import { usePatrolReports } from '@/hooks/usePatrolReports';
import { SimpleLogin } from '@/components/auth/SimpleLogin';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer return condicional
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

  // Verifica se usuário já está autenticado na sessão
  useEffect(() => {
    const authenticated = sessionStorage.getItem('patrol_authenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleNewReport = (report: Parameters<typeof addReport>[0]) => {
    addReport(report);
    setActiveTab('reports');
  };

  // Mostra tela de login se não autenticado (return condicional DEPOIS de todos os hooks)
  if (!isAuthenticated) {
    return <SimpleLogin onLogin={handleLogin} />;
  }

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

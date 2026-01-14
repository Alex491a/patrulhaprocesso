import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { NewPatrolForm } from '@/components/form/NewPatrolForm';
import { usePatrolReports } from '@/hooks/usePatrolReports';
import { SimpleLogin, UserRole } from '@/components/auth/SimpleLogin';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('inspector');

  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer return condicional
  const {
    reports,
    addReport,
    updateReport,
    deleteReport,
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
    const savedRole = sessionStorage.getItem('patrol_user_role') as UserRole;
    setIsAuthenticated(authenticated);
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  const handleLogin = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleNewReport = async (report: Parameters<typeof addReport>[0]) => {
    try {
      await addReport(report);
      setActiveTab('reports');
    } catch (error) {
      console.error('Erro ao adicionar relatório:', error);
    }
  };

  // Mostra tela de login se não autenticado (return condicional DEPOIS de todos os hooks)
  if (!isAuthenticated) {
    return <SimpleLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} userRole={userRole} />

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

        {activeTab === 'reports' && (
          <ReportsTable 
            reports={reports} 
            userRole={userRole}
            onDeleteReport={deleteReport}
            onUpdateReport={updateReport}
          />
        )}

        {activeTab === 'new' && <NewPatrolForm onSubmit={handleNewReport} />}
      </main>
    </div>
  );
};

export default Index;

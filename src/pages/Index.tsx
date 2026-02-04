import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { NewPatrolForm } from '@/components/form/NewPatrolForm';
import { UserManagement } from '@/components/admin/UserManagement';
import { usePatrolReports } from '@/hooks/usePatrolReports';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const {
    user,
    role,
    isLoading: authLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  } = useAuth();

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

  const handleNewReport = async (report: Parameters<typeof addReport>[0]) => {
    // Let the error propagate to the form for proper handling
    await addReport(report);
    setActiveTab('reports');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm onSignIn={signIn} onSignUp={signUp} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userRole={role}
        userEmail={user?.email}
        onLogout={signOut}
      />

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            totalReports={totalReports}
            approvedReports={approvedReports}
            rejectedReports={rejectedReports}
            approvalRate={approvalRate}
            requirementStats={requirementStats}
            problemsByType={problemsByType}
            reports={reports}
            userRole={role}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTable 
            reports={reports} 
            userRole={role || 'inspector'}
            onDeleteReport={deleteReport}
            onUpdateReport={updateReport}
          />
        )}

        {activeTab === 'new' && <NewPatrolForm onSubmit={handleNewReport} />}

        {activeTab === 'users' && role === 'admin' && <UserManagement />}
      </main>
    </div>
  );
};

export default Index;

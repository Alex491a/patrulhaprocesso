import { ClipboardCheck, BarChart3, FileText, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
const tabs = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: BarChart3
}, {
  id: 'reports',
  label: 'Relatórios',
  icon: FileText
}, {
  id: 'new',
  label: 'Nova Patrulha',
  icon: PlusCircle
}];
export const Header = ({
  activeTab,
  onTabChange
}: HeaderProps) => {
  return <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg text-primary-foreground bg-chart-ok">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Patrulha de Processo</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão de Qualidade</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {tabs.map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} onClick={() => onTabChange(tab.id)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200', activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>;
          })}
          </nav>
        </div>
      </div>
    </header>;
};
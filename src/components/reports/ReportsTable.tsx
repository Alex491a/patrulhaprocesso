import { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Eye, Calendar, User, Settings, Trash2, Pencil, FileDown, X, SlidersHorizontal, CalendarRange } from 'lucide-react';
import { PatrolReport } from '@/types/patrol';
import { cn } from '@/lib/utils';
import { ReportDetailModal } from './ReportDetailModal';
import { EditReportModal } from './EditReportModal';
import { UserRole } from '@/hooks/useAuth';
import { exportSingleReportToPDF, exportMultipleReportsToPDF } from '@/lib/pdfExport';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportsTableProps {
  reports: PatrolReport[];
  userRole?: UserRole;
  onDeleteReport?: (reportId: string) => Promise<void>;
  onUpdateReport?: (report: PatrolReport) => Promise<void>;
}

export const ReportsTable = ({ reports, userRole, onDeleteReport, onUpdateReport }: ReportsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'APPROVED' | 'REJECTED'>('all');
  const [auditorFilter, setAuditorFilter] = useState('');
  const [opFilter, setOpFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'machine' | 'client'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedReport, setSelectedReport] = useState<PatrolReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<PatrolReport | null>(null);
  const [reportToEdit, setReportToEdit] = useState<PatrolReport | null>(null);

  const isAdmin = userRole === 'admin';

  // Get unique auditors for filter dropdown
  const uniqueAuditors = [...new Set(reports.map(r => r.auditors))].filter(Boolean).sort();

  const activeFiltersCount = [auditorFilter, opFilter, startDate, endDate].filter(Boolean).length;

  const filteredReports = reports
    .filter((report) => {
      const matchesSearch =
        report.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.opNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.auditors.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || report.overallStatus === statusFilter;
      const matchesAuditor = !auditorFilter || report.auditors.toLowerCase().includes(auditorFilter.toLowerCase());
      const matchesOp = !opFilter || report.opNumber.toLowerCase().includes(opFilter.toLowerCase());
      
      const reportDate = new Date(report.date);
      const matchesStartDate = !startDate || reportDate >= startDate;
      const matchesEndDate = !endDate || reportDate <= endDate;

      return matchesSearch && matchesStatus && matchesAuditor && matchesOp && matchesStartDate && matchesEndDate;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'machine') {
        comparison = a.machine.localeCompare(b.machine);
      } else if (sortField === 'client') {
        comparison = a.client.localeCompare(b.client);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDeleteConfirm = async () => {
    if (reportToDelete && onDeleteReport) {
      try {
        await onDeleteReport(reportToDelete.id);
      } catch (error) {
        console.error('Erro ao deletar relatório:', error);
      }
      setReportToDelete(null);
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <>
      <div className="card-elevated overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Relatórios de Patrulha</h3>
              <p className="text-sm text-muted-foreground">
                {filteredReports.length} de {reports.length} relatórios
                {isAdmin && <span className="ml-2 text-primary font-medium">(Modo Administrador)</span>}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Export Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileDown className="w-4 h-4" />
                    Exportar PDF
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportMultipleReportsToPDF(filteredReports)}>
                    Exportar todos ({filteredReports.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportMultipleReportsToPDF(filteredReports.filter(r => r.overallStatus === 'APPROVED'))}>
                    Apenas aprovados
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportMultipleReportsToPDF(filteredReports.filter(r => r.overallStatus === 'REJECTED'))}>
                    Apenas rejeitados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Toggle Advanced Filters */}
              <Button 
                variant={showFilters ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-industrial pl-10 w-full sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="input-industrial pl-10 pr-8 appearance-none cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="APPROVED">Aprovados</option>
                  <option value="REJECTED">Rejeitados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-foreground">Filtros Avançados</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAuditorFilter('');
                    setOpFilter('');
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar filtros
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range Filter - Start */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 text-sm",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarRange className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date Range Filter - End */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Data Final</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 text-sm",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarRange className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* OP/Item/Desenho Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nº Item / Desenho / OP</label>
                  <input
                    type="text"
                    placeholder="Ex: OP-12345"
                    value={opFilter}
                    onChange={(e) => setOpFilter(e.target.value)}
                    className="input-industrial w-full text-sm h-9"
                  />
                </div>

                {/* Auditor Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Auditor</label>
                  <select
                    value={auditorFilter}
                    onChange={(e) => setAuditorFilter(e.target.value)}
                    className="input-industrial w-full text-sm appearance-none cursor-pointer h-9"
                  >
                    <option value="">Todos os auditores</option>
                    {uniqueAuditors.map((auditor) => (
                      <option key={auditor} value={auditor}>
                        {auditor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                  ID
                </th>
                <th
                  className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Data
                    <SortIcon field="date" />
                  </div>
                </th>
                <th
                  className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('machine')}
                >
                  <div className="flex items-center gap-1">
                    <Settings className="w-4 h-4" />
                    Máquina
                    <SortIcon field="machine" />
                  </div>
                </th>
                <th
                  className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('client')}
                >
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Cliente
                    <SortIcon field="client" />
                  </div>
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                  OP
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Auditor
                </th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Status
                </th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReports.map((report) => (
                <tr key={report.id} className="table-row-hover">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-medium text-primary">{report.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">
                      {new Date(report.date).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{report.machine}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{report.client}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-muted-foreground">{report.opNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{report.auditors}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                        report.overallStatus === 'APPROVED'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {report.overallStatus === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => exportSingleReportToPDF(report)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                        title="Exportar PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalhes
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setReportToEdit(report)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => setReportToDelete(report)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum relatório encontrado</p>
            </div>
          )}
        </div>
      </div>

      {selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      {reportToEdit && onUpdateReport && (
        <EditReportModal
          report={reportToEdit}
          onSave={onUpdateReport}
          onClose={() => setReportToEdit(null)}
        />
      )}

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir o relatório <strong>{reportToDelete?.id}</strong>?
              <br />
              <span className="text-destructive">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

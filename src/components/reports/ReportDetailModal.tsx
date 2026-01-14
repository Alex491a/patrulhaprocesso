import { X, Calendar, User, Settings, FileText, CheckCircle2, XCircle, Minus } from 'lucide-react';
import { PatrolReport } from '@/types/patrol';
import { cn } from '@/lib/utils';

interface ReportDetailModalProps {
  report: PatrolReport;
  onClose: () => void;
}

export const ReportDetailModal = ({ report, onClose }: ReportDetailModalProps) => {
  const okCount = report.requirements.filter((r) => r.status === 'OK').length;
  const nokCount = report.requirements.filter((r) => r.status === 'NOK').length;
  const naCount = report.requirements.filter((r) => r.status === 'N/A').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-xl',
                report.overallStatus === 'APPROVED'
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {report.overallStatus === 'APPROVED' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{report.id}</h2>
              <p
                className={cn(
                  'text-sm font-medium',
                  report.overallStatus === 'APPROVED' ? 'text-success' : 'text-destructive'
                )}
              >
                {report.overallStatus === 'APPROVED' ? 'Processo Aprovado' : 'Processo Rejeitado'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] scrollbar-thin">
          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(report.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Máquina</p>
                <p className="text-sm font-medium text-foreground">{report.machine}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium text-foreground">{report.client}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">OP</p>
                <p className="text-sm font-medium text-foreground">{report.opNumber}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-muted/20 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground">Item (Desenho)</p>
              <p className="text-sm font-medium text-foreground">{report.itemNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Auditor</p>
              <p className="text-sm font-medium text-foreground">{report.auditors}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Operador</p>
              <p className="text-sm font-medium text-foreground">{report.operatorName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registro</p>
              <p className="text-sm font-medium text-foreground">{report.operatorRegistry}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-center gap-8 p-6 border-b border-border">
            <div className="text-center">
              <div className="badge-ok text-base px-4 py-2">
                <CheckCircle2 className="w-4 h-4 mr-1 inline" />
                {okCount} OK
              </div>
            </div>
            <div className="text-center">
              <div className="badge-nok text-base px-4 py-2">
                <XCircle className="w-4 h-4 mr-1 inline" />
                {nokCount} NOK
              </div>
            </div>
            <div className="text-center">
              <div className="badge-na text-base px-4 py-2">
                <Minus className="w-4 h-4 mr-1 inline" />
                {naCount} N/A
              </div>
            </div>
          </div>

          {/* Requirements List */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Requisitos Auditados
            </h3>
            <div className="space-y-3">
              {report.requirements.map((req) => (
                <div
                  key={req.id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border',
                    req.status === 'OK' && 'bg-success/5 border-success/20',
                    req.status === 'NOK' && 'bg-destructive/5 border-destructive/20',
                    req.status === 'N/A' && 'bg-muted/50 border-border'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0',
                      req.status === 'OK' && 'bg-success/10 text-success',
                      req.status === 'NOK' && 'bg-destructive/10 text-destructive',
                      req.status === 'N/A' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {req.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{req.description}</p>
                    {req.evidence && (
                      <p className="text-xs text-destructive mt-1">Evidência: {req.evidence}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold shrink-0',
                      req.status === 'OK' && 'bg-success/10 text-success',
                      req.status === 'NOK' && 'bg-destructive/10 text-destructive',
                      req.status === 'N/A' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

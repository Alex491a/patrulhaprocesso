import { useState } from 'react';
import { X, CheckCircle2, XCircle, Minus, Save } from 'lucide-react';
import { PatrolReport, PatrolRequirement, PatrolStatus } from '@/types/patrol';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditReportModalProps {
  report: PatrolReport;
  onSave: (report: PatrolReport) => Promise<void>;
  onClose: () => void;
}

export const EditReportModal = ({ report, onSave, onClose }: EditReportModalProps) => {
  const [formData, setFormData] = useState({
    machine: report.machine,
    auditors: report.auditors,
    client: report.client,
    opNumber: report.opNumber,
    date: report.date,
    operatorName: report.operatorName,
  });

  const [requirements, setRequirements] = useState<PatrolRequirement[]>(report.requirements);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (id: number, status: PatrolStatus) => {
    setRequirements((prev) =>
      prev.map((req) =>
        req.id === id
          ? { ...req, status, evidence: status === 'NOK' ? req.evidence : '' }
          : req
      )
    );
  };

  const handleEvidenceChange = (id: number, evidence: string) => {
    setRequirements((prev) =>
      prev.map((req) => (req.id === id ? { ...req, evidence } : req))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.machine || !formData.client || !formData.opNumber || !formData.auditors) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const hasNok = requirements.some((r) => r.status === 'NOK');
      
      const updatedReport: PatrolReport = {
        ...report,
        ...formData,
        requirements,
        overallStatus: hasNok ? 'REJECTED' : 'APPROVED',
      };

      await onSave(updatedReport);
      toast.success('Relatório atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      toast.error('Erro ao atualizar relatório');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-bold text-foreground">Editar Relatório</h2>
            <p className="text-sm text-muted-foreground">{report.reportNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] scrollbar-thin">
            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 border-b border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Máquina <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="machine"
                  value={formData.machine}
                  onChange={handleInputChange}
                  className="input-industrial w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Auditor(es) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="auditors"
                  value={formData.auditors}
                  onChange={handleInputChange}
                  className="input-industrial w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input-industrial w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cliente <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleInputChange}
                  className="input-industrial w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nº da OP <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="opNumber"
                  value={formData.opNumber}
                  onChange={handleInputChange}
                  className="input-industrial w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome do Operador
                </label>
                <input
                  type="text"
                  name="operatorName"
                  value={formData.operatorName}
                  onChange={handleInputChange}
                  className="input-industrial w-full"
                />
              </div>
            </div>

            {/* Requirements */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Requisitos Auditados
              </h3>
              <div className="space-y-3">
                {requirements.map((req) => (
                  <div
                    key={req.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      req.status === 'OK' && 'bg-success/5 border-success/20',
                      req.status === 'NOK' && 'bg-destructive/5 border-destructive/20',
                      req.status === 'N/A' && 'bg-muted/50 border-border'
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-start gap-3 flex-1">
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
                        <p className="text-sm text-foreground">{req.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(req.id, 'OK')}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            req.status === 'OK'
                              ? 'bg-success text-success-foreground shadow-md'
                              : 'bg-success/10 text-success hover:bg-success/20'
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(req.id, 'NOK')}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            req.status === 'NOK'
                              ? 'bg-destructive text-destructive-foreground shadow-md'
                              : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          )}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          NOK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(req.id, 'N/A')}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            req.status === 'N/A'
                              ? 'bg-muted-foreground text-background shadow-md'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                        >
                          <Minus className="w-3.5 h-3.5" />
                          N/A
                        </button>
                      </div>
                    </div>

                    {req.status === 'NOK' && (
                      <div className="mt-3 ml-11">
                        <input
                          type="text"
                          value={req.evidence || ''}
                          onChange={(e) => handleEvidenceChange(req.id, e.target.value)}
                          placeholder="Descreva a evidência do problema..."
                          className="input-industrial w-full border-destructive/50 focus:border-destructive text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary-gradient flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

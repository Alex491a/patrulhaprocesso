import { useState } from 'react';
import { CheckCircle2, XCircle, Minus, Save, RotateCcw } from 'lucide-react';
import { PatrolReport, PatrolRequirement, PatrolStatus, DEFAULT_REQUIREMENTS } from '@/types/patrol';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { validatePatrolReport } from '@/lib/validation';

interface NewPatrolFormProps {
  onSubmit: (report: Omit<PatrolReport, 'id' | 'createdAt' | 'reportNumber'>) => void;
}

const MAX_EVIDENCE_LENGTH = 1000;
const MAX_FIELD_LENGTH = 200;

export const NewPatrolForm = ({ onSubmit }: NewPatrolFormProps) => {
  const [formData, setFormData] = useState({
    machine: '',
    itemNumber: '',
    auditors: '',
    client: '',
    opNumber: '',
    date: new Date().toISOString().split('T')[0],
    operatorName: '',
    operatorRegistry: '',
  });

  const [requirements, setRequirements] = useState<PatrolRequirement[]>(
    DEFAULT_REQUIREMENTS.map((req) => ({
      ...req,
      status: 'OK' as PatrolStatus,
      evidence: '',
    }))
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Limit input length
    const maxLength = name === 'opNumber' ? 50 : MAX_FIELD_LENGTH;
    setFormData((prev) => ({ ...prev, [name]: value.slice(0, maxLength) }));
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
    // Limit evidence length
    const truncatedEvidence = evidence.slice(0, MAX_EVIDENCE_LENGTH);
    setRequirements((prev) =>
      prev.map((req) => (req.id === id ? { ...req, evidence: truncatedEvidence } : req))
    );
  };

  const handleReset = () => {
    setFormData({
      machine: '',
      itemNumber: '',
      auditors: '',
      client: '',
      opNumber: '',
      date: new Date().toISOString().split('T')[0],
      operatorName: '',
      operatorRegistry: '',
    });
    setRequirements(
      DEFAULT_REQUIREMENTS.map((req) => ({
        ...req,
        status: 'OK' as PatrolStatus,
        evidence: '',
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const validation = validatePatrolReport(formData, requirements);
    
    if (!validation.valid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    const hasNok = requirements.some((r) => r.status === 'NOK');

    const report: Omit<PatrolReport, 'id' | 'createdAt' | 'reportNumber'> = {
      ...formData,
      requirements,
      overallStatus: hasNok ? 'REJECTED' : 'APPROVED',
    };

    onSubmit(report);
    toast.success('Relatório registrado com sucesso!');
    handleReset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Informações da Patrulha</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Máquina <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              name="machine"
              value={formData.machine}
              onChange={handleInputChange}
              placeholder="Ex: CNC-01"
              className="input-industrial w-full"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nº do Item (Desenho)
            </label>
            <input
              type="text"
              name="itemNumber"
              value={formData.itemNumber}
              onChange={handleInputChange}
              placeholder="Ex: DES-1234"
              className="input-industrial w-full"
              maxLength={100}
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
              placeholder="Nome do auditor"
              className="input-industrial w-full"
              required
              maxLength={MAX_FIELD_LENGTH}
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
              placeholder="Nome do cliente"
              className="input-industrial w-full"
              required
              maxLength={MAX_FIELD_LENGTH}
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
              placeholder="Ex: OP-1234"
              className="input-industrial w-full"
              required
              maxLength={50}
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
              placeholder="Nome do operador"
              className="input-industrial w-full"
              maxLength={MAX_FIELD_LENGTH}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Registro do Operador
            </label>
            <input
              type="text"
              name="operatorRegistry"
              value={formData.operatorRegistry}
              onChange={handleInputChange}
              placeholder="Nº do registro"
              className="input-industrial w-full"
              maxLength={50}
            />
          </div>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Requisitos Auditados</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Marque o status de cada requisito. Para NOK, informe a evidência.
          </p>
        </div>

        <div className="divide-y divide-border">
          {requirements.map((req) => (
            <div key={req.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Requirement Number & Description */}
                <div className="flex items-start gap-3 flex-1">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                    {req.id}
                  </span>
                  <p className="text-sm text-foreground">{req.description}</p>
                </div>

                {/* Status Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(req.id, 'OK')}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      req.status === 'OK'
                        ? 'bg-success text-success-foreground shadow-md'
                        : 'bg-success/10 text-success hover:bg-success/20'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(req.id, 'NOK')}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      req.status === 'NOK'
                        ? 'bg-destructive text-destructive-foreground shadow-md'
                        : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    )}
                  >
                    <XCircle className="w-4 h-4" />
                    NOK
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(req.id, 'N/A')}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      req.status === 'N/A'
                        ? 'bg-muted-foreground text-background shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    <Minus className="w-4 h-4" />
                    N/A
                  </button>
                </div>
              </div>

              {/* Evidence Input for NOK */}
              {req.status === 'NOK' && (
                <div className="mt-4 ml-11">
                  <input
                    type="text"
                    value={req.evidence || ''}
                    onChange={(e) => handleEvidenceChange(req.id, e.target.value)}
                    placeholder="Descreva a evidência do problema..."
                    className="input-industrial w-full border-destructive/50 focus:border-destructive"
                    maxLength={MAX_EVIDENCE_LENGTH}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {(req.evidence || '').length}/{MAX_EVIDENCE_LENGTH}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Limpar
        </button>
        <button type="submit" className="btn-primary-gradient flex items-center gap-2">
          <Save className="w-4 h-4" />
          Registrar Patrulha
        </button>
      </div>
    </form>
  );
};

export type PatrolStatus = 'OK' | 'NOK' | 'N/A';

export interface PatrolRequirement {
  id: number;
  description: string;
  status: PatrolStatus;
  evidence?: string;
}

export interface PatrolReport {
  id: string;
  machine: string;
  itemNumber: string;
  auditors: string;
  client: string;
  opNumber: string;
  date: string;
  operatorName: string;
  operatorRegistry: string;
  requirements: PatrolRequirement[];
  overallStatus: 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface RequirementStats {
  requirementId: number;
  description: string;
  okCount: number;
  nokCount: number;
  naCount: number;
  recurrenceRate: number;
}

export interface ProblemByType {
  type: string;
  count: number;
  percentage: number;
}

export const DEFAULT_REQUIREMENTS: Omit<PatrolRequirement, 'status' | 'evidence'>[] = [
  { id: 1, description: 'Desenho está em conformidade com a peça produzida' },
  { id: 2, description: 'O desenho adquiri o carimbo de liberação para produção' },
  { id: 3, description: 'Existe informações de auto controle (Freq. Medição, tolerância e outro)' },
  { id: 4, description: 'Revisão do desenho está em conformidade com a apresentada na OP' },
  { id: 5, description: 'Apontamento no PRODWIN está coerente com o número de OP' },
  { id: 6, description: 'Planilha de liberação para produção está assinada e item Aprovado para produção sem restrição' },
  { id: 7, description: 'O plano de controle está sendo devidamente preenchido' },
  { id: 8, description: 'O Plano de controle está descrito na Ordem de Produção e desenho amarelo' },
  { id: 9, description: 'Item possui rastreabilidade e está sendo realizado corretamente (data ou n° operador)' },
  { id: 10, description: 'Todos os instrumentos necessários para controle em processo estão disponíveis' },
  { id: 11, description: 'Instrumentos estão armazenados de forma adequada (ex: longe de ferramentas de corte)' },
  { id: 12, description: 'Operador tem conhecimento para utilização de todos os instrumentos de controle' },
  { id: 13, description: 'Operador tem pleno conhecimento das suas obrigações e evidencia-se que as segue' },
  { id: 14, description: 'Operador tem conhecimento em caso de itens fundido de realizar a inspeção visual após usinado' },
  { id: 15, description: 'Peça que está sendo produzida está devidamente identificada' },
  { id: 16, description: 'Local de trabalho está somente com peças aprovadas, identificação e localização apropriada' },
  { id: 17, description: 'Rebarbação está adequada' },
  { id: 18, description: 'Peça que está sendo fabricada está com todos os dimensionais Aprovados' },
  { id: 19, description: 'Peças estão sendo acondicionadas de maneira a manter a integridade' },
];

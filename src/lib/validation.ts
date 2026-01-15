import { z } from 'zod';

// Password validation schema with strong requirements
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número');

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return { valid: true, message: '' };
  }
  return { valid: false, message: result.error.errors[0]?.message || 'Senha inválida' };
};

// Password strength calculation
export const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Fraca', color: 'bg-destructive' };
  if (score <= 4) return { score, label: 'Média', color: 'bg-warning' };
  return { score, label: 'Forte', color: 'bg-success' };
};

// Patrol requirement validation schema
export const PatrolStatusSchema = z.enum(['OK', 'NOK', 'N/A']);

export const PatrolRequirementSchema = z.object({
  id: z.number().int().positive(),
  description: z.string().min(1).max(500),
  status: PatrolStatusSchema,
  evidence: z.string().max(1000).optional(),
});

export const PatrolRequirementsArraySchema = z.array(PatrolRequirementSchema).min(1).max(50);

// Form data validation
export const PatrolFormDataSchema = z.object({
  machine: z.string().min(1, 'Máquina é obrigatória').max(100),
  itemNumber: z.string().max(100).optional(),
  auditors: z.string().min(1, 'Auditor é obrigatório').max(200),
  client: z.string().min(1, 'Cliente é obrigatório').max(200),
  opNumber: z.string().min(1, 'Nº da OP é obrigatório').max(50),
  date: z.string().min(1, 'Data é obrigatória'),
  operatorName: z.string().max(200).optional(),
  operatorRegistry: z.string().max(50).optional(),
});

export const validatePatrolReport = (formData: unknown, requirements: unknown) => {
  const formResult = PatrolFormDataSchema.safeParse(formData);
  const reqResult = PatrolRequirementsArraySchema.safeParse(requirements);

  const errors: string[] = [];

  if (!formResult.success) {
    errors.push(...formResult.error.errors.map(e => e.message));
  }
  if (!reqResult.success) {
    errors.push(...reqResult.error.errors.map(e => e.message));
  }

  return {
    valid: errors.length === 0,
    errors,
    formData: formResult.success ? formResult.data : null,
    requirements: reqResult.success ? reqResult.data : null,
  };
};

import type { ProjectData, Commitment, CommitmentSourceType, Payment } from '../types';
import { materialTotal } from '../lib/calculations';

function commitmentStatus(pago: number, contratado: number): 'Pendente' | 'Parcial' | 'Pago' {
  if (pago >= contratado && contratado > 0) return 'Pago';
  if (pago > 0) return 'Parcial';
  return 'Pendente';
}

function paymentsForSource(payments: Payment[], sourceType: CommitmentSourceType, sourceId: string): Payment[] {
  return payments.filter(
    (p) => p.sourceType === sourceType && p.sourceId === sourceId && p.status === 'Pago'
  );
}

function sumPaid(payments: Payment[], sourceType: CommitmentSourceType, sourceId: string): number {
  return paymentsForSource(payments, sourceType, sourceId).reduce((a, p) => a + (+p.valor || 0), 0);
}

export function buildCommitments(project: ProjectData): Commitment[] {
  const commitments: Commitment[] = [];
  const stageName = (id: string) => project.obra.find((s) => s.id === id)?.nome || '—';

  // Profissionais / Jobs
  for (const job of project.jobs) {
    const contratado = +job.valor || 0;
    const pago = sumPaid(project.pagamentos, 'PROFESSIONAL', job.id);
    const prof = project.profissionais.find((p) => p.id === job.profissional_id);
    const stage = project.obra.find((s) => s.id === job.etapa_id);
    const ref = `${prof?.nome || 'Profissional'}${stage ? ' — ' + stage.nome : ''}`;
    commitments.push({
      id: `PROFESSIONAL:${job.id}`,
      sourceType: 'PROFESSIONAL',
      sourceId: job.id,
      referencia: ref,
      stageId: job.etapa_id,
      stageName: stageName(job.etapa_id),
      contratado,
      pago,
      saldo: Math.max(0, contratado - pago),
      status: commitmentStatus(pago, contratado),
      vencimento: '',
    });
  }

  // Materiais
  for (const mat of project.materiais) {
    const contratado = materialTotal(mat);
    const pago = sumPaid(project.pagamentos, 'MATERIAL', mat.id);
    commitments.push({
      id: `MATERIAL:${mat.id}`,
      sourceType: 'MATERIAL',
      sourceId: mat.id,
      referencia: mat.nome,
      stageId: mat.etapa_id,
      stageName: stageName(mat.etapa_id),
      contratado,
      pago,
      saldo: Math.max(0, contratado - pago),
      status: commitmentStatus(pago, contratado),
      vencimento: mat.data || '',
    });
  }

  // Equipamentos
  for (const eq of project.equipamentos) {
    const contratado = +eq.valor || 0;
    const pago = sumPaid(project.pagamentos, 'EQUIPMENT', eq.id);
    commitments.push({
      id: `EQUIPMENT:${eq.id}`,
      sourceType: 'EQUIPMENT',
      sourceId: eq.id,
      referencia: eq.nome,
      stageId: eq.etapa_id,
      stageName: stageName(eq.etapa_id),
      contratado,
      pago,
      saldo: Math.max(0, contratado - pago),
      status: commitmentStatus(pago, contratado),
      vencimento: eq.entrega || '',
    });
  }

  return commitments;
}

export function commitmentPayments(payments: Payment[], sourceType: CommitmentSourceType, sourceId: string): Payment[] {
  return paymentsForSource(payments, sourceType, sourceId);
}

export function totalPaidForEntity(payments: Payment[], sourceType: CommitmentSourceType, sourceId: string): number {
  return sumPaid(payments, sourceType, sourceId);
}

export function totalPaidForStage(payments: Payment[], stageId: string): number {
  return payments
    .filter((p) => p.stageId === stageId && p.status === 'Pago')
    .reduce((a, p) => a + (+p.valor || 0), 0);
}

export function historyPayments(payments: Payment[]): Payment[] {
  return payments
    .filter((p) => p.status === 'Pago' && p.sourceType !== 'LEGACY')
    .sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''));
}

export function legacyPayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => p.sourceType === 'LEGACY');
}

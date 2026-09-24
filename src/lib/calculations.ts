import type {
  Stage,
  Job,
  Material,
  Equipment,
  Unforeseen,
  Payment,
  ChecklistItem,
  Professional,
  ProjectData,
} from '../types';
import { isoToday, dayDiff } from './format';

export function materialTotal(m: Material): number {
  return (+m.quantidade || 0) * (+m.unitario || 0);
}

export function unforeseenTotal(items: Unforeseen[]): number {
  return items.reduce((a, x) => a + (+x.valor || 0), 0);
}

export function paymentDue(payments: Payment[]): number {
  return payments
    .filter((x) => x.status !== 'Pago' && x.sourceType !== 'LEGACY' && x.sourceType !== null)
    .reduce((a, x) => a + (+x.valor || 0), 0);
}

export function stageContratado(
  stage: Stage,
  jobs: Job[],
  materials: Material[],
  equipments: Equipment[]
): number {
  const jobsTotal = jobs
    .filter((j) => j.etapa_id === stage.id)
    .reduce((a, j) => a + (+j.valor || 0), 0);
  const matsTotal = materials
    .filter((m) => m.etapa_id === stage.id)
    .reduce((a, m) => a + materialTotal(m), 0);
  const eqTotal = equipments
    .filter((e) => e.etapa_id === stage.id)
    .reduce((a, e) => a + (+e.valor || 0), 0);
  return jobsTotal + matsTotal + eqTotal;
}

export function equipmentPago(payments: Payment[]): number {
  return payments
    .filter((x) => x.sourceType === 'EQUIPMENT' && x.status === 'Pago')
    .reduce((a, x) => a + (+x.valor || 0), 0);
}

export function stageEquipmentPago(
  stage: Stage,
  _equipments: Equipment[],
  payments: Payment[]
): number {
  return payments
    .filter((x) => x.sourceType === 'EQUIPMENT' && x.stageId === stage.id && x.status === 'Pago')
    .reduce((a, x) => a + (+x.valor || 0), 0);
}

export function stagePago(
  stage: Stage,
  _jobs: Job[],
  _materials: Material[],
  payments: Payment[]
): number {
  return payments
    .filter((x) => x.stageId === stage.id && x.status === 'Pago' && x.sourceType !== 'LEGACY')
    .reduce((a, x) => a + (+x.valor || 0), 0);
}

export function stageEquipment(
  stage: Stage,
  equipments: Equipment[]
): number {
  return equipments
    .filter((e) => e.etapa_id === stage.id)
    .reduce((a, e) => a + (+e.valor || 0), 0);
}

export function responsaveisEtapa(
  stageId: string,
  jobs: Job[],
  professionals: Professional[]
): Professional[] {
  const profIds = [...new Set(
    jobs
      .filter((j) => String(j.etapa_id) === String(stageId))
      .map((j) => String(j.profissional_id))
  )];
  return profIds
    .map((id) => professionals.find((p) => String(p.id) === id))
    .filter(Boolean) as Professional[];
}

export function projectProgress(project: ProjectData): number {
  return project.obra.length
    ? Math.round(
        project.obra.reduce((a, x) => a + (+x.progresso || 0), 0) /
          project.obra.length
      )
    : 0;
}

export interface ProjectTotals {
  previsto: number;
  contratado: number;
  pago: number;
  apagar: number;
  eq: number;
  eqPago: number;
  adm: number;
  prog: number;
  materiais: number;
  maoDeObra: number;
  maoDeObraPago: number;
  materiaisPago: number;
  extras: number;
  budget: number;
  available: number;
  saldoFinanceiro: number;
}

export function projectTotals(project: ProjectData): ProjectTotals {
  const maoDeObra = project.jobs.reduce((a, j) => a + (+j.valor || 0), 0);
  const materiais = project.materiais.reduce((a, m) => a + materialTotal(m), 0);
  const eq = project.equipamentos.reduce((a, e) => a + (+e.valor || 0), 0);
  const pagoFromPayments = project.pagamentos
    .filter((x) => x.status === 'Pago' && x.sourceType !== 'LEGACY')
    .reduce((a, x) => a + (+x.valor || 0), 0);
  const maoDeObraPago = project.pagamentos
    .filter((x) => x.sourceType === 'PROFESSIONAL' && x.status === 'Pago')
    .reduce((a, x) => a + (+x.valor || 0), 0);
  const materiaisPago = project.pagamentos
    .filter((x) => x.sourceType === 'MATERIAL' && x.status === 'Pago')
    .reduce((a, x) => a + (+x.valor || 0), 0);
  const eqPago = equipmentPago(project.pagamentos);
  const adm = project.admin.reduce((a, x) => a + (+x.pago || 0), 0);
  const extras = unforeseenTotal(project.imprevistos);
  const contratado = maoDeObra + materiais + eq;
  const pago = pagoFromPayments;
  const prog = project.obra.length
    ? Math.round(
        project.obra.reduce((a, x) => a + (+x.progresso || 0), 0) /
          project.obra.length
      )
    : 0;
  const budget = +project.config.orcamento || 0;
  const available = budget - contratado - extras;
  return {
    previsto: contratado,
    contratado,
    pago,
    apagar: Math.max(0, contratado + extras - pago),
    eq,
    eqPago,
    adm,
    prog,
    materiais,
    maoDeObra,
    maoDeObraPago,
    materiaisPago,
    extras,
    budget,
    available,
    saldoFinanceiro: budget - pago,
  };
}

export interface StageSituation {
  label: string;
  cls: string;
}

export function autoSituation(stage: Stage, today: string): StageSituation {
  if (stage.status === 'Concluído' || (+stage.progresso || 0) >= 100)
    return { label: 'Concluído', cls: 'auto-ok' };
  if (stage.fim && stage.fim < today)
    return { label: 'Atrasado', cls: 'auto-late' };
  if (stage.fim) {
    const d = dayDiff(today, stage.fim);
    if (d !== null && d <= 3) return { label: 'Atenção', cls: 'gold' };
  }
  return { label: 'Dentro do prazo', cls: 'auto-ok' };
}

export function checklistStats(
  checklist: ChecklistItem[]
): { total: number; done: number; pct: number } {
  const total = checklist.length;
  const done = checklist.filter((x) => x.feito).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function categoryStats(
  project: ProjectData
): Record<string, { prev: number; real: number }> {
  const m: Record<string, { prev: number; real: number }> = {};
  project.obra.forEach((s) => {
    const k = s.categoria || 'Outros';
    if (!m[k]) m[k] = { prev: 0, real: 0 };
    m[k].prev += +s.previsto || 0;
    m[k].real += stageContratado(s, project.jobs, project.materiais, project.equipamentos);
  });
  return m;
}

export interface FinanceMetrics {
  budget: number;
  comprometido: number;
  pago: number;
  apagar: number;
  imprevistos: number;
  apagarAgendado: number;
  saldoProjetado: number;
  saldoFinanceiro: number;
  adm: number;
  over: boolean;
  overAmount: number;
  comprometidoPct: number;
}

export function financeMetrics(project: ProjectData): FinanceMetrics {
  const t = projectTotals(project);
  const imprevistos = unforeseenTotal(project.imprevistos);
  const comprometido = t.contratado + imprevistos;
  const over = t.budget > 0 && comprometido > t.budget;
  const overAmount = over ? comprometido - t.budget : 0;
  return {
    budget: t.budget,
    comprometido,
    pago: t.pago,
    apagar: t.apagar,
    imprevistos,
    apagarAgendado: paymentDue(project.pagamentos),
    saldoProjetado: t.budget - comprometido,
    saldoFinanceiro: t.saldoFinanceiro,
    adm: t.adm,
    over,
    overAmount,
    comprometidoPct: t.budget > 0 ? Math.round((comprometido / t.budget) * 100) : 0,
  };
}

export interface DashboardMetrics {
  late: Stage[];
  attention: Stage[];
  next7: Stage[];
  openIssues: Unforeseen[];
  due7: Payment[];
  due7Total: number;
  over: boolean;
  finalPct: number;
  available: number;
}

export function dashboardMetrics(project: ProjectData): DashboardMetrics {
  const t = projectTotals(project);
  const today = isoToday();
  const late = project.obra.filter(
    (x) => autoSituation(x, today).label === 'Atrasado'
  );
  const attention = project.obra.filter(
    (x) => autoSituation(x, today).label === 'Atenção'
  );
  const next7 = project.obra
    .filter((x) => {
      if (!x.inicio || x.status === 'Concluído') return false;
      const d = dayDiff(today, x.inicio);
      return d !== null && d >= 0 && d <= 7;
    })
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const openIssues = project.imprevistos.filter(
    (x) => x.status !== 'Resolvido'
  );
  const due7 = project.pagamentos.filter((x) => {
    if (x.status === 'Pago' || !x.vencimento) return false;
    const d = dayDiff(today, x.vencimento);
    return d !== null && d >= 0 && d <= 7;
  });
  const due7Total = due7.reduce((a, x) => a + (+x.valor || 0), 0);
  const over =
    t.budget > 0 && t.contratado + unforeseenTotal(project.imprevistos) > t.budget;
  const cl = checklistStats(project.checklist);
  return {
    late,
    attention,
    next7,
    openIssues,
    due7,
    due7Total,
    over,
    finalPct: cl.pct,
    available: t.available,
  };
}

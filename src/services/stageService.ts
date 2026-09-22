import { supabase } from '../lib/supabase';
import type { Stage } from '../types';

export interface StageRow {
  id: string;
  project_id: string;
  nome: string;
  categoria: string;
  prioridade: string;
  status: string;
  progresso: number;
  previsto: number;
  inicio: string | null;
  fim: string | null;
  fim_real: string | null;
  dependencia: string | null;
  profissional_id: string | null;
  observacao: string;
}

export interface StageChecklistRow {
  id: string;
  project_id: string;
  stage_id: string;
  label: string;
  completed: boolean;
  sort_order: number;
}

const DEFAULT_CHECKLIST_LABELS = [
  'Serviço executado',
  'Serviço conferido',
  'Ambiente limpo',
  'Pagamento conferido',
  'Sem pendências',
];

export function mapStageFromDb(row: StageRow, checklists: StageChecklistRow[]): Stage {
  const cl = checklists.filter((c) => c.stage_id === row.id).sort((a, b) => a.sort_order - b.sort_order);
  const getCl = (label: string) => cl.find((c) => c.label === label)?.completed ?? false;
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    prioridade: row.prioridade,
    dependencia: row.dependencia || '',
    status: row.status,
    progresso: row.progresso,
    previsto: Number(row.previsto) || 0,
    inicio: row.inicio || '',
    fim: row.fim || '',
    profissionalId: row.profissional_id || null,
    observacao: row.observacao || '',
    fimReal: row.fim_real || '',
    checkServico: getCl('Serviço executado'),
    checkConferido: getCl('Serviço conferido'),
    checkLimpo: getCl('Ambiente limpo'),
    checkPagamento: getCl('Pagamento conferido'),
    checkPendencias: getCl('Sem pendências'),
  };
}

export async function getStages(projectId: string): Promise<Stage[]> {
  const [stageRes, clRes] = await Promise.all([
    supabase.from('stages').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    supabase.from('stage_checklist').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }),
  ]);
  if (stageRes.error) throw stageRes.error;
  if (clRes.error) throw clRes.error;
  const stages = (stageRes.data || []) as StageRow[];
  const checklists = (clRes.data || []) as StageChecklistRow[];
  return stages.map((s) => mapStageFromDb(s, checklists));
}

export async function createStage(projectId: string, data: {
  nome: string;
  categoria: string;
  prioridade: string;
  dependencia: string;
  status: string;
  progresso: number;
  inicio: string;
  fim: string;
  observacao: string;
}): Promise<Stage> {
  const { data: row, error } = await supabase.from('stages').insert({
    project_id: projectId,
    nome: data.nome,
    categoria: data.categoria,
    prioridade: data.prioridade,
    status: data.status,
    progresso: data.progresso,
    previsto: 0,
    inicio: data.inicio || null,
    fim: data.fim || null,
    dependencia: data.dependencia || null,
    observacao: data.observacao,
  }).select('*').single();
  if (error) throw error;

  const stageRow = row as StageRow;

  // Create default checklist items
  const clItems = DEFAULT_CHECKLIST_LABELS.map((label, i) => ({
    project_id: projectId,
    stage_id: stageRow.id,
    label,
    completed: false,
    sort_order: i + 1,
  }));
  const { error: clError } = await supabase.from('stage_checklist').insert(clItems);
  if (clError) throw clError;

  return mapStageFromDb(stageRow, []);
}

export async function updateStage(stageId: string, data: {
  nome: string;
  categoria: string;
  prioridade: string;
  dependencia: string;
  status: string;
  progresso: number;
  inicio: string;
  fim: string;
  observacao: string;
}): Promise<void> {
  const { error } = await supabase.from('stages').update({
    nome: data.nome,
    categoria: data.categoria,
    prioridade: data.prioridade,
    dependencia: data.dependencia || null,
    status: data.status,
    progresso: data.progresso,
    inicio: data.inicio || null,
    fim: data.fim || null,
    observacao: data.observacao,
  }).eq('id', stageId);
  if (error) throw error;
}

export async function deleteStage(stageId: string): Promise<void> {
  const { error } = await supabase.from('stages').delete().eq('id', stageId);
  if (error) throw error;
}

export async function toggleStageChecklist(
  stageId: string,
  label: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from('stage_checklist')
    .update({ completed })
    .eq('stage_id', stageId)
    .eq('label', label);
  if (error) throw error;
}

export async function finishStage(stageId: string): Promise<void> {
  const { error: stageError } = await supabase
    .from('stages')
    .update({ status: 'Concluído', progresso: 100, fim_real: new Date().toISOString().slice(0, 10) })
    .eq('id', stageId);
  if (stageError) throw stageError;

  const { error: clError } = await supabase
    .from('stage_checklist')
    .update({ completed: true })
    .eq('stage_id', stageId);
  if (clError) throw clError;
}

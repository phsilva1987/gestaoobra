import { supabase } from '../lib/supabase';
import type { ChecklistItem } from '../types';

export interface ProjectChecklistRow {
  id: string;
  project_id: string;
  nome: string;
  feito: boolean;
  source_obra_id: string | null;
  sort_order: number;
}

export function mapChecklistFromDb(row: ProjectChecklistRow): ChecklistItem {
  return {
    id: row.id,
    nome: row.nome,
    feito: row.feito,
    auto: false,
    sourceObraId: row.source_obra_id || null,
  };
}

export async function getProjectChecklist(projectId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('project_checklist')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return ((data || []) as ProjectChecklistRow[]).map(mapChecklistFromDb);
}

export async function createChecklistItem(projectId: string, nome: string): Promise<ChecklistItem> {
  const { data: row, error } = await supabase
    .from('project_checklist')
    .insert({
      project_id: projectId,
      nome,
      feito: false,
    })
    .select('*').single();
  if (error) throw error;
  return mapChecklistFromDb(row as ProjectChecklistRow);
}

export async function updateChecklistItem(id: string, feito: boolean): Promise<void> {
  const { error } = await supabase
    .from('project_checklist')
    .update({ feito })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.from('project_checklist').delete().eq('id', id);
  if (error) throw error;
}

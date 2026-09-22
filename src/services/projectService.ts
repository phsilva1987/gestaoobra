import { supabase } from '../lib/supabase';
import type { ProjectData } from '../types';
import type { ProjectFormData } from '../components/projects/ProjectForm';
import type { ProjectSettingsFormData } from '../components/settings/ProjectSettingsForm';
import { mapProjectFromDb, mapProjectToDb, type ProjectRow } from './mappers';

export async function getProjects(): Promise<ProjectData[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data) return [];
  return (data as ProjectRow[]).map(mapProjectFromDb);
}

export async function getProjectById(id: string): Promise<ProjectData | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapProjectFromDb(data as ProjectRow);
}

export async function createProject(data: ProjectFormData): Promise<ProjectData> {
  const { data: result, error } = await supabase.rpc('create_project', {
    p_name: data.nome,
    p_type: data.tipo,
    p_orcamento: data.config.orcamento,
    p_data_inicio: data.config.inicio || null,
    p_data_fim: data.config.fim || null,
  });

  if (error) throw error;
  if (!result) throw new Error('Falha ao criar projeto');

  const project = mapProjectFromDb(result as ProjectRow);

  // Update with full config fields that create_project doesn't set
  const updateData = mapProjectToDb(data);
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      status: data.status,
      empresa: updateData.empresa,
      documento: updateData.documento,
      responsavel: updateData.responsavel,
      telefone: updateData.telefone,
      email: updateData.email,
      endereco: updateData.endereco,
      cidade: updateData.cidade,
      resp_obra: updateData.resp_obra,
      cover_image_path: updateData.cover_image_path,
    })
    .eq('id', project.id);

  if (updateError) throw updateError;

  // Re-fetch to get the fully updated row
  const full = await getProjectById(project.id);
  return full || project;
}

export async function updateProject(
  id: string,
  data: ProjectSettingsFormData
): Promise<void> {
  const updateData = mapProjectToDb(data);
  const { error } = await supabase
    .from('projects')
    .update({
      name: updateData.name,
      type: updateData.type,
      status: updateData.status,
      empresa: updateData.empresa,
      documento: updateData.documento,
      responsavel: updateData.responsavel,
      telefone: updateData.telefone,
      email: updateData.email,
      endereco: updateData.endereco,
      cidade: updateData.cidade,
      resp_obra: updateData.resp_obra,
      orcamento: updateData.orcamento,
      data_inicio: updateData.data_inicio,
      data_fim: updateData.data_fim,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function updateProjectFull(
  id: string,
  data: ProjectFormData
): Promise<void> {
  const updateData = mapProjectToDb(data);
  const { error } = await supabase
    .from('projects')
    .update({
      name: updateData.name,
      type: updateData.type,
      status: updateData.status,
      empresa: updateData.empresa,
      documento: updateData.documento,
      responsavel: updateData.responsavel,
      telefone: updateData.telefone,
      email: updateData.email,
      endereco: updateData.endereco,
      cidade: updateData.cidade,
      resp_obra: updateData.resp_obra,
      orcamento: updateData.orcamento,
      data_inicio: updateData.data_inicio,
      data_fim: updateData.data_fim,
      cover_image_path: updateData.cover_image_path,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function updateProjectImage(
  id: string,
  coverImagePath: string
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ cover_image_path: coverImagePath })
    .eq('id', id);

  if (error) throw error;
}

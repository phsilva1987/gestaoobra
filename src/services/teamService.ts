import { supabase } from '../lib/supabase';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  globalRole: string;
  projectRole: string;
  status: string;
}

export interface ProfileSearchResult {
  id: string;
  name: string;
  email: string;
}

export async function getProjectMembers(projectId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase.rpc('get_project_members', { p_project_id: projectId });
  if (error) throw error;

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.user_id as string,
    name: (row.name as string) || '',
    email: (row.email as string) || '',
    globalRole: (row.global_role as string) || 'operator',
    projectRole: (row.project_role as string) || 'operator',
    status: 'Ativo',
  }));
}

export async function searchProfiles(query: string, excludeProjectId?: string): Promise<ProfileSearchResult[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('search_profiles', { p_query: query });
  if (rpcError) throw rpcError;
  let results = (rpcData || []) as ProfileSearchResult[];

  if (excludeProjectId) {
    const { data: existing } = await supabase
      .from('project_operators')
      .select('user_id')
      .eq('project_id', excludeProjectId);
    const excludeIds = new Set((existing || []).map((r) => r.user_id));
    results = results.filter((r) => !excludeIds.has(r.id));
  }

  return results;
}

export async function addProjectMember(projectId: string, userId: string, role: string = 'operator'): Promise<void> {
  const { error } = await supabase
    .from('project_operators')
    .insert({
      project_id: projectId,
      user_id: userId,
      role,
    });
  if (error) {
    if (error.code === '23505') throw new Error('Este usuário já pertence ao projeto.');
    throw error;
  }
}

export async function updateProjectMemberRole(projectId: string, userId: string, role: string): Promise<void> {
  const { error } = await supabase
    .from('project_operators')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_operators')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) {
    if (error.message.includes('last') || error.message.includes('último')) {
      throw new Error('Não é possível remover o último administrador do projeto.');
    }
    throw error;
  }
}

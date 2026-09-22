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
  const { data, error } = await supabase
    .from('project_operators')
    .select(`
      user_id,
      role,
      profiles!inner(id, name, email, role)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown>;
    return {
      id: profile.id as string,
      name: (profile.name as string) || '',
      email: (profile.email as string) || '',
      globalRole: (profile.role as string) || 'operator',
      projectRole: row.role as string,
      status: 'Ativo',
    };
  });
}

export async function searchProfiles(query: string, excludeProjectId?: string): Promise<ProfileSearchResult[]> {
  let q = supabase
    .from('profiles')
    .select('id, name, email')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

  if (excludeProjectId) {
    const { data: existing } = await supabase
      .from('project_operators')
      .select('user_id')
      .eq('project_id', excludeProjectId);
    const excludeIds = (existing || []).map((r) => r.user_id);
    if (excludeIds.length > 0) {
      q = q.not('id', 'in', `(${excludeIds.join(',')})`);
    }
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as ProfileSearchResult[];
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

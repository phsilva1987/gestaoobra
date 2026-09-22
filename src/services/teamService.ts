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

export async function inviteProjectMember(
  projectId: string,
  email: string,
  name: string,
  projectRole: string = 'operator'
): Promise<{ ok: boolean; invited: boolean; message: string }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-project-user`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email,
      name,
      project_id: projectId,
      project_role: projectRole,
    }),
  });

  const result = await resp.json();

  if (!resp.ok) {
    throw new Error(result.error || 'Não foi possível enviar o convite.');
  }

  return {
    ok: true,
    invited: result.invited,
    message: result.message,
  };
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

export interface AdminUserOverviewRow {
  user_id: string;
  name: string;
  email: string;
  global_role: string;
  project_id: string | null;
  project_name: string | null;
  project_role: string | null;
}

export async function getAdminUsersOverview(): Promise<AdminUserOverviewRow[]> {
  const { data, error } = await supabase.rpc('get_admin_users_overview');
  if (error) throw error;
  return (data || []) as AdminUserOverviewRow[];
}

export async function createSystemUser(
  name: string,
  email: string,
  password: string,
  role: string
): Promise<{ ok: boolean; message: string }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-system-user`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ name, email, password, role }),
  });

  const result = await resp.json();

  if (!resp.ok) {
    throw new Error(result.error || 'Não foi possível criar o usuário.');
  }

  return {
    ok: true,
    message: result.message || 'Usuário criado com sucesso.',
  };
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: 'reset_password', user_id: userId, new_password: newPassword }),
  });

  const result = await resp.json();
  if (!resp.ok) {
    throw new Error(result.error || 'Não foi possível redefinir a senha.');
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: 'delete', user_id: userId }),
  });

  const result = await resp.json();
  if (!resp.ok) {
    throw new Error(result.error || 'Não foi possível excluir o usuário.');
  }
}

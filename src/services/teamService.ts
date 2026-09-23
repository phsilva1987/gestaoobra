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

async function getValidSessionToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) throw new Error('Sessão expirada. Faça login novamente.');

  const { error: userError } = await supabase.auth.getUser(session.access_token);
  if (!userError) return session.access_token;

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed.session) {
    await supabase.auth.signOut();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return refreshed.session.access_token;
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
    .insert({ project_id: projectId, user_id: userId, role });
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
): Promise<{ ok: boolean; message: string }> {
  const token = await getValidSessionToken();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-project-user`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, name, project_id: projectId, project_role: projectRole }),
  });
  const result = await resp.json();
  if (!resp.ok) throw new Error(result.error || 'Não foi possível enviar o convite.');
  return { ok: true, message: result.message || 'Convite processado.' };
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('project_operators').delete().eq('project_id', projectId).eq('user_id', userId);
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
): Promise<{ ok: boolean; userId: string | null; message: string }> {
  const token = await getValidSessionToken();
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
  if (!resp.ok) throw new Error(result.error || 'Não foi possível criar o usuário.');
  return { ok: true, userId: (result.user_id as string) || null, message: result.message || 'Usuário criado com sucesso.' };
}

async function callManageUser(userId: string, body: Record<string, string>): Promise<void> {
  const token = await getValidSessionToken();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ ...body, user_id: userId }),
  });
  const result = await resp.json();
  if (!resp.ok) throw new Error(result.error || 'Não foi possível concluir a ação.');
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await callManageUser(userId, { action: 'reset_password', new_password: newPassword });
}

export async function deleteUser(userId: string): Promise<void> {
  await callManageUser(userId, { action: 'delete' });
}

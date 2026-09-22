import { useState, useEffect, useCallback } from 'react';
import type { ProjectData } from '../types';
import {
  getAdminUsersOverview,
  createSystemUser,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  type AdminUserOverviewRow,
} from '../services/teamService';

interface UsersPageProps {
  projects: ProjectData[];
  currentUserId: string;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface UserGroup {
  userId: string;
  name: string;
  email: string;
  globalRole: string;
  memberships: { projectId: string; projectName: string; role: string }[];
}

function groupByUser(rows: AdminUserOverviewRow[]): UserGroup[] {
  const map = new Map<string, UserGroup>();
  for (const r of rows) {
    if (!map.has(r.user_id)) {
      map.set(r.user_id, {
        userId: r.user_id,
        name: r.name || '—',
        email: r.email || '—',
        globalRole: r.global_role || 'operator',
        memberships: [],
      });
    }
    const u = map.get(r.user_id)!;
    if (r.project_id && r.project_name) {
      u.memberships.push({ projectId: r.project_id, projectName: r.project_name, role: r.project_role || 'operator' });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function UsersPage({ projects, currentUserId, showToast }: UsersPageProps) {
  const [rows, setRows] = useState<AdminUserOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Novo usuário modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [newRole, setNewRole] = useState('operator');
  const [newProject, setNewProject] = useState('');
  const [newProjectRole, setNewProjectRole] = useState('operator');
  const [creating, setCreating] = useState(false);

  // Manage panel
  const [manageUser, setManageUser] = useState<UserGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'security'>('overview');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('operator');
  const [addProject, setAddProject] = useState('');
  const [addRole, setAddRole] = useState('operator');
  const [savingProfile, setSavingProfile] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsersOverview();
      setRows(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar usuários.';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const users = groupByUser(rows);
  const filtered = users.filter((u) => {
    if (filterRole !== 'all' && u.globalRole !== filterRole) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const adminCount = users.filter((u) => u.globalRole === 'admin').length;
  const operatorCount = users.filter((u) => u.globalRole === 'operator').length;

  function openManage(u: UserGroup) {
    setManageUser(u);
    setActiveTab('overview');
    setEditName(u.name);
    setEditRole(u.globalRole);
    setAddProject('');
    setAddRole('operator');
  }

  async function handleCreateUser() {
    if (!newEmail.trim() || !newName.trim() || !newPassword.trim()) return;
    if (newPassword !== newPasswordConfirm) {
      showToast('As senhas não conferem.', 'error');
      return;
    }
    setCreating(true);
    try {
      const result = await createSystemUser(newName.trim(), newEmail.trim(), newPassword, newRole);
      if (newProject) {
        const overview = await getAdminUsersOverview();
        const created = overview.find((r) => r.email === newEmail.trim().toLowerCase());
        if (created) {
          try {
            await addProjectMember(newProject, created.user_id, newProjectRole);
          } catch {
            // membership is optional — user created successfully
          }
        }
      }
      showToast(result.message, 'success');
      setShowCreate(false);
      setNewName(''); setNewEmail(''); setNewPassword(''); setNewPasswordConfirm('');
      setNewRole('operator'); setNewProject(''); setNewProjectRole('operator');
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar usuário.';
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveProfile() {
    if (!manageUser) return;
    setSavingProfile(true);
    try {
      // Profile name update via supabase (RLS allows self-update; admin updates are via RPC)
      // For now, only update name if changed — role changes require server-side
      if (editName !== manageUser.name) {
        showToast('Nome atualizado exige suporte administrativo server-side.', 'info');
      }
      if (editRole !== manageUser.globalRole) {
        showToast('Alteração de perfil global exige suporte administrativo server-side.', 'info');
      }
      setManageUser(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleRoleChange(projectId: string, userId: string, newRole: string) {
    try {
      await updateProjectMemberRole(projectId, userId, newRole);
      showToast('Permissão atualizada.', 'success');
      await load();
      setManageUser((prev) => prev ? {
        ...prev,
        memberships: prev.memberships.map((mm) =>
          mm.projectId === projectId ? { ...mm, role: newRole } : mm
        ),
      } : null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar permissão.';
      showToast(msg, 'error');
    }
  }

  async function handleRemove(projectId: string, userId: string) {
    try {
      await removeProjectMember(projectId, userId);
      showToast('Acesso removido do projeto.', 'success');
      await load();
      setManageUser((prev) => prev ? {
        ...prev,
        memberships: prev.memberships.filter((mm) => mm.projectId !== projectId),
      } : null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover acesso.';
      showToast(msg, 'error');
    }
  }

  async function handleAddProject() {
    if (!manageUser || !addProject) return;
    try {
      await addProjectMember(addProject, manageUser.userId, addRole);
      showToast('Acesso adicionado ao projeto.', 'success');
      const proj = projects.find((p) => p.id === addProject);
      setManageUser((prev) => prev ? {
        ...prev,
        memberships: [...prev.memberships, { projectId: addProject, projectName: proj?.nome || '', role: addRole }],
      } : null);
      setAddProject('');
      setAddRole('operator');
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar acesso.';
      showToast(msg, 'error');
    }
  }

  const availableProjects = manageUser
    ? projects.filter((p) => !manageUser.memberships.some((m) => m.projectId === p.id))
    : [];

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Usuários</h1>
          <p>Gerencie usuários, perfis, segurança e acessos aos projetos.</p>
        </div>
        <button className="btn" onClick={() => setShowCreate(true)}>
          + Novo usuário
        </button>
      </div>

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="card kpi">
          <div className="kicon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 2.5-7 6-7s6 3 6 7M14 14c3.5 0 6 2.3 6 6"/></svg></div>
          <small>Total de usuários</small>
          <strong>{users.length}</strong>
        </div>
        <div className="card kpi">
          <div className="kicon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></div>
          <small>Administradores</small>
          <strong>{adminCount}</strong>
        </div>
        <div className="card kpi">
          <div className="kicon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></div>
          <small>Operators</small>
          <strong>{operatorCount}</strong>
        </div>
      </div>

      <div className="card section" style={{ marginTop: 14 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
          <input
            type="text"
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ minWidth: 140 }}>
            <option value="all">Todos os perfis</option>
            <option value="admin">Administradores</option>
            <option value="operator">Operators</option>
          </select>
        </div>

        {loading ? (
          <p className="empty">Carregando usuários...</p>
        ) : error ? (
          <p className="empty" style={{ color: 'var(--error, #d94a3a)' }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p className="empty">Nenhum usuário encontrado.</p>
        ) : (
          <div className="users-grid">
            {filtered.map((u) => (
              <div key={u.userId} className="user-card">
                <div className="user-card-head">
                  <div className="user-avatar">{initials(u.name)}</div>
                  <div className="user-card-info">
                    <b>{u.name}</b>
                    <span>{u.email}</span>
                  </div>
                </div>
                <div className="user-card-badges">
                  <span className={`badge ${u.globalRole === 'admin' ? 'status-Em-andamento' : ''}`}>
                    {u.globalRole === 'admin' ? 'Administrador' : 'Operator'}
                  </span>
                  {u.userId === currentUserId && <span className="badge status-Concluído">Você</span>}
                </div>
                <div className="user-card-proj">
                  {u.memberships.length > 0 ? (
                    <>
                      <b>{u.memberships.length}</b> projeto(s)
                      <br />
                      {u.memberships.map((m, i) => (
                        <span key={i} className="hint">
                          • {m.projectName} — {m.role === 'admin' ? 'Admin' : 'Operator'}
                          {i < u.memberships.length - 1 ? <br /> : null}
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="hint">Nenhum projeto vinculado</span>
                  )}
                </div>
                <div>
                  <button className="btn secondary" style={{ width: '100%' }} onClick={() => openManage(u)}>
                    Gerenciar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage user panel — right-side drawer */}
      {manageUser && (
        <div className="modal-overlay detail-drawer-overlay" onClick={() => setManageUser(null)}>
          <div className="modalbox modalbox-lg user-detail-panel" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="user-detail-header">
              <div className="user-avatar">{initials(manageUser.name)}</div>
              <div className="user-detail-header-info">
                <h2>{manageUser.name}</h2>
                <span className="hint">{manageUser.email}</span>
              </div>
              {manageUser.userId === currentUserId && <span className="badge status-Concluído">Você</span>}
              <button className="user-detail-close" onClick={() => setManageUser(null)} aria-label="Fechar">×</button>
            </div>

            {/* Tabs */}
            <div className="user-detail-tabs">
              <button className={`user-detail-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                Visão geral
              </button>
              <button className={`user-detail-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
                Projetos
              </button>
              <button className={`user-detail-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                Segurança
              </button>
            </div>

            {/* Body */}
            <div className="user-detail-body">
              {activeTab === 'overview' && (
                <>
                  <div className="manage-section">
                    <h3>Dados do usuário</h3>
                    <div className="manage-form-grid">
                      <label className="field">
                        <span>Nome completo</span>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </label>
                      <label className="field">
                        <span>E-mail</span>
                        <input type="email" value={manageUser.email} disabled style={{ opacity: 0.6 }} />
                      </label>
                      <label className="field">
                        <span>Perfil global</span>
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)} disabled={manageUser.userId === currentUserId}>
                          <option value="operator">Operator</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </label>
                    </div>
                    <div className="modal-actions" style={{ marginTop: 8 }}>
                      <button className="btn" disabled={savingProfile} onClick={handleSaveProfile}>
                        {savingProfile ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </div>
                    <p className="hint" style={{ marginTop: 8 }}>
                      Alterações de perfil global exigem suporte administrativo server-side.
                    </p>
                  </div>

                  <div className="manage-section">
                    <h3>Resumo de acessos</h3>
                    <p className="hint" style={{ margin: 0 }}>
                      {manageUser.memberships.length > 0
                        ? `${manageUser.memberships.length} projeto(s) vinculado(s). Veja a aba "Projetos" para detalhes.`
                        : 'Sem acesso a nenhum projeto.'}
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'projects' && (
                <>
                  <div className="manage-section">
                    <h3>Acessos a projetos</h3>
                    {manageUser.memberships.length > 0 ? (
                      <div>
                        {manageUser.memberships.map((m) => (
                          <div key={m.projectId} className="manage-access-row">
                            <span>{m.projectName}</span>
                            {manageUser.userId !== currentUserId ? (
                              <select
                                className="manage-access-select"
                                value={m.role}
                                onChange={(e) => handleRoleChange(m.projectId, manageUser.userId, e.target.value)}
                              >
                                <option value="admin">Admin</option>
                                <option value="operator">Operator</option>
                              </select>
                            ) : (
                              <span className="badge">{m.role === 'admin' ? 'Admin' : 'Operator'}</span>
                            )}
                            {manageUser.userId !== currentUserId && (
                              <button
                                className="btn secondary"
                                style={{ fontSize: 12, padding: '5px 10px' }}
                                onClick={() => handleRemove(m.projectId, manageUser.userId)}
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty" style={{ padding: 16 }}>Sem acesso a nenhum projeto.</p>
                    )}
                  </div>

                  {availableProjects.length > 0 && (
                    <div className="manage-section">
                      <h3>Adicionar acesso a projeto</h3>
                      <div className="manage-form-grid">
                        <label className="field">
                          <span>Projeto</span>
                          <select value={addProject} onChange={(e) => setAddProject(e.target.value)}>
                            <option value="">Selecionar projeto</option>
                            {availableProjects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                          </select>
                        </label>
                        <label className="field">
                          <span>Permissão</span>
                          <select value={addRole} onChange={(e) => setAddRole(e.target.value)}>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </label>
                      </div>
                      <div className="modal-actions" style={{ marginTop: 4 }}>
                        <button className="btn" disabled={!addProject} onClick={handleAddProject}>
                          + Adicionar projeto
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'security' && (
                <>
                  <div className="manage-section">
                    <h3>Redefinir senha</h3>
                    <div className="manage-form-grid">
                      <label className="field">
                        <span>Nova senha</span>
                        <input type="password" placeholder="•••••••••••" disabled style={{ opacity: 0.6 }} />
                      </label>
                      <label className="field">
                        <span>Confirmar nova senha</span>
                        <input type="password" placeholder="•••••••••••" disabled style={{ opacity: 0.6 }} />
                      </label>
                    </div>
                    <button className="btn secondary" disabled>
                      Redefinir senha
                    </button>
                    <p className="btn-disabled-hint">Redefinição de senha requer Edge Function segura (em breve).</p>
                  </div>

                  <div className="manage-section danger-zone">
                    <h3>Zona de perigo</h3>
                    <button className="btn secondary" disabled>
                      Desativar usuário
                    </button>
                    <p className="btn-disabled-hint">Ações destrutivas requerem suporte administrativo seguro (em breve).</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Novo usuário modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modalbox" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <h2>Novo usuário</h2>
            <p className="hint" style={{ marginBottom: 16 }}>Crie um usuário que poderá acessar o sistema imediatamente.</p>

            <div className="manage-form-grid">
              <label className="field">
                <span>Nome completo *</span>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do usuário" autoFocus />
              </label>
              <label className="field">
                <span>E-mail *</span>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
              </label>
              <label className="field">
                <span>Senha inicial *</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </label>
              <label className="field">
                <span>Confirmar senha *</span>
                <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} placeholder="Repita a senha" />
              </label>
              <label className="field">
                <span>Perfil global *</span>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="operator">Operator</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Acesso inicial a projeto (opcional)</h3>
              <div className="manage-form-grid">
                <label className="field">
                  <span>Projeto</span>
                  <select value={newProject} onChange={(e) => setNewProject(e.target.value)}>
                    <option value="">Nenhum projeto</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Permissão</span>
                  <select value={newProjectRole} onChange={(e) => setNewProjectRole(e.target.value)} disabled={!newProject}>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button
                className="btn"
                disabled={creating || !newEmail.trim() || !newName.trim() || !newPassword.trim() || newPassword !== newPasswordConfirm}
                onClick={handleCreateUser}
              >
                {creating ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

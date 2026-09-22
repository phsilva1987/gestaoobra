import { useState, useEffect, useCallback } from 'react';
import type { ProjectData } from '../types';
import {
  getAdminUsersOverview,
  inviteProjectMember,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  searchProfiles,
  type AdminUserOverviewRow,
  type ProfileSearchResult,
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

export function UsersPage({ projects, currentUserId, showToast }: UsersPageProps) {
  const [rows, setRows] = useState<AdminUserOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteProject, setInviteProject] = useState('');
  const [inviteRole, setInviteRole] = useState('operator');
  const [inviting, setInviting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addProject, setAddProject] = useState('');
  const [addRole, setAddRole] = useState('operator');
  const [adding, setAdding] = useState(false);
  const [manageUser, setManageUser] = useState<UserGroup | null>(null);

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

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchProfiles(searchQuery.trim());
      setSearchResults(results);
    } catch {
      showToast('Erro ao buscar usuários.', 'error');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(userId: string) {
    if (!addProject) return;
    setAdding(true);
    try {
      await addProjectMember(addProject, userId, addRole);
      showToast('Usuário adicionado ao projeto.', 'success');
      setShowAdd(false);
      setSearchQuery('');
      setSearchResults([]);
      await load();
      setManageUser(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar usuário.';
      showToast(msg, 'error');
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(projectId: string, userId: string, newRole: string) {
    try {
      await updateProjectMemberRole(projectId, userId, newRole);
      showToast('Permissão atualizada.', 'success');
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar permissão.';
      showToast(msg, 'error');
    }
  }

  async function handleRemove(projectId: string, userId: string) {
    try {
      await removeProjectMember(projectId, userId);
      showToast('Usuário removido do projeto.', 'success');
      await load();
      setManageUser(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover usuário.';
      showToast(msg, 'error');
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteProject) return;
    setInviting(true);
    try {
      const result = await inviteProjectMember(inviteProject, inviteEmail.trim(), inviteName.trim(), inviteRole);
      showToast(result.message, 'success');
      setShowInvite(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('operator');
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar convite.';
      showToast(msg, 'error');
    } finally {
      setInviting(false);
    }
  }

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Usuários</h1>
          <p>Gerencie usuários, permissões e acessos aos projetos.</p>
        </div>
        <button className="btn" onClick={() => { setInviteProject(projects[0]?.id || ''); setShowInvite(true); }}>
          + Convidar usuário
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
          <small>Admins globais</small>
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
            <option value="admin">Admins</option>
            <option value="operator">Operators</option>
          </select>
          <button className="btn secondary" onClick={() => { setAddProject(projects[0]?.id || ''); setShowAdd(true); }}>
            + Adicionar usuário
          </button>
        </div>

        {loading ? (
          <p className="empty">Carregando usuários...</p>
        ) : error ? (
          <p className="empty" style={{ color: 'var(--error, #d94a3a)' }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p className="empty">Nenhum usuário encontrado.</p>
        ) : (
          <div className="stage-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Perfil Global</th>
                  <th>Projetos</th>
                  <th>Permissões</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <b>{u.name}</b>
                      {u.userId === currentUserId && <span className="hint" style={{ marginLeft: 6 }}>(você)</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.globalRole === 'admin' ? 'status-Em-andamento' : ''}`}>
                        {u.globalRole === 'admin' ? 'Admin' : 'Operator'}
                      </span>
                    </td>
                    <td>{u.memberships.length > 0 ? `${u.memberships.length} projeto(s)` : '—'}</td>
                    <td>
                      {u.memberships.length > 0
                        ? u.memberships.map((m, i) => (
                          <span key={i} className="hint" style={{ marginRight: 8 }}>
                            {m.projectName}: {m.role === 'admin' ? 'Admin' : 'Operator'}
                          </span>
                        ))
                        : '—'}
                    </td>
                    <td className="rowactions">
                      <button onClick={() => setManageUser(u)}>Gerenciar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manage user modal */}
      {manageUser && (
        <div className="modal-overlay" onClick={() => setManageUser(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>{manageUser.name}</h2>
            <p className="hint">{manageUser.email}</p>
            <p className="hint" style={{ marginBottom: 16 }}>
              Perfil global: <b>{manageUser.globalRole === 'admin' ? 'Admin' : 'Operator'}</b>
            </p>

            <h3 style={{ margin: '0 0 12px' }}>Acessos a projetos</h3>
            {manageUser.memberships.length > 0 ? (
              <div className="stage-table-scroll" style={{ marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr><th>Projeto</th><th>Permissão</th><th></th></tr>
                  </thead>
                  <tbody>
                    {manageUser.memberships.map((m) => (
                      <tr key={m.projectId}>
                        <td><b>{m.projectName}</b></td>
                        <td>
                          {manageUser.userId !== currentUserId ? (
                            <select
                              value={m.role}
                              onChange={(e) => {
                                handleRoleChange(m.projectId, manageUser.userId, e.target.value);
                                setManageUser((prev) => prev ? {
                                  ...prev,
                                  memberships: prev.memberships.map((mm) =>
                                    mm.projectId === m.projectId ? { ...mm, role: e.target.value } : mm
                                  ),
                                } : null);
                              }}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border, #ddd)' }}
                            >
                              <option value="admin">Admin</option>
                              <option value="operator">Operator</option>
                            </select>
                          ) : (
                            m.role === 'admin' ? 'Admin' : 'Operator'
                          )}
                        </td>
                        <td className="rowactions">
                          {manageUser.userId !== currentUserId && (
                            <button onClick={() => handleRemove(m.projectId, manageUser.userId)}>Remover acesso</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty" style={{ marginBottom: 16 }}>Sem acesso a nenhum projeto.</p>
            )}

            {/* Projects without access */}
            {(() => {
              const memberProjectIds = new Set(manageUser.memberships.map((m) => m.projectId));
              const available = projects.filter((p) => !memberProjectIds.has(p.id));
              if (available.length === 0) return null;
              return (
                <>
                  <h3 style={{ margin: '0 0 12px' }}>Adicionar a projeto</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {available.map((p) => (
                      <button
                        key={p.id}
                        className="btn secondary"
                        onClick={async () => {
                          try {
                            await addProjectMember(p.id, manageUser.userId, 'operator');
                            showToast('Usuário adicionado ao projeto.', 'success');
                            await load();
                            setManageUser(null);
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : 'Erro ao adicionar usuário.';
                            showToast(msg, 'error');
                          }
                        }}
                      >
                        + {p.nome}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setManageUser(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modalbox modalbox-sm" onClick={(e) => e.stopPropagation()}>
            <h2>Convidar usuário</h2>
            <p className="hint" style={{ marginBottom: 12 }}>O convidado receberá um e-mail para definir sua senha e acessar o sistema.</p>
            <label className="field">
              <span>Nome</span>
              <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Nome do convidado" autoFocus />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" />
            </label>
            <label className="field">
              <span>Projeto</span>
              <select value={inviteProject} onChange={(e) => setInviteProject(e.target.value)}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Permissão no projeto</span>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="modal-actions">
              <button className="btn" disabled={inviting || !inviteEmail.trim() || !inviteProject} onClick={handleInvite}>
                {inviting ? 'Enviando convite...' : 'Enviar convite'}
              </button>
              <button className="btn secondary" onClick={() => setShowInvite(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add existing user modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setSearchResults([]); }}>
          <div className="modalbox modalbox-sm" onClick={(e) => e.stopPropagation()}>
            <h2>Adicionar usuário a projeto</h2>
            <p className="hint" style={{ marginBottom: 12 }}>Busque um usuário existente pelo nome ou e-mail.</p>
            <label className="field">
              <span>Projeto</span>
              <select value={addProject} onChange={(e) => setAddProject(e.target.value)}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Permissão</span>
              <select value={addRole} onChange={(e) => setAddRole(e.target.value)}>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                autoFocus
                style={{ flex: 1 }}
              />
              <button className="btn" onClick={handleSearch} disabled={searching}>
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="stage-table-scroll" style={{ maxHeight: 240 }}>
                <table>
                  <thead><tr><th>Nome</th><th>E-mail</th><th></th></tr></thead>
                  <tbody>
                    {searchResults.map((r) => (
                      <tr key={r.id}>
                        <td><b>{r.name || '—'}</b></td>
                        <td>{r.email}</td>
                        <td><button className="btn" onClick={() => handleAdd(r.id)} disabled={adding}>Adicionar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="empty">Nenhum usuário encontrado.</p>
            )}
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => { setShowAdd(false); setSearchResults([]); }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

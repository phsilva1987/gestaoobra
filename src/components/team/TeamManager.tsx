import { useState, useEffect, useCallback } from 'react';
import type { TeamMember, ProfileSearchResult } from '../../services/teamService';
import { getProjectMembers, searchProfiles, addProjectMember, inviteProjectMember } from '../../services/teamService';

interface TeamManagerProps {
  projectId: string;
  isProjectAdmin: boolean;
  currentUserId: string;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function TeamManager({ projectId, isProjectAdmin, currentUserId, showToast }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operator');
  const [inviting, setInviting] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjectMembers(projectId);
      setMembers(data);
    } catch (err) {
      showToast('Erro ao carregar equipe.', 'error');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchProfiles(searchQuery.trim(), projectId);
      setSearchResults(results);
    } catch {
      showToast('Erro ao buscar usuários.', 'error');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(userId: string) {
    setAdding(true);
    try {
      await addProjectMember(projectId, userId, 'operator');
      showToast('Usuário adicionado ao projeto.', 'success');
      setShowAdd(false);
      setSearchQuery('');
      setSearchResults([]);
      await loadMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar usuário.';
      showToast(msg, 'error');
    } finally {
      setAdding(false);
    }
  }

  async function handleChangeRole(member: TeamMember, newRole: string) {
    try {
      const { updateProjectMemberRole } = await import('../../services/teamService');
      await updateProjectMemberRole(projectId, member.id, newRole);
      showToast('Permissão atualizada.', 'success');
      await loadMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar permissão.';
      showToast(msg, 'error');
    }
  }

  async function handleRemove(member: TeamMember) {
    try {
      const { removeProjectMember } = await import('../../services/teamService');
      await removeProjectMember(projectId, member.id);
      showToast('Usuário removido do projeto.', 'success');
      await loadMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover usuário.';
      showToast(msg, 'error');
    }
  }

  return (
    <>
      <h3 className="config-v19-title" style={{ margin: '26px 0 4px' }}>Usuários e Equipe</h3>
      <div className="card section">
        <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span className="hint">Membros com acesso a este projeto.</span>
          {isProjectAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn secondary" onClick={() => setShowAdd(true)}>+ Adicionar usuário</button>
              <button className="btn" onClick={() => setShowInvite(true)}>Convidar usuário</button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="empty">Carregando equipe...</p>
        ) : members.length === 0 ? (
          <p className="empty">Nenhum membro neste projeto.</p>
        ) : (
          <div className="stage-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil global</th>
                  <th>Permissão no projeto</th>
                  <th>Status</th>
                  {isProjectAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td><b>{m.name || '—'}</b>{m.id === currentUserId && <span className="hint" style={{ marginLeft: 6 }}>(você)</span>}</td>
                    <td>{m.email || '—'}</td>
                    <td>{m.globalRole === 'admin' ? 'Admin' : 'Operator'}</td>
                    <td>
                      {isProjectAdmin && m.id !== currentUserId ? (
                        <select
                          value={m.projectRole}
                          onChange={(e) => handleChangeRole(m, e.target.value)}
                          className="role-select"
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border, #ddd)' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="operator">Operator</option>
                        </select>
                      ) : (
                        m.projectRole === 'admin' ? 'Admin' : 'Operator'
                      )}
                    </td>
                    <td>{m.status}</td>
                    {isProjectAdmin && (
                      <td className="rowactions">
                        {m.id !== currentUserId && (
                          <button onClick={() => handleRemove(m)}>Remover</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setSearchResults([]); }}>
          <div className="modalbox modalbox-sm" onClick={(e) => e.stopPropagation()}>
            <h2>Adicionar usuário ao projeto</h2>
            <p className="hint" style={{ marginBottom: 12 }}>Busque um usuário existente pelo nome ou e-mail.</p>
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

      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modalbox modalbox-sm" onClick={(e) => e.stopPropagation()}>
            <h2>Convidar usuário</h2>
            <p className="hint" style={{ marginBottom: 12 }}>O convidado receberá um e-mail para definir sua senha e acessar o sistema.</p>
            <label className="field">
              <span>Nome</span>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Nome do convidado"
                autoFocus
              />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </label>
            <label className="field">
              <span>Permissão no projeto</span>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="modal-actions">
              <button
                className="btn"
                disabled={inviting || !inviteEmail.trim()}
                onClick={async () => {
                  setInviting(true);
                  try {
                    const result = await inviteProjectMember(projectId, inviteEmail.trim(), inviteName.trim(), inviteRole);
                    showToast(result.message, 'success');
                    setShowInvite(false);
                    setInviteName('');
                    setInviteEmail('');
                    setInviteRole('operator');
                    await loadMembers();
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Erro ao enviar convite.';
                    showToast(msg, 'error');
                  } finally {
                    setInviting(false);
                  }
                }}
              >
                {inviting ? 'Enviando convite...' : 'Enviar convite'}
              </button>
              <button className="btn secondary" onClick={() => setShowInvite(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import type { ProjectData } from '../types';
import { projectTotals, projectProgress } from '../lib/calculations';
import { money, fmt } from '../lib/format';
import { ProjectForm, type ProjectFormData } from '../components/projects/ProjectForm';

interface ProjectsProps {
  projects: ProjectData[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onNavigate: (page: 'dashboard') => void;
  onAddProject: (data: ProjectFormData) => string;
  onUpdateProject: (id: string, data: ProjectFormData) => void;
  onDeleteProject: (id: string) => void;
}

type Modal =
  | { type: 'create' }
  | { type: 'edit'; project: ProjectData }
  | { type: 'delete'; project: ProjectData }
  | null;

export function Projects({
  projects,
  selectedProjectId,
  onSelectProject,
  onNavigate,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectsProps) {
  const [modal, setModal] = useState<Modal>(null);

  function handleCreate(data: ProjectFormData) {
    const newId = onAddProject(data);
    setModal(null);
    onSelectProject(newId);
    onNavigate('dashboard');
  }

  function handleEdit(data: ProjectFormData) {
    if (modal?.type === 'edit') {
      onUpdateProject(modal.project.id, data);
    }
    setModal(null);
  }

  function handleDelete() {
    if (modal?.type === 'delete') {
      onDeleteProject(modal.project.id);
    }
    setModal(null);
  }

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Projetos</h1>
          <p>Gerencie todos os seus projetos de reforma</p>
        </div>
        <button className="btn" onClick={() => setModal({ type: 'create' })}>+ Novo Projeto</button>
      </div>

      <div className="projects-grid">
        {projects.map((p) => {
          const t = projectTotals(p);
          const prog = projectProgress(p);
          const isSelected = p.id === selectedProjectId;
          return (
            <div key={p.id} className={`project-card-item${isSelected ? ' selected' : ''}`}>
              {isSelected && <div className="project-card-badge">PROJETO ATUAL</div>}
              <div className="project-card-cover">
                {p.coverImage ? (
                  <img src={p.coverImage} alt={p.nome} />
                ) : (
                  <div className="project-card-noimg">{p.nome.charAt(0)}</div>
                )}
              </div>
              <div className="project-card-body">
                <h3>{p.nome}</h3>
                <div className="project-card-meta">
                  <span className="badge">{p.tipo}</span>
                  <span className="badge">{p.status}</span>
                </div>
                <div className="project-card-info">
                  <div><small>Cliente</small><b>{p.config.empresa || '—'}</b></div>
                  <div><small>Período</small><b>{p.config.inicio ? fmt(p.config.inicio) : '—'} → {p.config.fim ? fmt(p.config.fim) : '—'}</b></div>
                </div>
                <div className="project-card-finance">
                  <div><small>Orçamento</small><b>{money(t.budget)}</b></div>
                  <div><small>Contratado</small><b>{money(t.contratado)}</b></div>
                  <div><small>Pago</small><b>{money(t.pago)}</b></div>
                  <div><small>Saldo</small><b className={t.available < 0 ? 'neg' : ''}>{money(t.available)}</b></div>
                  <div><small>Progresso</small><b>{prog}%</b></div>
                </div>
                <div className="project-card-actions">
                  <button className="btn" onClick={() => { onSelectProject(p.id); onNavigate('dashboard'); }}>
                    Abrir projeto
                  </button>
                  <button className="btn secondary" onClick={() => setModal({ type: 'edit', project: p })}>
                    Editar
                  </button>
                  <button
                    className="btn secondary"
                    disabled={projects.length <= 1}
                    onClick={() => setModal({ type: 'delete', project: p })}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal?.type === 'create' && (
        <ProjectForm project={null} onSave={handleCreate} onCancel={() => setModal(null)} />
      )}

      {modal?.type === 'edit' && (
        <ProjectForm project={modal.project} onSave={handleEdit} onCancel={() => setModal(null)} />
      )}

      {modal?.type === 'delete' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir projeto</h2>
            <p style={{ marginBottom: 16 }}>
              Tem certeza que deseja excluir <b>{modal.project.nome}</b>?<br />
              Todos os dados relacionados (etapas, profissionais, materiais, equipamentos, financeiro) serão removidos.
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn danger" onClick={handleDelete}>Excluir projeto</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

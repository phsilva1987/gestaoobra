import { useState } from 'react';
import type { Stage, ProjectData } from '../types';
import { StageTable } from '../components/stages/StageTable';
import { StageForm, type StageFormData } from '../components/stages/StageForm';
import { StageChecklist } from '../components/stages/StageChecklist';
interface StagesProps {
  project: ProjectData;
  onAddStage: (data: StageFormData) => Promise<void> | void;
  onUpdateStage: (id: string, data: StageFormData) => Promise<void> | void;
  onDeleteStage: (id: string) => Promise<void> | void;
  onToggleCheck: (id: string, key: keyof Stage, checked: boolean) => void;
  onFinishStage: (id: string) => Promise<void> | void;
}

type Modal =
  | { type: 'form'; stage: Stage | null }
  | { type: 'checklist'; stage: Stage }
  | { type: 'delete'; stage: Stage }
  | null;

export function Stages({
  project,
  onAddStage,
  onUpdateStage,
  onDeleteStage,
  onToggleCheck,
  onFinishStage,
}: StagesProps) {
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  async function handleSave(data: StageFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'form' && modal.stage) {
        await onUpdateStage(modal.stage.id, data);
      } else {
        await onAddStage(data);
      }
      setModal(null);
    } catch {
      setSaving(false);
    }
  }

  async function handleFinish() {
    if (modal?.type === 'checklist') {
      setFinishing(true);
      try { await onFinishStage(modal.stage.id); setModal(null); }
      catch { setFinishing(false); }
    }
  }

  function canDelete(stage: Stage): boolean {
    const hasJobs = project.jobs.some((j) => j.etapa_id === stage.id);
    const hasMats = project.materiais.some((m) => m.etapa_id === stage.id);
    const hasEq = project.equipamentos.some((e) => e.etapa_id === stage.id);
    return !hasJobs && !hasMats && !hasEq;
  }

  function countVinculos(stage: Stage): { jobs: number; materiais: number; equipamentos: number } {
    return {
      jobs: project.jobs.filter((j) => j.etapa_id === stage.id).length,
      materiais: project.materiais.filter((m) => m.etapa_id === stage.id).length,
      equipamentos: project.equipamentos.filter((e) => e.etapa_id === stage.id).length,
    };
  }

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Obra / Etapas</h1>
          <p>Serviços e etapas da reforma de {project.config.empresa || project.nome}</p>
        </div>
        <button className="btn" onClick={() => setModal({ type: 'form', stage: null })}>
          + Adicionar etapa
        </button>
      </div>

      <StageTable
        project={project}
        onEdit={(stage) => setModal({ type: 'form', stage })}
        onChecklist={(stage) => setModal({ type: 'checklist', stage })}
        onDelete={(stage) => setModal({ type: 'delete', stage })}
      />

      {modal?.type === 'form' && (
        <StageForm
          stage={modal.stage}
          project={project}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.type === 'checklist' && (
        <StageChecklist
          stage={modal.stage}
          onToggle={(key, checked) => onToggleCheck(modal.stage.id, key, checked)}
          onFinish={handleFinish}
          onCancel={() => setModal(null)}
          finishing={finishing}
        />
      )}

      {modal?.type === 'delete' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir etapa</h2>
            {canDelete(modal.stage) ? (
              <>
                <p>Confirma a exclusão de <b>{modal.stage.nome}</b>?</p>
                <div className="modal-actions">
                  <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
                  <button
                    className="btn danger"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      try { await onDeleteStage(modal.stage.id); setModal(null); }
                      catch { setDeleting(false); }
                    }}
                  >
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {(() => {
                  const v = countVinculos(modal.stage);
                  return (
                    <div className="delete-blocked">
                      <p>Não é possível excluir <b>{modal.stage.nome}</b> porque existem registros vinculados:</p>
                      <ul>
                        {v.jobs > 0 && <li>{v.jobs} vínculo(s) de profissional (Trabalho)</li>}
                        {v.materiais > 0 && <li>{v.materiais} material(is) vinculado(s)</li>}
                        {v.equipamentos > 0 && <li>{v.equipamentos} equipamento(s) vinculado(s)</li>}
                      </ul>
                      <p className="hint">Remova os vínculos nas respectivas páginas antes de excluir esta etapa.</p>
                    </div>
                  );
                })()}
                <div className="modal-actions">
                  <button className="btn secondary" onClick={() => setModal(null)}>Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

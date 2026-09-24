import { useState } from 'react';
import type { Professional, Job, ProjectData, Commitment } from '../types';
import { ProfessionalTable } from '../components/professionals/ProfessionalTable';
import { ProfessionalForm, type ProfessionalFormData } from '../components/professionals/ProfessionalForm';
import { JobForm, type JobFormData } from '../components/professionals/JobForm';
import { PaymentForm, type PaymentFormData } from '../components/finance/PaymentForm';

interface ProfessionalsProps {
  project: ProjectData;
  onAddProfessional: (data: ProfessionalFormData) => void;
  onUpdateProfessional: (id: string, data: ProfessionalFormData) => void;
  onDeleteProfessional: (id: string) => void;
  onAddJob: (data: JobFormData) => void;
  onUpdateJob: (id: string, data: JobFormData) => void;
  onDeleteJob: (id: string) => void;
  onAddPayment: (data: PaymentFormData) => Promise<void> | void;
}

type Modal =
  | { type: 'prof-form'; prof: Professional | null }
  | { type: 'delete-prof'; prof: Professional }
  | { type: 'job-form'; job: Job | null; presetProfId: string | null }
  | { type: 'delete-job'; jobId: string; prof: Professional }
  | { type: 'pay'; commitment: Commitment }
  | null;

export function Professionals({
  project,
  onAddProfessional,
  onUpdateProfessional,
  onDeleteProfessional,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onAddPayment,
}: ProfessionalsProps) {
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleProfSave(data: ProfessionalFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'prof-form' && modal.prof) await onUpdateProfessional(modal.prof.id, data);
      else await onAddProfessional(data);
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
  }

  async function handleJobSave(data: JobFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'job-form' && modal.job) {
        await onUpdateJob(modal.job.id, data);
      } else {
        await onAddJob(data);
      }
      if (modal?.type === 'job-form') {
        const profId = modal.presetProfId || modal.job?.profissional_id || '';
        const prof = project.profissionais.find((p) => p.id === profId);
        if (prof) {
          setModal({ type: 'prof-form', prof });
        } else {
          setModal(null);
        }
      } else {
        setModal(null);
      }
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
  }

  async function handlePay(data: PaymentFormData) {
    setSaving(true);
    try {
      await onAddPayment(data);
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
  }

  function canDeleteProf(prof: Professional): boolean {
    return !project.jobs.some((j) => j.profissional_id === prof.id);
  }

  function countJobs(profId: string): number {
    return project.jobs.filter((j) => j.profissional_id === profId).length;
  }

  function openAddJobForProf(prof: Professional) {
    setModal({ type: 'job-form', job: null, presetProfId: prof.id });
  }

  function openEditJob(job: Job) {
    setModal({ type: 'job-form', job, presetProfId: null });
  }

  async function handleDeleteJob() {
    if (modal?.type === 'delete-job') {
      setDeleting(true);
      try {
        await onDeleteJob(modal.jobId);
        const prof = modal.prof;
        setModal({ type: 'prof-form', prof });
      } catch { /* toast shown by wrap */ }
      finally { setDeleting(false); }
    }
  }

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Profissionais</h1>
          <p>Cadastro fixo e vínculos de trabalho por etapa</p>
        </div>
        <button className="btn" onClick={() => setModal({ type: 'prof-form', prof: null })}>
          + Adicionar profissional
        </button>
      </div>

      <ProfessionalTable
        project={project}
        onEdit={(prof) => setModal({ type: 'prof-form', prof })}
        onDelete={(prof) => setModal({ type: 'delete-prof', prof })}
      />

      {modal?.type === 'prof-form' && (
        <ProfessionalForm
          professional={modal.prof}
          project={project}
          onSave={handleProfSave}
          onCancel={() => setModal(null)}
          onAddJob={() => openAddJobForProf(modal.prof!)}
          onEditJob={(job) => openEditJob(job)}
          onDeleteJob={(jobId) => {
            const prof = modal.prof!;
            setModal({ type: 'delete-job', jobId, prof });
          }}
          onPay={(commitment) => setModal({ type: 'pay', commitment })}
          saving={saving}
        />
      )}

      {modal?.type === 'job-form' && (
        <JobForm
          job={modal.job}
          presetProfId={modal.presetProfId}
          project={project}
          onSave={handleJobSave}
          onCancel={() => {
            const profId = modal.presetProfId || modal.job?.profissional_id || '';
            const prof = project.profissionais.find((p) => p.id === profId);
            if (prof) setModal({ type: 'prof-form', prof });
            else setModal(null);
          }}
          onPay={(commitment) => setModal({ type: 'pay', commitment })}
          saving={saving}
        />
      )}

      {modal?.type === 'pay' && (
        <PaymentForm
          payment={null}
          commitment={modal.commitment}
          onSave={handlePay}
          onCancel={() => {
            const profId = modal.commitment.stageId
              ? project.jobs.find((j) => j.id === modal.commitment.sourceId)?.profissional_id
              : null;
            const prof = profId ? project.profissionais.find((p) => p.id === profId) : null;
            if (prof) setModal({ type: 'prof-form', prof });
            else setModal(null);
          }}
          saving={saving}
        />
      )}

      {modal?.type === 'delete-prof' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir profissional</h2>
            {canDeleteProf(modal.prof) ? (
              <>
                <p>Confirma a exclusão de <b>{modal.prof.nome}</b>?</p>
                <div className="modal-actions">
                  <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
                  <button
                    className="btn danger"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      try { await onDeleteProfessional(modal.prof.id); setModal(null); }
                      catch { /* toast shown by wrap */ }
                      finally { setDeleting(false); }
                    }}
                  >
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="delete-blocked">
                  <p>Este profissional possui <b>{countJobs(modal.prof.id)} trabalho(s)</b> vinculado(s). Remova ou transfira os vínculos antes de excluir.</p>
                </div>
                <div className="modal-actions">
                  <button className="btn secondary" onClick={() => setModal(null)}>Fechar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modal?.type === 'delete-job' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir vínculo de trabalho</h2>
            <p>Confirma a exclusão deste vínculo?</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn danger" disabled={deleting} onClick={handleDeleteJob}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import type { Professional, Job, ProjectData, Payment, Commitment } from '../../types';
import { money } from '../../lib/format';
import { JobStatusBadge } from './JobStatusBadge';
import { totalPaidForEntity } from '../../services/commitmentService';

export interface ProfessionalFormData {
  nome: string;
  servico: string;
  telefone: string;
  email: string;
  status: string;
}

interface ProfessionalFormProps {
  professional: Professional | null;
  project: ProjectData;
  onSave: (data: ProfessionalFormData) => Promise<void> | void;
  onCancel: () => void;
  onAddJob: () => void;
  onEditJob: (job: Job) => void;
  onDeleteJob: (jobId: string) => void;
  onPay: (commitment: Commitment) => void;
  saving?: boolean;
}

const STATUS_TRABALHO = ['Cotação', 'Contratado', 'Em andamento', 'Concluído'];

function jobsDoProfissional(profId: string, jobs: Job[]): Job[] {
  return jobs.filter((j) => String(j.profissional_id) === String(profId));
}

function valorTotalProfissional(profId: string, jobs: Job[]): number {
  return jobsDoProfissional(profId, jobs).reduce((a, t) => a + (+t.valor || 0), 0);
}

function valorPagoProfissional(profId: string, jobs: Job[], payments: Payment[]): number {
  return jobsDoProfissional(profId, jobs).reduce(
    (a, t) => a + totalPaidForEntity(payments, 'PROFESSIONAL', t.id), 0
  );
}

export function ProfessionalForm({
  professional,
  project,
  onSave,
  onCancel,
  onAddJob,
  onEditJob,
  onDeleteJob,
  onPay,
  saving = false,
}: ProfessionalFormProps) {
  const [form, setForm] = useState<ProfessionalFormData>({
    nome: professional?.nome || '',
    servico: professional?.servico || '',
    telefone: professional?.telefone || '',
    email: professional?.email || '',
    status: professional?.status || 'Cotação',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (professional) {
      setForm({
        nome: professional.nome,
        servico: professional.servico,
        telefone: professional.telefone,
        email: professional.email,
        status: professional.status,
      });
    }
  }, [professional]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome do profissional.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'E-mail inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave({ ...form, nome: form.nome.trim() });
  }

  const jobs = professional ? jobsDoProfissional(professional.id, project.jobs) : [];
  const total = professional ? valorTotalProfissional(professional.id, project.jobs) : 0;
  const pago = professional ? valorPagoProfissional(professional.id, project.jobs, project.pagamentos) : 0;


  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox modalbox-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{professional ? 'Editar profissional' : 'Novo profissional'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                autoFocus
              />
              {errors.nome && <span className="field-error">{errors.nome}</span>}
            </div>
            <div className="form-field">
              <label>Serviço prestado</label>
              <input
                type="text"
                value={form.servico}
                onChange={(e) => setForm({ ...form, servico: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_TRABALHO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {professional && (
            <div className="prof-jobs-section">
              <div className="mini-note">
                <b>Valor Total:</b> {money(total)} &nbsp;&nbsp; <b>Valor Pago:</b> {money(pago)}
              </div>
              <div className="prof-jobs-toolbar">
                <b>Trabalhos / vínculos ({jobs.length})</b>
                <button type="button" className="btn secondary" onClick={onAddJob}>+ Adicionar vínculo</button>
              </div>
              {jobs.length ? (
                <div className="prof-jobs-list">
                  {jobs.map((job) => {
                    const etapa = project.obra.find((s) => s.id === job.etapa_id);
                    return (
                      <div key={job.id} className="prof-job-item">
                        <span className="prof-job-info">
                          <b>{etapa ? etapa.nome : '— etapa removida —'}</b>
                          {' — '}
                          {money(job.valor)} (pago {money(totalPaidForEntity(project.pagamentos, 'PROFESSIONAL', job.id))})
                          {' · '}
                          {job.forma === 'Cartão' && job.valorParcela
                            ? `Cartão · ${parseInt(job.parcelas) || 1}x de ${money(job.valorParcela)}`
                            : job.forma}
                          {' · '}
                          <JobStatusBadge status={job.status} />
                        </span>
                        <span className="rowactions">
                          {(() => { const jp = totalPaidForEntity(project.pagamentos, 'PROFESSIONAL', job.id); const js = Math.max(0, job.valor - jp); return js > 0 ? (
                            <button type="button" onClick={() => onPay({
                              id: `PROFESSIONAL:${job.id}`, sourceType: 'PROFESSIONAL', sourceId: job.id,
                              referencia: `${professional?.nome || 'Profissional'}${etapa ? ' — ' + etapa.nome : ''}`,
                              stageId: job.etapa_id, stageName: etapa?.nome || '—',
                              contratado: job.valor, pago: jp, saldo: js,
                              status: jp > 0 ? 'Parcial' : 'Pendente', vencimento: '',
                            })}>Pagar</button>
                          ) : null; })()}
                          <button type="button" onClick={() => onEditJob(job)}>Editar</button>
                          <button type="button" onClick={() => onDeleteJob(job.id)}>Excluir</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="hint">Nenhum vínculo ainda — este profissional não está ligado a nenhuma etapa.</div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

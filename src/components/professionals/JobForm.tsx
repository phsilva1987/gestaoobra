import { useState, useEffect } from 'react';
import type { Job, ProjectData, Commitment } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { totalPaidForEntity } from '../../services/commitmentService';
import { money } from '../../lib/format';

const FORMAS_PAGAMENTO = ['Pix', 'Cartão', 'Em Dinheiro'];
const PARCELAS_OPTS = ['1x', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x', '11x', '12x'];
const STATUS_TRABALHO = ['Cotação', 'Contratado', 'Em andamento', 'Concluído'];

export interface JobFormData {
  profissional_id: string;
  etapa_id: string;
  valor: number;
  forma: string;
  parcelas: string;
  chavePix: string;
  status: string;
}

interface JobFormProps {
  job: Job | null;
  presetProfId: string | null;
  project: ProjectData;
  onSave: (data: JobFormData) => Promise<void> | void;
  onCancel: () => void;
  onPay: (commitment: Commitment) => void;
  saving?: boolean;
}

export function JobForm({ job, presetProfId, project, onSave, onCancel, onPay, saving = false }: JobFormProps) {
  const [form, setForm] = useState<JobFormData>({
    profissional_id: job?.profissional_id || presetProfId || '',
    etapa_id: job?.etapa_id || '',
    valor: job?.valor || 0,
    forma: job?.forma || 'Pix',
    parcelas: job?.parcelas || '1x',
    chavePix: job?.chavePix || '',
    status: job?.status || 'Cotação',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (job) {
      setForm({
        profissional_id: job.profissional_id,
        etapa_id: job.etapa_id,
        valor: job.valor,
        forma: job.forma,
        parcelas: job.parcelas,
        chavePix: job.chavePix,
        status: job.status,
      });
    }
  }, [job]);

  function handleFormaChange(forma: string) {
    setForm((f) => ({
      ...f,
      forma,
      chavePix: forma === 'Pix' ? f.chavePix : '',
      parcelas: forma === 'Cartão' ? f.parcelas : '1x',
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.profissional_id) e.profissional_id = 'Selecione o profissional.';
    if (!form.etapa_id) e.etapa_id = 'Selecione a etapa vinculada.';
    if (form.valor < 0) e.valor = 'Valor não pode ser negativo.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave(form);
  }

  const valorParcela =
    form.forma === 'Cartão' && form.valor > 0
      ? form.valor / (parseInt(form.parcelas) || 1)
      : null;

  const pago = job ? totalPaidForEntity(project.pagamentos, 'PROFESSIONAL', job.id) : 0;
  const saldo = Math.max(0, form.valor - pago);

  function handlePay() {
    if (!job) return;
    const prof = project.profissionais.find((p) => p.id === job.profissional_id);
    const stage = project.obra.find((s) => s.id === job.etapa_id);
    onPay({
      id: `PROFESSIONAL:${job.id}`,
      sourceType: 'PROFESSIONAL',
      sourceId: job.id,
      referencia: `${prof?.nome || 'Profissional'}${stage ? ' — ' + stage.nome : ''}`,
      stageId: job.etapa_id,
      stageName: stage?.nome || '—',
      contratado: form.valor,
      pago,
      saldo,
      status: pago >= form.valor && form.valor > 0 ? 'Pago' : pago > 0 ? 'Parcial' : 'Pendente',
      vencimento: '',
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <h2>{job ? 'Editar vínculo' : 'Novo vínculo de trabalho'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Profissional *</label>
              <select value={form.profissional_id} onChange={(e) => setForm({ ...form, profissional_id: e.target.value })}>
                <option value="">Selecione o profissional…</option>
                {project.profissionais.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}{p.servico ? ' — ' + p.servico : ''}</option>
                ))}
              </select>
              {errors.profissional_id && <span className="field-error">{errors.profissional_id}</span>}
            </div>
            <div className="form-field">
              <label>Etapa vinculada *</label>
              <select value={form.etapa_id} onChange={(e) => setForm({ ...form, etapa_id: e.target.value })}>
                <option value="">Selecione a etapa…</option>
                {project.obra.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
              {errors.etapa_id && <span className="field-error">{errors.etapa_id}</span>}
            </div>
            <div className="form-field">
              <label>Valor cobrado (R$)</label>
              <CurrencyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
              {errors.valor && <span className="field-error">{errors.valor}</span>}
            </div>
            <div className="form-field">
              <label>Forma de pagamento</label>
              <select value={form.forma} onChange={(e) => handleFormaChange(e.target.value)}>
                {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_TRABALHO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {form.forma === 'Pix' && (
              <div className="form-field full">
                <label>Chave Pix</label>
                <input
                  type="text"
                  value={form.chavePix}
                  onChange={(e) => setForm({ ...form, chavePix: e.target.value })}
                />
              </div>
            )}
            {form.forma === 'Cartão' && (
              <>
                <div className="form-field">
                  <label>Parcelamento</label>
                  <select value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: e.target.value })}>
                    {PARCELAS_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {valorParcela !== null && (
                  <div className="form-field">
                    <label>Valor da parcela</label>
                    <input type="text" value={valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} readOnly />
                  </div>
                )}
              </>
            )}
          </div>

          {job && (
            <div className="entity-finance-summary">
              <div className="entity-finance-item">
                <small>Contratado</small>
                <strong>{money(form.valor)}</strong>
              </div>
              <div className="entity-finance-item">
                <small>Pago</small>
                <strong>{money(pago)}</strong>
              </div>
              <div className="entity-finance-item">
                <small>Saldo</small>
                <strong>{money(saldo)}</strong>
              </div>
              {saldo > 0 && (
                <button type="button" className="btn secondary" onClick={handlePay}>Registrar pagamento</button>
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

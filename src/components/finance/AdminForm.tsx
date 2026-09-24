import { useState, useEffect } from 'react';
import type { AdminItem, AdminRecurrenceType, AdminStatus } from '../../types';
import { CurrencyInput } from '../CurrencyInput';

const RECURRENCE_OPTIONS: { value: 'ONE_TIME' | 'MONTHLY' | 'ANNUAL'; label: string }[] = [
  { value: 'ONE_TIME', label: 'Único' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'ANNUAL', label: 'Anual' },
];

const STATUS_OPTIONS: { value: AdminStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
];

const CATEGORY_OPTIONS = [
  'Legalização',
  'Contabilidade',
  'Impostos e taxas',
  'Licenças',
  'Aluguel',
  'Energia',
  'Água',
  'Internet / Telecom',
  'Seguros',
  'Manutenção',
  'Serviços',
  'Outros',
];

export interface AdminFormData {
  nome: string;
  valor: number;
  pago: number;
  status: string;
  category: string | null;
  recurrenceType: AdminRecurrenceType;
  adminStatus: AdminStatus;
  notes: string | null;
}

interface AdminFormProps {
  item: AdminItem | null;
  onSave: (data: AdminFormData) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

export function AdminForm({ item, onSave, onCancel, saving = false }: AdminFormProps) {
  const [form, setForm] = useState<AdminFormData>({
    nome: item?.nome || '',
    valor: item?.valor || 0,
    pago: item?.pago || 0,
    status: item?.status || 'Pendente',
    category: item?.category ?? null,
    recurrenceType: item?.recurrenceType ?? 'ONE_TIME',
    adminStatus: item?.adminStatus ?? 'ACTIVE',
    notes: item?.notes ?? null,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        nome: item.nome,
        valor: item.valor,
        pago: item.pago,
        status: item.status,
        category: item.category,
        recurrenceType: item.recurrenceType,
        adminStatus: item.adminStatus,
        notes: item.notes,
      });
    }
  }, [item]);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.nome.trim()) {
      setError('Informe o nome da despesa.');
      return;
    }
    if (form.valor < 0 || form.pago < 0) {
      setError('Valores não podem ser negativos.');
      return;
    }
    onSave({ ...form, nome: form.nome.trim() });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <h2>{item ? 'Editar item administrativo' : 'Novo item administrativo'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field full">
              <label>Nome da despesa *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
            </div>
            <div className="form-field">
              <label>Categoria *</label>
              <select
                value={form.category ?? ''}
                onChange={(e) => setForm({ ...form, category: e.target.value || null })}
              >
                <option value="">Não classificado</option>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Recorrência *</label>
              <select
                value={form.recurrenceType ?? ''}
                onChange={(e) => setForm({ ...form, recurrenceType: (e.target.value || null) as AdminRecurrenceType })}
              >
                <option value="">Não classificado</option>
                {RECURRENCE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Valor (R$) *</label>
              <CurrencyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
            </div>
            <div className="form-field">
              <label>Status *</label>
              <select
                value={form.adminStatus}
                onChange={(e) => setForm({ ...form, adminStatus: e.target.value as AdminStatus })}
              >
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-field full">
              <label>Observações</label>
              <textarea
                rows={2}
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
                placeholder="Opcional"
              />
            </div>
          </div>
          {error && <span className="field-error" style={{ display: 'block', marginBottom: 8 }}>{error}</span>}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

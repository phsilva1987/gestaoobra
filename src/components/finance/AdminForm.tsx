import { useState, useEffect } from 'react';
import type { AdminItem } from '../../types';

const STATUS_ADMIN = ['Pendente', 'Em andamento', 'Pago'];

export interface AdminFormData {
  nome: string;
  valor: number;
  pago: number;
  status: string;
}

interface AdminFormProps {
  item: AdminItem | null;
  onSave: (data: AdminFormData) => void;
  onCancel: () => void;
}

export function AdminForm({ item, onSave, onCancel }: AdminFormProps) {
  const [form, setForm] = useState<AdminFormData>({
    nome: item?.nome || '',
    valor: item?.valor || 0,
    pago: item?.pago || 0,
    status: item?.status || 'Pendente',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        nome: item.nome,
        valor: item.valor,
        pago: item.pago,
        status: item.status,
      });
    }
  }, [item]);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.nome.trim()) {
      setError('Informe o nome do item.');
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
              <label>Nome *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
              {error && <span className="field-error">{error}</span>}
            </div>
            <div className="form-field">
              <label>Valor (R$)</label>
              <input type="number" min={0} step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: +e.target.value || 0 })} />
            </div>
            <div className="form-field">
              <label>Pago (R$)</label>
              <input type="number" min={0} step="0.01" value={form.pago} onChange={(e) => setForm({ ...form, pago: +e.target.value || 0 })} />
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_ADMIN.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

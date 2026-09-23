import { useState, useEffect } from 'react';
import type { Unforeseen } from '../../types';
import { CurrencyInput } from '../CurrencyInput';

const CATEGORIAS_IMPREVISTO = ['Hidráulica', 'Elétrica', 'Alvenaria', 'Demolição', 'Pintura', 'Outros'];
const STATUS_IMPREVISTO = ['Aberto', 'Resolvido'];

export interface UnforeseenFormData {
  nome: string;
  categoria: string;
  valor: number;
  impactoDias: number;
  status: string;
}

interface UnforeseenFormProps {
  unforeseen: Unforeseen | null;
  onSave: (data: UnforeseenFormData) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

export function UnforeseenForm({ unforeseen, onSave, onCancel, saving = false }: UnforeseenFormProps) {
  const [form, setForm] = useState<UnforeseenFormData>({
    nome: unforeseen?.nome || '',
    categoria: unforeseen?.categoria || CATEGORIAS_IMPREVISTO[0],
    valor: unforeseen?.valor || 0,
    impactoDias: unforeseen?.impactoDias || 0,
    status: unforeseen?.status || 'Aberto',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (unforeseen) {
      setForm({
        nome: unforeseen.nome,
        categoria: unforeseen.categoria,
        valor: unforeseen.valor,
        impactoDias: unforeseen.impactoDias,
        status: unforeseen.status,
      });
    }
  }, [unforeseen]);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.nome.trim()) {
      setError('Informe o nome do imprevisto.');
      return;
    }
    if (form.valor < 0) {
      setError('Valor não pode ser negativo.');
      return;
    }
    if (form.impactoDias < 0) {
      setError('Impacto em dias não pode ser negativo.');
      return;
    }
    onSave({ ...form, nome: form.nome.trim() });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <h2>{unforeseen ? 'Editar imprevisto' : 'Novo imprevisto'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field full">
              <label>Nome *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
              {error && <span className="field-error">{error}</span>}
            </div>
            <div className="form-field">
              <label>Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS_IMPREVISTO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Valor (R$)</label>
              <CurrencyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
            </div>
            <div className="form-field">
              <label>Impacto (dias)</label>
              <input type="number" min={0} value={form.impactoDias} onChange={(e) => setForm({ ...form, impactoDias: +e.target.value || 0 })} />
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_IMPREVISTO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

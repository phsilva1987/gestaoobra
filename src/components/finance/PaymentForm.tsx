import { useState, useEffect } from 'react';
import type { Payment } from '../../types';
import { CurrencyInput } from '../CurrencyInput';

const TIPOS_PAGAMENTO = ['Profissional', 'Material', 'Equipamento', 'Administrativo', 'Imprevisto', 'Outros'];
const FORMAS_PAGAMENTO = ['PIX', 'Boleto', 'Cartão', 'Em Dinheiro'];
const STATUS_PAGAMENTO = ['Pendente', 'Pago'];

export interface PaymentFormData {
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string;
  forma: string;
  status: string;
}

interface PaymentFormProps {
  payment: Payment | null;
  onSave: (data: PaymentFormData) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

export function PaymentForm({ payment, onSave, onCancel, saving = false }: PaymentFormProps) {
  const [form, setForm] = useState<PaymentFormData>({
    referencia: payment?.referencia || '',
    tipo: payment?.tipo || TIPOS_PAGAMENTO[0],
    valor: payment?.valor || 0,
    vencimento: payment?.vencimento || '',
    forma: payment?.forma || 'PIX',
    status: payment?.status || 'Pendente',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setForm({
        referencia: payment.referencia,
        tipo: payment.tipo,
        valor: payment.valor,
        vencimento: payment.vencimento,
        forma: payment.forma,
        status: payment.status,
      });
    }
  }, [payment]);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.referencia.trim()) {
      setError('Informe a referência do pagamento.');
      return;
    }
    if (form.valor < 0) {
      setError('Valor não pode ser negativo.');
      return;
    }
    onSave({ ...form, referencia: form.referencia.trim() });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <h2>{payment ? 'Editar pagamento' : 'Registrar pagamento'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field full">
              <label>Referência *</label>
              <input type="text" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} autoFocus />
              {error && <span className="field-error">{error}</span>}
            </div>
            <div className="form-field">
              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS_PAGAMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Valor (R$)</label>
              <CurrencyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
            </div>
            <div className="form-field">
              <label>Vencimento</label>
              <input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Forma</label>
              <select value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })}>
                {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_PAGAMENTO.map((s) => <option key={s} value={s}>{s}</option>)}
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

import { useState, useEffect } from 'react';
import type { Payment, Commitment, PaymentSourceType } from '../../types';
import { CurrencyInput } from '../CurrencyInput';
import { money } from '../../lib/format';

const FORMAS_PAGAMENTO = ['PIX', 'Dinheiro', 'Cartão', 'Boleto', 'Transferência', 'Outro'];

export interface PaymentFormData {
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string;
  forma: string;
  status: string;
  sourceType: PaymentSourceType;
  sourceId: string | null;
  stageId: string | null;
  paidAt: string;
  observacao: string;
}

interface PaymentFormProps {
  payment: Payment | null;
  commitment: Commitment | null;
  onSave: (data: PaymentFormData) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

export function PaymentForm({ payment, commitment, onSave, onCancel, saving = false }: PaymentFormProps) {
  const isEditing = !!payment;
  const maxAmount = commitment ? commitment.saldo + (payment?.valor || 0) : 0;

  const [form, setForm] = useState<PaymentFormData>({
    referencia: payment?.referencia || commitment?.referencia || '',
    tipo: payment?.tipo || (commitment?.sourceType === 'PROFESSIONAL' ? 'Profissional' : commitment?.sourceType === 'MATERIAL' ? 'Material' : 'Equipamento'),
    valor: payment?.valor || 0,
    vencimento: payment?.vencimento || commitment?.vencimento || '',
    forma: payment?.forma || 'PIX',
    status: payment?.status || 'Pago',
    sourceType: payment?.sourceType || commitment?.sourceType || null,
    sourceId: payment?.sourceId || commitment?.sourceId || null,
    stageId: payment?.stageId || commitment?.stageId || null,
    paidAt: payment?.paidAt || new Date().toISOString().slice(0, 10),
    observacao: payment?.observacao || '',
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
        sourceType: payment.sourceType,
        sourceId: payment.sourceId,
        stageId: payment.stageId,
        paidAt: payment.paidAt,
        observacao: payment.observacao,
      });
    }
  }, [payment]);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (form.valor <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (commitment && form.valor > maxAmount) {
      setError(`Este pagamento excede o saldo restante de ${money(commitment.saldo + (payment?.valor || 0))}.`);
      return;
    }
    if (!form.paidAt) {
      setError('Informe a data do pagamento.');
      return;
    }
    onSave({ ...form, referencia: form.referencia.trim() || commitment?.referencia || 'Pagamento' });
  }

  const sourceLabel = commitment
    ? commitment.sourceType === 'PROFESSIONAL' ? 'Profissional'
      : commitment.sourceType === 'MATERIAL' ? 'Material'
      : 'Equipamento'
    : '';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? 'Editar pagamento' : 'Registrar pagamento'}</h2>

        {commitment && (
          <div className="payment-commitment-info">
            <div className="form-grid">
              <div className="form-field"><label>Referência</label><span className="hint"><b>{commitment.referencia}</b></span></div>
              <div className="form-field"><label>Origem</label><span className="hint">{sourceLabel}</span></div>
              <div className="form-field"><label>Etapa</label><span className="hint">{commitment.stageName}</span></div>
              <div className="form-field"><label>Contratado</label><span className="hint">{money(commitment.contratado)}</span></div>
              <div className="form-field"><label>Total já pago</label><span className="hint">{money(commitment.pago)}</span></div>
              <div className="form-field"><label>Saldo atual</label><span className="hint"><b>{money(commitment.saldo)}</b></span></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Valor deste pagamento (R$) *</label>
              <CurrencyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
              {commitment && <span className="hint">Saldo disponível: {money(maxAmount)}</span>}
              {error && <span className="field-error">{error}</span>}
            </div>
            <div className="form-field">
              <label>Data do pagamento *</label>
              <input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
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
            <div className="form-field full">
              <label>Observação</label>
              <input type="text" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Ex: Entrada, parcela 1/2, etc." />
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

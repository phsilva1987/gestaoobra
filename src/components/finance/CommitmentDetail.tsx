import type { ProjectData, Commitment, Payment } from '../../types';
import { commitmentPayments } from '../../services/commitmentService';
import { money, fmt } from '../../lib/format';

interface CommitmentDetailProps {
  commitment: Commitment;
  project: ProjectData;
  onPay: (commitment: Commitment) => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (payment: Payment) => void;
  onClose: () => void;
}

function SourceLabel({ type }: { type: string }) {
  const label =
    type === 'PROFESSIONAL' ? 'Profissional'
      : type === 'MATERIAL' ? 'Material'
      : 'Equipamento';
  return <span className="badge status-Cotação">{label}</span>;
}

export function CommitmentDetail({
  commitment,
  project,
  onPay,
  onEditPayment,
  onDeletePayment,
  onClose,
}: CommitmentDetailProps) {
  const payments = commitmentPayments(project.pagamentos, commitment.sourceType, commitment.sourceId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modalbox modalbox-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{commitment.referencia}</h2>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div className="form-field"><label>Origem</label><span className="hint"><SourceLabel type={commitment.sourceType} /></span></div>
          <div className="form-field"><label>Etapa</label><span className="hint">{commitment.stageName}</span></div>
          <div className="form-field"><label>Contratado</label><span className="hint"><b>{money(commitment.contratado)}</b></span></div>
          <div className="form-field"><label>Pago</label><span className="hint">{money(commitment.pago)}</span></div>
          <div className="form-field"><label>Saldo</label><span className="hint"><b>{money(commitment.saldo)}</b></span></div>
          <div className="form-field"><label>Status</label><span className="hint">{commitment.status}</span></div>
        </div>

        <div className="finance-panel-head">
          <h3>Pagamentos deste compromisso</h3>
          {commitment.saldo > 0 && (
            <button className="btn secondary" onClick={() => onPay(commitment)}>+ Pagar</button>
          )}
        </div>

        {payments.length ? (
          <div className="stage-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th><th>Valor</th><th>Forma</th><th>Observação</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{fmt(p.paidAt)}</td>
                    <td><b>{money(p.valor)}</b></td>
                    <td>{p.forma}</td>
                    <td>{p.observacao || '—'}</td>
                    <td>{p.status}</td>
                    <td className="rowactions">
                      <button onClick={() => onEditPayment(p)}>Editar</button>
                      <button onClick={() => onDeletePayment(p)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Nenhum pagamento registrado para este compromisso.</p>
        )}

        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

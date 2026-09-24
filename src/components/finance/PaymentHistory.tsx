import type { ProjectData, Payment } from '../../types';
import { historyPayments } from '../../services/commitmentService';
import { money, fmt } from '../../lib/format';

interface PaymentHistoryProps {
  project: ProjectData;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}

function SourceBadge({ type }: { type: Payment['sourceType'] }) {
  if (!type || type === 'LEGACY') return <span className="badge status-Cotação">Legado</span>;
  const label =
    type === 'PROFESSIONAL' ? 'Profissional'
      : type === 'MATERIAL' ? 'Material'
      : type === 'EQUIPMENT' ? 'Equipamento'
      : '—';
  return <span className="badge status-Cotação">{label}</span>;
}

export function PaymentHistory({ project, onEdit, onDelete }: PaymentHistoryProps) {
  const paid = historyPayments(project.pagamentos);

  if (!paid.length) {
    return (
      <div className="stage-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Data</th><th>Referência</th><th>Origem</th><th>Etapa</th>
              <th>Valor pago</th><th>Forma</th><th>Observação</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={8} className="empty">Nenhum pagamento realizado.</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  const stageName = (id: string | null) => {
    if (!id) return '—';
    return project.obra.find((s) => s.id === id)?.nome || '—';
  };

  return (
    <div className="stage-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Data</th><th>Referência</th><th>Origem</th><th>Etapa</th>
            <th>Valor pago</th><th>Forma</th><th>Observação</th><th></th>
          </tr>
        </thead>
        <tbody>
          {paid.map((p) => (
            <tr key={p.id}>
              <td>{fmt(p.paidAt)}</td>
              <td><b>{p.referencia}</b></td>
              <td><SourceBadge type={p.sourceType} /></td>
              <td>{stageName(p.stageId)}</td>
              <td><b>{money(p.valor)}</b></td>
              <td>{p.forma}</td>
              <td>{p.observacao || '—'}</td>
              <td className="rowactions">
                <button onClick={() => onEdit(p)}>Editar</button>
                <button onClick={() => onDelete(p)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

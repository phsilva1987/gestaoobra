import type { Payment, ProjectData } from '../../types';
import { money, fmt } from '../../lib/format';

interface PaymentsTableProps {
  project: ProjectData;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}

function PaymentStatusBadge({ status }: { status: string }) {
  const cls = status === 'Pago' ? 'status-Concluído' : 'status-Cotação';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function PaymentsTable({ project, onEdit, onDelete }: PaymentsTableProps) {
  if (!project.pagamentos.length) {
    return (
      <div className="card section">
        <div className="stage-table-scroll">
          <table>
            <thead>
              <tr><th>Referência</th><th>Tipo</th><th>Valor</th><th>Vencimento</th><th>Forma</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr><td colSpan={7} className="empty">Nenhum pagamento registrado.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card section">
      <div className="stage-table-scroll">
        <table>
          <thead>
            <tr><th>Referência</th><th>Tipo</th><th>Valor</th><th>Vencimento</th><th>Forma</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {project.pagamentos.map((p) => (
              <tr key={p.id}>
                <td><b>{p.referencia}</b></td>
                <td>{p.tipo}</td>
                <td><b>{money(p.valor)}</b></td>
                <td>{fmt(p.vencimento)}</td>
                <td>{p.forma}</td>
                <td><PaymentStatusBadge status={p.status} /></td>
                <td className="rowactions">
                  <button onClick={() => onEdit(p)}>Editar</button>
                  <button onClick={() => onDelete(p)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

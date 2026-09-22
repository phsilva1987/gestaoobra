import type { AdminItem, ProjectData } from '../../types';
import { money } from '../../lib/format';

interface AdminTableProps {
  project: ProjectData;
  onEdit: (item: AdminItem) => void;
  onDelete: (item: AdminItem) => void;
}

function AdminStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Pago' ? 'status-Concluído'
    : status === 'Em andamento' ? 'status-Atenção'
    : 'status-Cotação';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function AdminTable({ project, onEdit, onDelete }: AdminTableProps) {
  if (!project.admin.length) {
    return (
      <div className="card section">
        <div className="stage-table-scroll">
          <table>
            <thead>
              <tr><th>Item</th><th>Valor</th><th>Pago</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr><td colSpan={5} className="empty">Nenhum item administrativo cadastrado.</td></tr>
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
            <tr><th>Item</th><th>Valor</th><th>Pago</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {project.admin.map((a) => (
              <tr key={a.id}>
                <td><b>{a.nome}</b></td>
                <td>{money(a.valor)}</td>
                <td>{money(a.pago)}</td>
                <td><AdminStatusBadge status={a.status} /></td>
                <td className="rowactions">
                  <button onClick={() => onEdit(a)}>Editar</button>
                  <button onClick={() => onDelete(a)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

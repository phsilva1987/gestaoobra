import type { AdminItem, ProjectData, AdminRecurrenceType } from '../../types';
import { money } from '../../lib/format';

interface AdminTableProps {
  project: ProjectData;
  onEdit: (item: AdminItem) => void;
  onDelete: (item: AdminItem) => void;
}

const RECURRENCE_LABEL: Record<NonNullable<AdminRecurrenceType>, string> = {
  ONE_TIME: 'Único',
  MONTHLY: 'Mensal',
  ANNUAL: 'Anual',
};

function RecurrenceBadge({ type }: { type: AdminRecurrenceType }) {
  if (!type) return <span className="badge">Não classificado</span>;
  return <span className={`badge recurrence-${type.toLowerCase()}`}>{RECURRENCE_LABEL[type]}</span>;
}

function ActiveBadge({ status }: { status: string }) {
  const cls = status === 'ACTIVE' ? 'status-Concluído' : 'status-Atrasado';
  const label = status === 'ACTIVE' ? 'Ativo' : 'Inativo';
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function AdminTable({ project, onEdit, onDelete }: AdminTableProps) {
  if (!project.admin.length) {
    return (
      <div className="card section admin-card">
        <div className="admin-scroll">
          <table>
            <thead>
              <tr><th>Item</th><th>Categoria</th><th>Recorrência</th><th>Valor</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr><td colSpan={6} className="empty">Nenhum item administrativo cadastrado.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card section admin-card">
      <div className="admin-scroll">
        <table>
          <thead>
            <tr><th>Item</th><th>Categoria</th><th>Recorrência</th><th>Valor</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {project.admin.map((a) => (
              <tr key={a.id}>
                <td><b>{a.nome}</b></td>
                <td>{a.category || <span className="hint">Não classificado</span>}</td>
                <td><RecurrenceBadge type={a.recurrenceType} /></td>
                <td><b>{money(a.valor)}</b></td>
                <td><ActiveBadge status={a.adminStatus} /></td>
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

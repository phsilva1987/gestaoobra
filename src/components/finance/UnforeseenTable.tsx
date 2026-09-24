import type { Unforeseen, ProjectData } from '../../types';
import { money } from '../../lib/format';

interface UnforeseenTableProps {
  project: ProjectData;
  onEdit: (unforeseen: Unforeseen) => void;
  onDelete: (unforeseen: Unforeseen) => void;
}

function UnforeseenStatusBadge({ status }: { status: string }) {
  const cls = status === 'Resolvido' ? 'status-Concluído' : 'status-Atrasado';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function UnforeseenTable({ project, onEdit, onDelete }: UnforeseenTableProps) {
  if (!project.imprevistos.length) {
    return (
      <div className="unforeseen-scroll">
        <table>
          <thead>
            <tr><th>Item</th><th>Categoria</th><th>Valor</th><th>Impacto</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            <tr><td colSpan={6} className="empty">Nenhum imprevisto registrado.</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="unforeseen-scroll">
      <table>
        <thead>
          <tr><th>Item</th><th>Categoria</th><th>Valor</th><th>Impacto</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {project.imprevistos.map((u) => (
            <tr key={u.id}>
              <td><b>{u.nome}</b></td>
              <td>{u.categoria}</td>
              <td><b>{money(u.valor)}</b></td>
              <td>{u.impactoDias} dia(s)</td>
              <td><UnforeseenStatusBadge status={u.status} /></td>
              <td className="rowactions">
                <button onClick={() => onEdit(u)}>Editar</button>
                <button onClick={() => onDelete(u)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

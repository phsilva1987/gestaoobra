import type { Material, ProjectData } from '../../types';
import { materialTotal } from '../../lib/calculations';
import { money } from '../../lib/format';
import { totalPaidForEntity } from '../../services/commitmentService';

interface MaterialTableProps {
  project: ProjectData;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
}

function MaterialStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Entregue'
      ? 'status-Concluído'
      : status === 'Comprado'
        ? 'status-Atenção'
        : 'status-Cotação';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function MaterialTable({ project, onEdit, onDelete }: MaterialTableProps) {
  if (!project.materiais.length) {
    return (
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Material</th><th>Categoria</th><th>Etapa</th><th>Qtd.</th>
              <th>Valor unitário</th><th>Total</th><th>Pago</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={9} className="empty">Nenhum material cadastrado.</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  function fornecedorNome(id: string): string {
    const f = project.fornecedores.find((s) => s.id === id);
    return f ? f.nome : '—';
  }

  function etapaNome(id: string): string {
    const s = project.obra.find((st) => st.id === id);
    return s ? s.nome : '— etapa removida —';
  }

  return (
    <div className="card stage-table-card">
      <div className="stage-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Material</th><th>Categoria</th><th>Etapa</th><th>Qtd.</th>
              <th>Valor unitário</th><th>Total</th><th>Pago</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {project.materiais.map((m) => (
              <tr key={m.id}>
                <td>
                  <b>{m.nome}</b>
                  <div className="hint">{fornecedorNome(m.fornecedorId)}</div>
                </td>
                <td>{m.categoria}</td>
                <td>{etapaNome(m.etapa_id)}</td>
                <td>{m.quantidade} {m.unidade}</td>
                <td>{money(m.unitario)}</td>
                <td><b>{money(materialTotal(m))}</b></td>
                <td>{money(totalPaidForEntity(project.pagamentos, 'MATERIAL', m.id))}</td>
                <td><MaterialStatusBadge status={m.status} /></td>
                <td className="rowactions">
                  <button onClick={() => onEdit(m)}>Editar</button>
                  <button onClick={() => onDelete(m)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

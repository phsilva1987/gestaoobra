import type { Equipment, ProjectData } from '../../types';
import { money, fmt } from '../../lib/format';

interface EquipmentTableProps {
  project: ProjectData;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
}

function EquipmentStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Entregue' || status === 'Montado'
      ? 'status-Concluído'
      : status === 'Aguardando entrega'
        ? 'status-Atenção'
        : 'status-Cotação';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function EquipmentTable({ project, onEdit, onDelete }: EquipmentTableProps) {
  if (!project.equipamentos.length) {
    return (
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Aparelho</th><th>Etapa</th><th>Qtd.</th><th>Valor</th>
              <th>Forma</th><th>Compra</th><th>Entrega</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={9} className="empty">Nenhum equipamento cadastrado.</td></tr>
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
              <th>Aparelho</th><th>Etapa</th><th>Qtd.</th><th>Valor</th>
              <th>Forma</th><th>Compra</th><th>Entrega</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {project.equipamentos.map((e) => {
              const formaTxt =
                e.forma === 'Cartão' && e.valorParcela
                  ? `Cartão · ${parseInt(e.parcelas) || 1}x de ${money(e.valorParcela)}`
                  : e.forma || '—';
              return (
                <tr key={e.id}>
                  <td>
                    <b>{e.nome}</b>
                    <div className="hint">{fornecedorNome(e.fornecedorId)}</div>
                  </td>
                  <td>{etapaNome(e.etapa_id)}</td>
                  <td>{e.quantidade}</td>
                  <td><b>{money(e.valor)}</b></td>
                  <td>{formaTxt}</td>
                  <td>{fmt(e.compra)}</td>
                  <td>{fmt(e.entrega)}</td>
                  <td><EquipmentStatusBadge status={e.status} /></td>
                  <td className="rowactions">
                    <button onClick={() => onEdit(e)}>Editar</button>
                    <button onClick={() => onDelete(e)}>Excluir</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import type { Equipment, ProjectData, Commitment } from '../../types';
import { money, fmt } from '../../lib/format';
import { totalPaidForEntity } from '../../services/commitmentService';

interface EquipmentTableProps {
  project: ProjectData;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onPay: (commitment: Commitment) => void;
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

export function EquipmentTable({ project, onEdit, onDelete, onPay }: EquipmentTableProps) {
  const headers = (
    <tr>
      <th>Aparelho</th><th>Etapa</th><th>Qtd.</th><th>Valor</th>
      <th>Pago</th><th>Saldo</th><th>Forma</th><th>Compra</th><th>Entrega</th><th>Status</th><th></th>
    </tr>
  );

  if (!project.equipamentos.length) {
    return (
      <div className="card">
        <table>
          <thead>{headers}</thead>
          <tbody>
            <tr><td colSpan={11} className="empty">Nenhum equipamento cadastrado.</td></tr>
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
          <thead>{headers}</thead>
          <tbody>
            {project.equipamentos.map((e) => {
              const paid = totalPaidForEntity(project.pagamentos, 'EQUIPMENT', e.id);
              const saldo = Math.max(0, e.valor - paid);
              const stage = project.obra.find((s) => s.id === e.etapa_id);
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
                  <td>{money(paid)}</td>
                  <td>{money(saldo)}</td>
                  <td>{formaTxt}</td>
                  <td>{fmt(e.compra)}</td>
                  <td>{fmt(e.entrega)}</td>
                  <td><EquipmentStatusBadge status={e.status} /></td>
                  <td className="rowactions">
                    {saldo > 0 && (
                      <button onClick={() => onPay({
                        id: `EQUIPMENT:${e.id}`, sourceType: 'EQUIPMENT', sourceId: e.id,
                        referencia: e.nome, stageId: e.etapa_id, stageName: stage?.nome || '—',
                        contratado: e.valor, pago: paid, saldo, status: paid > 0 ? 'Parcial' : 'Pendente',
                        vencimento: e.entrega || '',
                      })}>Pagar</button>
                    )}
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

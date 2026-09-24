import type { ProjectData, Commitment } from '../../types';
import { buildCommitments } from '../../services/commitmentService';
import { money, fmt } from '../../lib/format';

interface CommitmentListProps {
  project: ProjectData;
  onPay: (commitment: Commitment) => void;
  onView: (commitment: Commitment) => void;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Pago' ? 'status-Concluído'
      : status === 'Parcial' ? 'status-Atenção'
      : 'status-Cotação';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function SourceLabel({ type }: { type: string }) {
  const label =
    type === 'PROFESSIONAL' ? 'Profissional'
      : type === 'MATERIAL' ? 'Material'
      : 'Equipamento';
  return <span className="badge status-Cotação">{label}</span>;
}

export function CommitmentList({ project, onPay, onView }: CommitmentListProps) {
  const commitments = buildCommitments(project).filter((c) => c.saldo > 0 || c.status === 'Pendente' || c.status === 'Parcial');

  if (!commitments.length) {
    return (
      <div className="stage-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Referência</th><th>Origem</th><th>Etapa</th><th>Contratado</th>
              <th>Pago</th><th>Saldo</th><th>Próximo vencimento</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={9} className="empty">Nenhum compromisso pendente.</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="stage-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Referência</th><th>Origem</th><th>Etapa</th><th>Contratado</th>
            <th>Pago</th><th>Saldo</th><th>Próximo vencimento</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {commitments.map((c) => (
            <tr key={c.id}>
              <td><b>{c.referencia}</b></td>
              <td><SourceLabel type={c.sourceType} /></td>
              <td>{c.stageName}</td>
              <td><b>{money(c.contratado)}</b></td>
              <td>{money(c.pago)}</td>
              <td><b>{money(c.saldo)}</b></td>
              <td>{c.vencimento ? fmt(c.vencimento) : '—'}</td>
              <td><StatusBadge status={c.status} /></td>
              <td className="rowactions">
                {c.saldo > 0 && (
                  <button onClick={() => onPay(c)}>Pagar</button>
                )}
                <button onClick={() => onView(c)}>Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

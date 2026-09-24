import type { ProjectData } from '../../types';
import { financeMetrics } from '../../lib/calculations';
import { money } from '../../lib/format';

interface FinanceKpisProps {
  project: ProjectData;
}

export function FinanceKpis({ project }: FinanceKpisProps) {
  const m = financeMetrics(project);
  return (
    <>
      <div className="grid kpis finance-kpis">
        <div className="card kpi">
          <small>Investimento planejado</small>
          <strong>{money(m.budget)}</strong>
        </div>
        <div className="card kpi">
          <small>Comprometido total</small>
          <strong>{money(m.comprometido)}</strong>
        </div>
        <div className="card kpi">
          <small>Pago</small>
          <strong>{money(m.pago)}</strong>
        </div>
        <div className="card kpi">
          <small>A pagar</small>
          <strong>{money(m.apagar)}</strong>
        </div>
        <div className="card kpi">
          <small>A pagar (agendado)</small>
          <strong>{money(m.apagarAgendado)}</strong>
        </div>
        <div className="card kpi">
          <small>Imprevistos</small>
          <strong>{money(m.imprevistos)}</strong>
        </div>
      </div>
      {m.over && (
        <div className="card section budget-alert" style={{ marginTop: 14 }}>
          <span className="hint" style={{ color: 'var(--red, #c0392b)' }}>
            Orçamento excedido em {money(m.overAmount)} · {m.comprometidoPct}% do orçamento comprometido
          </span>
        </div>
      )}
    </>
  );
}

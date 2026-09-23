import type { ProjectData } from '../../types';
import { financeMetrics } from '../../lib/calculations';
import { money } from '../../lib/format';

interface BudgetBarProps {
  project: ProjectData;
}

export function BudgetBar({ project }: BudgetBarProps) {
  const m = financeMetrics(project);
  const budget = m.budget;
  const usedPct = budget ? Math.min(100, Math.round((m.pago / budget) * 100)) : 0;

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="toolbar">
        <div>
          <h3 style={{ margin: 0 }}>Utilização do orçamento</h3>
          <span className="hint">Valor efetivamente pago em relação ao investimento planejado</span>
        </div>
        <b>{usedPct}%</b>
      </div>
      <div className="budgetbar">
        <i style={{ width: `${usedPct}%` }} />
      </div>
      <div className="budgetmeta">
        <span>Pago: {money(m.pago)}</span>
        <span>Comprometido: {m.comprometidoPct}% do orçamento</span>
        <span>Saldo projetado: {money(m.saldoProjetado)}</span>
      </div>
    </div>
  );
}

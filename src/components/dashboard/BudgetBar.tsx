import type { ProjectData } from '../../types';
import { projectTotals } from '../../lib/calculations';
import { money } from '../../lib/format';

interface BudgetBarProps {
  project: ProjectData;
}

export function BudgetBar({ project }: BudgetBarProps) {
  const t = projectTotals(project);
  const budget = t.budget;
  const usedPct = budget ? Math.min(100, Math.round((t.pago / budget) * 100)) : 0;
  const commPct = budget ? Math.min(100, Math.round((t.contratado / budget) * 100)) : 0;

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
        <span>Pago: {money(t.pago)}</span>
        <span>Contratado: {commPct}% do orçamento</span>
        <span>Disponível: {money(t.available)}</span>
      </div>
    </div>
  );
}

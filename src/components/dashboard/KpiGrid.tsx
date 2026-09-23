import type { ProjectData } from '../../types';
import { financeMetrics, projectTotals } from '../../lib/calculations';
import { money } from '../../lib/format';
import { svgIcon } from '../../lib/navigation';

interface KpiGridProps {
  project: ProjectData;
}

export function KpiGrid({ project }: KpiGridProps) {
  const m = financeMetrics(project);
  const t = projectTotals(project);
  const saldoProjetado = m.saldoProjetado;
  const saldoClass = saldoProjetado < 0 ? 'status-Atrasado' : 'gold';

  return (
    <>
      <div className="grid kpis">
        <div className="card kpi">
          <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('coins') }} />
          <small>Investimento planejado</small>
          <strong>{money(m.budget)}</strong>
        </div>
        <div className="card kpi">
          <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('receipt') }} />
          <small>Comprometido</small>
          <strong>{money(m.comprometido)}</strong>
        </div>
        <div className="card kpi">
          <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('wallet') }} />
          <small>Pago</small>
          <strong>{money(m.pago)}</strong>
        </div>
        <div className="card kpi">
          <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('chart') }} />
          <small>Saldo projetado</small>
          <strong className={saldoClass}>{money(saldoProjetado)}</strong>
        </div>
        <div className="card kpi">
          <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('pie') }} />
          <small>Progresso da obra</small>
          <strong className="gold">{t.prog}%</strong>
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

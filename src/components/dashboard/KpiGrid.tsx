import type { ProjectData } from '../../types';
import { projectTotals } from '../../lib/calculations';
import { money } from '../../lib/format';
import { svgIcon } from '../../lib/navigation';

interface KpiGridProps {
  project: ProjectData;
}

export function KpiGrid({ project }: KpiGridProps) {
  const t = projectTotals(project);
  const available = t.available;

  return (
    <div className="grid kpis">
      <div className="card kpi">
        <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('coins') }} />
        <small>Investimento planejado</small>
        <strong>{money(t.budget)}</strong>
      </div>
      <div className="card kpi">
        <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('wallet') }} />
        <small>Pago</small>
        <strong>{money(t.pago)}</strong>
      </div>
      <div className="card kpi">
        <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('receipt') }} />
        <small>Contratado</small>
        <strong>{money(t.contratado)}</strong>
      </div>
      <div className="card kpi">
        <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('pie') }} />
        <small>Saldo disponível</small>
        <strong className={available < 0 ? 'status-Atrasado' : 'gold'}>{money(available)}</strong>
      </div>
      <div className="card kpi">
        <span className="kicon" dangerouslySetInnerHTML={{ __html: svgIcon('chart') }} />
        <small>Progresso da obra</small>
        <strong className="gold">{t.prog}%</strong>
      </div>
    </div>
  );
}

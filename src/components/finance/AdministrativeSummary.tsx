import type { ProjectData } from '../../types';
import { money } from '../../lib/format';

interface AdministrativeSummaryProps {
  project: ProjectData;
}

export function AdministrativeSummary({ project }: AdministrativeSummaryProps) {
  const active = project.admin.filter((a) => a.adminStatus === 'ACTIVE');

  const oneTime = active
    .filter((a) => a.recurrenceType === 'ONE_TIME')
    .reduce((s, a) => s + a.valor, 0);

  const monthly = active
    .filter((a) => a.recurrenceType === 'MONTHLY')
    .reduce((s, a) => s + a.valor, 0);

  const annual = active
    .filter((a) => a.recurrenceType === 'ANNUAL')
    .reduce((s, a) => s + a.valor, 0);

  const kpis = [
    { label: 'Custos únicos', value: money(oneTime), sub: '' },
    { label: 'Custo fixo mensal', value: money(monthly), sub: '/ mês' },
    { label: 'Custo anual', value: money(annual), sub: '/ ano' },
    { label: 'Itens ativos', value: String(active.length), sub: '' },
  ];

  return (
    <div className="kpi-grid admin-kpi-grid">
      {kpis.map((k) => (
        <div key={k.label} className="kpi-card">
          <span className="kpi-label">{k.label}</span>
          <span className="kpi-value">{k.value}<span className="kpi-sub">{k.sub}</span></span>
        </div>
      ))}
    </div>
  );
}

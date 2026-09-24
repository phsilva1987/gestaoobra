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

  const oneTimeCount = active.filter((a) => a.recurrenceType === 'ONE_TIME').length;
  const monthlyCount = active.filter((a) => a.recurrenceType === 'MONTHLY').length;
  const annualCount = active.filter((a) => a.recurrenceType === 'ANNUAL').length;
  const totalCount = project.admin.length;

  const kpis = [
    { label: 'Custos únicos', value: money(oneTime), sub: '', aux: `${oneTimeCount} ${oneTimeCount === 1 ? 'item' : 'itens'}` },
    { label: 'Custo fixo mensal', value: money(monthly), sub: '/ mês', aux: `${monthlyCount} ${monthlyCount === 1 ? 'item ativo' : 'itens ativos'}` },
    { label: 'Custo anual', value: money(annual), sub: '/ ano', aux: `${annualCount} ${annualCount === 1 ? 'item' : 'itens'}` },
    { label: 'Itens ativos', value: String(active.length), sub: '', aux: `${totalCount} cadastrados` },
  ];

  return (
    <div className="admin-kpi-grid">
      {kpis.map((k) => (
        <div key={k.label} className="kpi-card">
          <span className="kpi-label">{k.label}</span>
          <span className="kpi-value">{k.value}{k.sub && <span className="kpi-sub">{k.sub}</span>}</span>
          <span className="kpi-aux">{k.aux}</span>
        </div>
      ))}
    </div>
  );
}

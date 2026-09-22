import type { ProjectData } from '../../types';
import { categoryStats } from '../../lib/calculations';
import { money } from '../../lib/format';

interface CategoryComparisonProps {
  project: ProjectData;
}

export function CategoryComparison({ project }: CategoryComparisonProps) {
  const cats = categoryStats(project);
  const entries = Object.entries(cats);
  const max = Math.max(1, ...entries.map(([, v]) => Math.max(v.prev, v.real)));

  if (!entries.length) {
    return (
      <div className="card section">
        <h3>Previsto × contratado por categoria</h3>
        <div className="empty">Cadastre valores na obra para gerar o comparativo.</div>
      </div>
    );
  }

  return (
    <div className="card section">
      <h3>Previsto × contratado por categoria</h3>
      <span className="hint">Onde o orçamento está sendo consumido</span>
      {entries.map(([k, v]) => (
        <div key={k} className="chart-row">
          <span>{k}</span>
          <div>
            <div className="chart-track">
              <i style={{ width: `${Math.min(100, (v.real / max) * 100)}%` }} />
            </div>
            <div className="hint">Previsto {money(v.prev)}</div>
          </div>
          <b>{money(v.real)}</b>
        </div>
      ))}
    </div>
  );
}

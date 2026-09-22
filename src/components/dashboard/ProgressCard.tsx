import type { ProjectData } from '../../types';
import { projectTotals } from '../../lib/calculations';

interface ProgressCardProps {
  project: ProjectData;
}

export function ProgressCard({ project }: ProgressCardProps) {
  const t = projectTotals(project);

  return (
    <div className="card section dashboard-progress-card">
      <h3>Progresso da obra</h3>
      <div className="progressline">
        <div className="bar">
          <i style={{ width: `${t.prog}%` }} />
        </div>
        <b>{t.prog}%</b>
      </div>
      <div className="dashboard-progress-scroll">
        {project.obra.length ? (
          project.obra.map((x) => (
            <div key={x.id} className="dashboard-progress-item">
              <div className="toolbar">
                <span>{x.nome}</span>
                <span className="hint">{x.progresso || 0}%</span>
              </div>
              <div className="bar">
                <i style={{ width: `${x.progresso || 0}%` }} />
              </div>
            </div>
          ))
        ) : (
          <div className="empty">Nenhuma etapa cadastrada.</div>
        )}
      </div>
    </div>
  );
}

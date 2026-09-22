import type { ProjectData } from '../../types';
import { dashboardMetrics } from '../../lib/calculations';
import { fmt } from '../../lib/format';

interface NextSevenDaysProps {
  project: ProjectData;
}

function badge(status: string) {
  return <span className={`badge status-${(status || '').replace(/ /g, '-')}`}>{status || '—'}</span>;
}

export function NextSevenDays({ project }: NextSevenDaysProps) {
  const m = dashboardMetrics(project);

  return (
    <div className="card section dashboard-next-card">
      <h3>Próximos 7 dias</h3>
      <div className="timeline">
        {m.next7.length ? (
          m.next7.map((x) => {
            const prof = x.profissionalId
              ? project.profissionais.find((p) => String(p.id) === String(x.profissionalId))
              : null;
            const resp = prof ? prof.nome : '';
            return (
              <div key={x.id} className="timeline-item">
                <div className="timeline-date">{fmt(x.inicio).slice(0, 5)}</div>
                <div className="timeline-title">
                  <b>{x.nome}</b>
                  <small>{resp || 'Responsável não informado'}</small>
                </div>
                {badge(x.status)}
              </div>
            );
          })
        ) : (
          <div className="empty">Nenhuma atividade programada para os próximos 7 dias.</div>
        )}
      </div>
    </div>
  );
}

import type { Stage, ProjectData } from '../../types';
import { autoSituation, responsaveisEtapa } from '../../lib/calculations';
import { isoToday, fmt } from '../../lib/format';
import { StageStatusBadge } from '../stages/StageStatusBadge';

interface ScheduleTableProps {
  project: ProjectData;
  onEdit: (stage: Stage) => void;
  onChecklist: (stage: Stage) => void;
}

export function ScheduleTable({ project, onEdit, onChecklist }: ScheduleTableProps) {
  const today = isoToday();

  if (!project.obra.length) {
    return (
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Etapa</th><th>Dependência</th><th>Início</th>
              <th>Fim</th><th>Situação</th><th>Progresso</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={7} className="empty">Nenhuma etapa cadastrada.</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="card stage-table-card">
      <div className="stage-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Etapa</th><th>Dependência</th><th>Início</th>
              <th>Fim</th><th>Situação</th><th>Progresso</th><th></th>
            </tr>
          </thead>
          <tbody>
            {project.obra.map((stage) => {
              const situation = autoSituation(stage, today);
              const resp = responsaveisEtapa(stage.id, project.jobs, project.profissionais);
              const dep = stage.dependencia
                ? project.obra.find((s) => s.id === stage.dependencia)
                : null;
              return (
                <tr key={stage.id}>
                  <td>
                    <b>{stage.nome}</b>
                    <div className="hint">
                      {resp.length
                        ? resp.map((p) => p.nome).join(', ')
                        : 'Sem profissional vinculado'}
                    </div>
                  </td>
                  <td>{dep ? dep.nome : '—'}</td>
                  <td>{fmt(stage.inicio)}</td>
                  <td>
                    {fmt(stage.fim)}
                    {stage.fimReal && <div className="hint">Concluído: {fmt(stage.fimReal)}</div>}
                  </td>
                  <StageStatusBadge situation={situation} />
                  <td>
                    <div className="progressline">
                      <div className="bar">
                        <i style={{ width: `${stage.progresso || 0}%` }} />
                      </div>
                      <span>{stage.progresso || 0}%</span>
                    </div>
                  </td>
                  <td className="rowactions">
                    <button onClick={() => onEdit(stage)}>Editar</button>
                    <button onClick={() => onChecklist(stage)}>Checklist</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

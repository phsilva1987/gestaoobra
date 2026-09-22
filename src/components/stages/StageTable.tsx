import type { Stage, Job, Professional, ProjectData } from '../../types';
import { autoSituation } from '../../lib/calculations';
import { isoToday, fmt } from '../../lib/format';
import { StageStatusBadge } from './StageStatusBadge';
import { StageCost } from './StageCost';

interface StageTableProps {
  project: ProjectData;
  onEdit: (stage: Stage) => void;
  onChecklist: (stage: Stage) => void;
  onDelete: (stage: Stage) => void;
}

function responsaveisEtapa(
  stageId: string,
  jobs: Job[],
  professionals: Professional[]
): Professional[] {
  const profIds = [...new Set(
    jobs
      .filter((j) => String(j.etapa_id) === String(stageId))
      .map((j) => String(j.profissional_id))
  )];
  return profIds
    .map((id) => professionals.find((p) => String(p.id) === id))
    .filter(Boolean) as Professional[];
}

export function StageTable({ project, onEdit, onChecklist, onDelete }: StageTableProps) {
  const today = isoToday();

  if (!project.obra.length) {
    return (
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Responsável</th>
              <th>Custo</th>
              <th>Prioridade</th>
              <th>Prazo</th>
              <th>Situação</th>
              <th>Progresso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={8} className="empty">Nenhuma etapa cadastrada.</td></tr>
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
              <th>Etapa</th>
              <th>Responsável</th>
              <th>Custo</th>
              <th>Prioridade</th>
              <th>Prazo</th>
              <th>Situação</th>
              <th>Progresso</th>
              <th></th>
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
                      {stage.categoria}
                      {dep ? ' · depende de ' + dep.nome : ''}
                    </div>
                  </td>
                  <td>
                    {resp.length ? (
                      resp.map((p) => (
                        <div key={p.id}>
                          <b>{p.nome}</b>
                          <div className="hint">{p.telefone || 'sem telefone'}</div>
                        </div>
                      ))
                    ) : (
                      <span className="hint">Sem profissional vinculado</span>
                    )}
                  </td>
                  <StageCost
                    stage={stage}
                    jobs={project.jobs}
                    materials={project.materiais}
                    equipments={project.equipamentos}
                  />
                  <td>{stage.prioridade}</td>
                  <td>
                    {fmt(stage.inicio)} → {fmt(stage.fim)}
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
                    <button onClick={() => onDelete(stage)}>Excluir</button>
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

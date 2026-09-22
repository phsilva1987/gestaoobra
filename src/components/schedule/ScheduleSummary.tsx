import type { ProjectData } from '../../types';
import { autoSituation, projectProgress } from '../../lib/calculations';
import { isoToday } from '../../lib/format';

interface ScheduleSummaryProps {
  project: ProjectData;
}

export function ScheduleSummary({ project }: ScheduleSummaryProps) {
  const today = isoToday();
  const stages = project.obra;
  const total = stages.length;
  const concluidas = stages.filter((s) => autoSituation(s, today).label === 'Concluído').length;
  const atrasadas = stages.filter((s) => autoSituation(s, today).label === 'Atrasado').length;
  const atencao = stages.filter((s) => autoSituation(s, today).label === 'Atenção').length;
  const progresso = projectProgress(project);

  return (
    <div className="grid kpis">
      <div className="card kpi">
        <small>Total de etapas</small>
        <strong>{total}</strong>
      </div>
      <div className="card kpi">
        <small>Concluídas</small>
        <strong>{concluidas}</strong>
      </div>
      <div className="card kpi">
        <small>Atrasadas</small>
        <strong className={atrasadas ? 'text-bad' : ''}>{atrasadas}</strong>
      </div>
      <div className="card kpi">
        <small>Em atenção</small>
        <strong className={atencao ? 'text-warn' : ''}>{atencao}</strong>
      </div>
      <div className="card kpi">
        <small>Progresso geral</small>
        <strong>{progresso}%</strong>
      </div>
    </div>
  );
}

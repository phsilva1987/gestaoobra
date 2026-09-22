import type { ProjectData } from '../../types';
import { dashboardMetrics, paymentDue, unforeseenTotal } from '../../lib/calculations';
import { money } from '../../lib/format';

interface ProjectHealthProps {
  project: ProjectData;
}

export function ProjectHealth({ project }: ProjectHealthProps) {
  const m = dashboardMetrics(project);

  return (
    <div className="card section dashboard-health-card">
      <h3>Saúde da reforma</h3>
      <div className="health">
        <div className="health-item">
          <small>ORÇAMENTO</small>
          <b>
            <span className={`dot ${m.over ? 'bad' : 'ok'}`} />
            {m.over ? 'Acima do planejado' : 'Dentro do planejado'}
          </b>
        </div>
        <div className="health-item">
          <small>PRAZO</small>
          <b>
            <span className={`dot ${m.late.length ? 'bad' : m.attention.length ? 'warn' : 'ok'}`} />
            {m.late.length
              ? `${m.late.length} atividade(s) atrasada(s)`
              : m.attention.length
                ? 'Atenção ao prazo'
                : 'Dentro do prazo'}
          </b>
        </div>
        <div className="health-item">
          <small>ENTREGA</small>
          <b>
            <span className={`dot ${m.finalPct === 100 ? 'ok' : 'warn'}`} />
            {m.finalPct}% do checklist final
          </b>
        </div>
      </div>
      <div className="mini-note" style={{ marginTop: 12 }}>
        Imprevistos registrados: <b>{money(unforeseenTotal(project.imprevistos))}</b>
        {' · '}
        A pagar em lançamentos: <b>{money(paymentDue(project.pagamentos))}</b>
      </div>
    </div>
  );
}

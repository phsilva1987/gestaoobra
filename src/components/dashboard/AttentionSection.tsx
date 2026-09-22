import type { ProjectData } from '../../types';
import { dashboardMetrics } from '../../lib/calculations';
import { money } from '../../lib/format';

interface AttentionSectionProps {
  project: ProjectData;
}

export function AttentionSection({ project }: AttentionSectionProps) {
  const m = dashboardMetrics(project);

  return (
    <div className="card section" style={{ marginTop: 14 }}>
      <div className="toolbar">
        <div>
          <h3 style={{ margin: 0 }}>Atenção necessária</h3>
          <span className="hint">O que precisa da sua atenção agora</span>
        </div>
      </div>
      <div className="alert-grid">
        <div className={`alert-card ${m.late.length ? 'alert-bad' : 'alert-ok'}`}>
          <small>Atividades atrasadas</small>
          <strong>{m.late.length}</strong>
          <span className="hint">{m.late.slice(0, 2).map((x) => x.nome).join(' · ') || 'Nenhuma'}</span>
        </div>
        <div className={`alert-card ${m.due7.length ? 'alert-warn' : 'alert-ok'}`}>
          <small>Pagamentos nos próximos 7 dias</small>
          <strong>{money(m.due7Total)}</strong>
          <span className="hint">{m.due7.length} lançamento(s)</span>
        </div>
        <div className={`alert-card ${m.attention.length ? 'alert-warn' : 'alert-ok'}`}>
          <small>Atividades em atenção</small>
          <strong>{m.attention.length}</strong>
          <span className="hint">Prazo em até 3 dias</span>
        </div>
        <div className={`alert-card ${m.openIssues.length ? 'alert-bad' : 'alert-ok'}`}>
          <small>Imprevistos abertos</small>
          <strong>{m.openIssues.length}</strong>
          <span className="hint">{money(m.openIssues.reduce((a, x) => a + (+x.valor || 0), 0))}</span>
        </div>
      </div>
    </div>
  );
}

import type { ProjectData } from '../../types';
import { fmt, daysRemaining } from '../../lib/format';
import { svgIcon } from '../../lib/navigation';

interface ProjectSummaryProps {
  project: ProjectData;
}

export function ProjectSummary({ project }: ProjectSummaryProps) {
  const c = project.config;
  const days = daysRemaining(c.fim);

  return (
    <div className="projectinfo">
      <div className="card project-card">
        <div>
          <div className="project-title">{c.empresa || project.nome}</div>
          <div className="project-sub">{c.projeto || 'Reforma'}</div>
          <div className="info-row">
            <span className="ii" dangerouslySetInnerHTML={{ __html: svgIcon('building') }} />
            <div><small>CNPJ / CPF</small><b>{c.documento || 'Não informado'}</b></div>
          </div>
          <div className="info-row">
            <span className="ii" dangerouslySetInnerHTML={{ __html: svgIcon('user') }} />
            <div><small>Responsável</small><b>{c.responsavel || 'Não informado'}</b></div>
          </div>
          <div className="info-row">
            <span className="ii" dangerouslySetInnerHTML={{ __html: svgIcon('phone') }} />
            <div><small>Telefone / WhatsApp</small><b>{c.telefone || 'Não informado'}</b></div>
          </div>
          <div className="info-row">
            <span className="ii" dangerouslySetInnerHTML={{ __html: svgIcon('mail') }} />
            <div><small>E-mail</small><b>{c.email || 'Não informado'}</b></div>
          </div>
        </div>
        <div className="project-details-secondary">
          <div className="info-row">
            <span className="ii" dangerouslySetInnerHTML={{ __html: svgIcon('map') }} />
            <div>
              <small>Endereço da obra</small>
              <b>{c.endereco || 'Não informado'}{c.cidade ? ' · ' + c.cidade : ''}</b>
            </div>
          </div>
          <div className="info-row">
            <span className="ii" dangerouslySetInnerHTML={{ __html: svgIcon('hardhat') }} />
            <div><small>Responsável pela obra</small><b>{c.respObra || 'Não informado'}</b></div>
          </div>
          <div className="info-row">
            <span className="ii" dangerouslySetInnerHTML={{ __html: svgIcon('calendar') }} />
            <div><small>Período da reforma</small><b>{fmt(c.inicio)} → {fmt(c.fim)}</b></div>
          </div>
          <div className="info-row">
            <span className="ii" dangerouslySetInnerHTML={{ __html: svgIcon('clock') }} />
            <div>
              <small>Situação do prazo</small>
              <b className="gold">
                {days === null
                  ? 'Defina a previsão de término'
                  : days >= 0
                    ? `${days} dias restantes`
                    : `${Math.abs(days)} dias após a previsão`}
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

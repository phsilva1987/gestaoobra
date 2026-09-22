import type { ProjectData } from '../types';
import { ProjectSummary } from '../components/dashboard/ProjectSummary';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { BudgetBar } from '../components/dashboard/BudgetBar';
import { ProgressCard } from '../components/dashboard/ProgressCard';
import { FinancialSummary } from '../components/dashboard/FinancialSummary';
import { AttentionSection } from '../components/dashboard/AttentionSection';
import { NextSevenDays } from '../components/dashboard/NextSevenDays';
import { ProjectHealth } from '../components/dashboard/ProjectHealth';
import { fmt, daysRemaining } from '../lib/format';
import { svgIcon } from '../lib/navigation';
import { ReportMenu } from '../components/dashboard/ReportMenu';

interface DashboardProps {
  project: ProjectData;
}

export function Dashboard({ project }: DashboardProps) {
  const c = project.config;
  const days = daysRemaining(c.fim);

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Dashboard</h1>
          <p>Visão executiva financeira e física da reforma</p>
        </div>
        <div className="dash-actions">
          <ReportMenu project={project} />
          <div className="period-box">
            <span dangerouslySetInnerHTML={{ __html: svgIcon('calendar') }} />
            <div>
              {fmt(c.inicio)} → {fmt(c.fim)}
              <strong>
                {days === null
                  ? 'Prazo não definido'
                  : days >= 0
                    ? `${days} dias restantes`
                    : `${Math.abs(days)} dias em atraso`}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <ProjectSummary project={project} />
      <KpiGrid project={project} />
      <BudgetBar project={project} />

      <div className="grid two dashboard-progress-finance">
        <ProgressCard project={project} />
        <FinancialSummary project={project} />
      </div>

      <AttentionSection project={project} />

      <div className="dashboard-health-row">
        <NextSevenDays project={project} />
        <ProjectHealth project={project} />
      </div>
    </>
  );
}

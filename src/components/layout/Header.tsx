import type { ProjectOption } from '../../types/navigation';
import { ProjectSelector } from './ProjectSelector';

interface HeaderProps {
  projects: ProjectOption[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
}

export function Header({ projects, selectedProjectId, onSelectProject }: HeaderProps) {
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="appbar">
      <div className="appbar-left">
        <div className="appbar-title">Gestão da Reforma</div>
        <div className="appbar-sub">Planejamento &nbsp;•&nbsp; Controle &nbsp;•&nbsp; Resultado</div>
      </div>
      <div className="appbar-right">
        <ProjectSelector
          projects={projects}
          selectedId={selectedProjectId}
          onSelect={onSelectProject}
        />
        <div className="appbar-date">{today}</div>
        <div className="userbox">
          <div className="avatar">PH</div>
          <div className="usertext">
            <b>Paulo Henrique</b>
            <span>Administrador</span>
          </div>
        </div>
      </div>
    </div>
  );
}

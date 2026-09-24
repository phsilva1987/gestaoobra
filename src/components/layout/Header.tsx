import type { ProjectOption } from '../../types/navigation';
import { ProjectSelector } from './ProjectSelector';
import { DateTimeDisplay } from './DateTimeDisplay';
import { useAuth } from '../../auth/AuthProvider';

interface HeaderProps {
  projects: ProjectOption[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
}

export function Header({ projects, selectedProjectId, onSelectProject }: HeaderProps) {
  const { profile, signOut } = useAuth();

  const initials = (profile?.name || profile?.email || '?')
    .split(' ')
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const displayName = profile?.name || profile?.email || 'Usuário';
  const roleLabel = profile?.role === 'admin' ? 'Administrador' : 'Operador';

  return (
    <div className="appbar">
      <div className="appbar-left">
        <div className="appbar-title">Gestão da Obra</div>
        <div className="appbar-sub">Planejamento &nbsp;•&nbsp; Controle &nbsp;•&nbsp; Resultado</div>
      </div>
      <div className="appbar-right">
        <ProjectSelector
          projects={projects}
          selectedId={selectedProjectId}
          onSelect={onSelectProject}
        />
        <DateTimeDisplay />
        <div className="userbox">
          <div className="avatar">{initials}</div>
          <div className="usertext">
            <b>{displayName}</b>
            <span>{roleLabel}</span>
          </div>
          <button className="btn-logout" onClick={() => signOut()} title="Sair">
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

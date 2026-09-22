import { navGroups } from '../../lib/navigation';
import type { PageKey } from '../../types/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { ProjectOption } from '../../types/navigation';

interface AppShellProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  projects: ProjectOption[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  coverImage?: string;
  projectName?: string;
  isAdmin?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  current,
  onNavigate,
  projects,
  selectedProjectId,
  onSelectProject,
  coverImage,
  projectName,
  isAdmin = false,
  children,
}: AppShellProps) {
  const mobileOptions = navGroups.flatMap((g) => g.items).filter((item) => item.key !== 'usuarios' || isAdmin);

  return (
    <div className="app">
      <Sidebar current={current} onNavigate={onNavigate} coverImage={coverImage} projectName={projectName} isAdmin={isAdmin} />
      <main>
        <Header
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
        />
        <div className="mobile">
          <select
            className="mobile-nav-select"
            value={current}
            onChange={(e) => onNavigate(e.target.value as PageKey)}
          >
            {mobileOptions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {children}
      </main>
    </div>
  );
}

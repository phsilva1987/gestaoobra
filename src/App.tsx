import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Stages } from './pages/Stages';
import { Professionals } from './pages/Professionals';
import { Materials } from './pages/Materials';
import { Equipment } from './pages/Equipment';
import { Schedule } from './pages/Schedule';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { mockProjects } from './lib/mockProjects';
import type { PageKey } from './types/navigation';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(mockProjects[0].id);

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard />,
    projetos: <Projects />,
    obra: <Stages />,
    profissionais: <Professionals />,
    materiais: <Materials />,
    equipamentos: <Equipment />,
    cronograma: <Schedule />,
    financeiro: <Finance />,
    config: <Settings />,
  };

  return (
    <AppShell
      current={currentPage}
      onNavigate={setCurrentPage}
      projects={mockProjects}
      selectedProjectId={selectedProjectId}
      onSelectProject={setSelectedProjectId}
    >
      {pages[currentPage]}
    </AppShell>
  );
}

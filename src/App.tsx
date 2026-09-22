import { useState, useCallback } from 'react';
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
import { mockProjects, getProjectOptions } from './lib/mockProjects';
import type { ProjectData, Stage, Professional, Job } from './types';
import type { PageKey } from './types/navigation';
import type { StageFormData } from './components/stages/StageForm';
import type { ProfessionalFormData } from './components/professionals/ProfessionalForm';
import type { JobFormData } from './components/professionals/JobForm';
import { isoToday } from './lib/format';

function genId(prefix: string): string {
  return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

export function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(mockProjects[0].id);
  const [projects, setProjects] = useState<ProjectData[]>(() =>
    mockProjects.map((p) => ({ ...p, obra: [...p.obra] }))
  );

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectOptions = getProjectOptions();

  const addStage = useCallback((projectId: string, data: StageFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newStage: Stage = {
          id: genId('s'),
          nome: data.nome,
          categoria: data.categoria,
          prioridade: data.prioridade,
          dependencia: data.dependencia,
          status: data.status,
          progresso: data.progresso,
          previsto: 0,
          inicio: data.inicio,
          fim: data.fim,
          profissionalId: null,
          observacao: data.observacao,
          fimReal: '',
          checkServico: false,
          checkConferido: false,
          checkLimpo: false,
          checkPagamento: false,
          checkPendencias: false,
        };
        return { ...p, obra: [...p.obra, newStage] };
      })
    );
  }, []);

  const updateStage = useCallback((projectId: string, stageId: string, data: StageFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          obra: p.obra.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  nome: data.nome,
                  categoria: data.categoria,
                  prioridade: data.prioridade,
                  dependencia: data.dependencia,
                  status: data.status,
                  progresso: data.progresso,
                  inicio: data.inicio,
                  fim: data.fim,
                  observacao: data.observacao,
                }
              : s
          ),
        };
      })
    );
  }, []);

  const deleteStage = useCallback((projectId: string, stageId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, obra: p.obra.filter((s) => s.id !== stageId) };
      })
    );
  }, []);

  const toggleCheck = useCallback((projectId: string, stageId: string, key: keyof Stage, checked: boolean) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          obra: p.obra.map((s) => (s.id === stageId ? { ...s, [key]: checked } : s)),
        };
      })
    );
  }, []);

  const finishStage = useCallback((projectId: string, stageId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          obra: p.obra.map((s) =>
            s.id === stageId
              ? { ...s, status: 'Concluído', progresso: 100, fimReal: isoToday() }
              : s
          ),
        };
      })
    );
  }, []);

  const addProfessional = useCallback((projectId: string, data: ProfessionalFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newProf: Professional = {
          id: genId('p'),
          nome: data.nome,
          servico: data.servico,
          telefone: data.telefone,
          email: data.email,
          status: data.status,
        };
        return { ...p, profissionais: [...p.profissionais, newProf] };
      })
    );
  }, []);

  const updateProfessional = useCallback((projectId: string, profId: string, data: ProfessionalFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          profissionais: p.profissionais.map((pr) =>
            pr.id === profId
              ? { ...pr, nome: data.nome, servico: data.servico, telefone: data.telefone, email: data.email, status: data.status }
              : pr
          ),
        };
      })
    );
  }, []);

  const deleteProfessional = useCallback((projectId: string, profId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, profissionais: p.profissionais.filter((pr) => pr.id !== profId) };
      })
    );
  }, []);

  const addJob = useCallback((projectId: string, data: JobFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const n = parseInt(data.parcelas) || 1;
        const newJob: Job = {
          id: genId('j'),
          etapa_id: data.etapa_id,
          profissional_id: data.profissional_id,
          valor: data.valor,
          pago: data.pago,
          forma: data.forma,
          parcelas: data.forma === 'Cartão' ? data.parcelas : '1x',
          chavePix: data.forma === 'Pix' ? data.chavePix : '',
          valorParcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null,
          status: data.status,
        };
        return { ...p, jobs: [...p.jobs, newJob] };
      })
    );
  }, []);

  const updateJob = useCallback((projectId: string, jobId: string, data: JobFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const n = parseInt(data.parcelas) || 1;
        return {
          ...p,
          jobs: p.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  etapa_id: data.etapa_id,
                  profissional_id: data.profissional_id,
                  valor: data.valor,
                  pago: data.pago,
                  forma: data.forma,
                  parcelas: data.forma === 'Cartão' ? data.parcelas : '1x',
                  chavePix: data.forma === 'Pix' ? data.chavePix : '',
                  valorParcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null,
                  status: data.status,
                }
              : j
          ),
        };
      })
    );
  }, []);

  const deleteJob = useCallback((projectId: string, jobId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, jobs: p.jobs.filter((j) => j.id !== jobId) };
      })
    );
  }, []);

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard project={selectedProject} />,
    projetos: <Projects />,
    obra: (
      <Stages
        project={selectedProject}
        onAddStage={(data) => addStage(selectedProject.id, data)}
        onUpdateStage={(id, data) => updateStage(selectedProject.id, id, data)}
        onDeleteStage={(id) => deleteStage(selectedProject.id, id)}
        onToggleCheck={(id, key, checked) => toggleCheck(selectedProject.id, id, key, checked)}
        onFinishStage={(id) => finishStage(selectedProject.id, id)}
      />
    ),
    profissionais: (
      <Professionals
        project={selectedProject}
        onAddProfessional={(data) => addProfessional(selectedProject.id, data)}
        onUpdateProfessional={(id, data) => updateProfessional(selectedProject.id, id, data)}
        onDeleteProfessional={(id) => deleteProfessional(selectedProject.id, id)}
        onAddJob={(data) => addJob(selectedProject.id, data)}
        onUpdateJob={(id, data) => updateJob(selectedProject.id, id, data)}
        onDeleteJob={(id) => deleteJob(selectedProject.id, id)}
      />
    ),
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
      projects={projectOptions}
      selectedProjectId={selectedProjectId}
      onSelectProject={setSelectedProjectId}
    >
      {pages[currentPage]}
    </AppShell>
  );
}

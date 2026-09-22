import { useState, useCallback } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Stages } from './pages/Stages';
import { Professionals } from './pages/Professionals';
import { Materials } from './pages/Materials';
import { Equipment as EquipmentPage } from './pages/Equipment';
import { Schedule } from './pages/Schedule';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { mockProjects, getProjectOptions } from './lib/mockProjects';
import type { ProjectData, Stage, Professional, Job, Material, Equipment, Supplier, Unforeseen, Payment, AdminItem } from './types';
import type { PageKey } from './types/navigation';
import type { StageFormData } from './components/stages/StageForm';
import type { ProfessionalFormData } from './components/professionals/ProfessionalForm';
import type { JobFormData } from './components/professionals/JobForm';
import type { MaterialFormData } from './components/materials/MaterialForm';
import type { EquipmentFormData } from './components/equipment/EquipmentForm';
import type { SupplierFormData } from './components/suppliers/SupplierForm';
import type { UnforeseenFormData } from './components/finance/UnforeseenForm';
import type { PaymentFormData } from './components/finance/PaymentForm';
import type { AdminFormData } from './components/finance/AdminForm';
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

  const addSupplier = useCallback((projectId: string, data: SupplierFormData): Supplier => {
    const newSupplier: Supplier = {
      id: genId('f'),
      nome: data.nome,
      telefone: data.telefone,
      email: data.email,
      site: data.site,
    };
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, fornecedores: [...p.fornecedores, newSupplier] };
      })
    );
    return newSupplier;
  }, []);

  const addMaterial = useCallback((projectId: string, data: MaterialFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newMaterial: Material = {
          id: genId('m'),
          etapa_id: data.etapa_id,
          nome: data.nome,
          categoria: data.categoria,
          fornecedorId: data.fornecedorId,
          quantidade: data.quantidade,
          unidade: data.unidade,
          unitario: data.unitario,
          pago: data.pago,
          data: data.data,
          status: data.status,
        };
        return { ...p, materiais: [...p.materiais, newMaterial] };
      })
    );
  }, []);

  const updateMaterial = useCallback((projectId: string, materialId: string, data: MaterialFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          materiais: p.materiais.map((m) =>
            m.id === materialId
              ? {
                  ...m,
                  nome: data.nome,
                  categoria: data.categoria,
                  fornecedorId: data.fornecedorId,
                  quantidade: data.quantidade,
                  unidade: data.unidade,
                  unitario: data.unitario,
                  pago: data.pago,
                  data: data.data,
                  status: data.status,
                  etapa_id: data.etapa_id,
                }
              : m
          ),
        };
      })
    );
  }, []);

  const deleteMaterial = useCallback((projectId: string, materialId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, materiais: p.materiais.filter((m) => m.id !== materialId) };
      })
    );
  }, []);

  const addEquipment = useCallback((projectId: string, data: EquipmentFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const n = parseInt(data.parcelas) || 1;
        const newEq: Equipment = {
          id: genId('e'),
          etapa_id: data.etapa_id,
          nome: data.nome,
          quantidade: data.quantidade,
          valor: data.valor,
          fornecedorId: data.fornecedorId,
          forma: data.forma,
          chavePix: data.forma === 'Pix' ? data.chavePix : '',
          parcelas: data.forma === 'Cartão' ? data.parcelas : '1x',
          valorParcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null,
          compra: data.compra,
          entrega: data.entrega,
          status: data.status,
        };
        return { ...p, equipamentos: [...p.equipamentos, newEq] };
      })
    );
  }, []);

  const updateEquipment = useCallback((projectId: string, eqId: string, data: EquipmentFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const n = parseInt(data.parcelas) || 1;
        return {
          ...p,
          equipamentos: p.equipamentos.map((e) =>
            e.id === eqId
              ? {
                  ...e,
                  nome: data.nome,
                  quantidade: data.quantidade,
                  valor: data.valor,
                  fornecedorId: data.fornecedorId,
                  forma: data.forma,
                  chavePix: data.forma === 'Pix' ? data.chavePix : '',
                  parcelas: data.forma === 'Cartão' ? data.parcelas : '1x',
                  valorParcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null,
                  compra: data.compra,
                  entrega: data.entrega,
                  status: data.status,
                  etapa_id: data.etapa_id,
                }
              : e
          ),
        };
      })
    );
  }, []);

  const deleteEquipment = useCallback((projectId: string, eqId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, equipamentos: p.equipamentos.filter((e) => e.id !== eqId) };
      })
    );
  }, []);

  const addUnforeseen = useCallback((projectId: string, data: UnforeseenFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const item: Unforeseen = { id: genId('i'), ...data };
        return { ...p, imprevistos: [...p.imprevistos, item] };
      })
    );
  }, []);

  const updateUnforeseen = useCallback((projectId: string, id: string, data: UnforeseenFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, imprevistos: p.imprevistos.map((u) => u.id === id ? { ...u, ...data } : u) };
      })
    );
  }, []);

  const deleteUnforeseen = useCallback((projectId: string, id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, imprevistos: p.imprevistos.filter((u) => u.id !== id) };
      })
    );
  }, []);

  const addPayment = useCallback((projectId: string, data: PaymentFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const item: Payment = { id: genId('pa'), ...data };
        return { ...p, pagamentos: [...p.pagamentos, item] };
      })
    );
  }, []);

  const updatePayment = useCallback((projectId: string, id: string, data: PaymentFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, pagamentos: p.pagamentos.map((pa) => pa.id === id ? { ...pa, ...data } : pa) };
      })
    );
  }, []);

  const deletePayment = useCallback((projectId: string, id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, pagamentos: p.pagamentos.filter((pa) => pa.id !== id) };
      })
    );
  }, []);

  const addAdmin = useCallback((projectId: string, data: AdminFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const item: AdminItem = { id: genId('a'), ...data };
        return { ...p, admin: [...p.admin, item] };
      })
    );
  }, []);

  const updateAdmin = useCallback((projectId: string, id: string, data: AdminFormData) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, admin: p.admin.map((a) => a.id === id ? { ...a, ...data } : a) };
      })
    );
  }, []);

  const deleteAdmin = useCallback((projectId: string, id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, admin: p.admin.filter((a) => a.id !== id) };
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
    materiais: (
      <Materials
        project={selectedProject}
        onAddMaterial={(data) => addMaterial(selectedProject.id, data)}
        onUpdateMaterial={(id, data) => updateMaterial(selectedProject.id, id, data)}
        onDeleteMaterial={(id) => deleteMaterial(selectedProject.id, id)}
        onAddSupplier={(data) => addSupplier(selectedProject.id, data)}
      />
    ),
    equipamentos: (
      <EquipmentPage
        project={selectedProject}
        onAddEquipment={(data) => addEquipment(selectedProject.id, data)}
        onUpdateEquipment={(id, data) => updateEquipment(selectedProject.id, id, data)}
        onDeleteEquipment={(id) => deleteEquipment(selectedProject.id, id)}
        onAddSupplier={(data) => addSupplier(selectedProject.id, data)}
      />
    ),
    cronograma: (
      <Schedule
        project={selectedProject}
        onUpdateStage={(id, data) => updateStage(selectedProject.id, id, data)}
        onToggleCheck={(id, key, checked) => toggleCheck(selectedProject.id, id, key, checked)}
        onFinishStage={(id) => finishStage(selectedProject.id, id)}
      />
    ),
    financeiro: (
      <Finance
        project={selectedProject}
        onAddUnforeseen={(data) => addUnforeseen(selectedProject.id, data)}
        onUpdateUnforeseen={(id, data) => updateUnforeseen(selectedProject.id, id, data)}
        onDeleteUnforeseen={(id) => deleteUnforeseen(selectedProject.id, id)}
        onAddPayment={(data) => addPayment(selectedProject.id, data)}
        onUpdatePayment={(id, data) => updatePayment(selectedProject.id, id, data)}
        onDeletePayment={(id) => deletePayment(selectedProject.id, id)}
        onAddAdmin={(data) => addAdmin(selectedProject.id, data)}
        onUpdateAdmin={(id, data) => updateAdmin(selectedProject.id, id, data)}
        onDeleteAdmin={(id) => deleteAdmin(selectedProject.id, id)}
      />
    ),
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

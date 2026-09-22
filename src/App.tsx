import { useState, useCallback, useRef } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer, type ToastMsg } from './components/Toast';
import { ProtectedApp } from './auth/ProtectedApp';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Stages } from './pages/Stages';
import { Professionals } from './pages/Professionals';
import { Materials } from './pages/Materials';
import { Equipment as EquipmentPage } from './pages/Equipment';
import { Schedule } from './pages/Schedule';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { useProjects } from './hooks/useProjects';
import type { ProjectFormData } from './components/projects/ProjectForm';
import { type RestoreSummary } from './lib/backup';
import type { ProjectData, Stage, Professional, Job, Material, Equipment, Supplier, Unforeseen, Payment, AdminItem } from './types';
import type { PageKey } from './types/navigation';
import type { StageFormData } from './components/stages/StageForm';
import type { ProfessionalFormData } from './components/professionals/ProfessionalForm';
import type { JobFormData } from './components/professionals/JobForm';
import type { MaterialFormData } from './components/materials/MaterialForm';
import type { EquipmentFormData } from './components/equipment/EquipmentForm';
import type { SupplierFormData } from './components/suppliers/SupplierForm';
import type { ProjectSettingsFormData } from './components/settings/ProjectSettingsForm';
import type { UnforeseenFormData } from './components/finance/UnforeseenForm';
import type { PaymentFormData } from './components/finance/PaymentForm';
import type { AdminFormData } from './components/finance/AdminForm';
import { isoToday } from './lib/format';

function genId(prefix: string): string {
  return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

export function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    loading,
    error: projectsError,
    profile,
    addProject,
    updateProject,
    updateProjectFull,
    removeProject,
    changeProjectImage,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCategory,
    removeCategory,
  } = useProjects();

  const projectOptions = projects.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo }));

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastIdRef = useRef(0);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Local overlay for mock collections that aren't migrated yet.
  // Keyed by projectId. Each entry contains mock collection overrides.
  const [mockOverrides, setMockOverrides] = useState<
    Record<string, Partial<Pick<ProjectData, 'obra' | 'profissionais' | 'jobs' | 'materiais' | 'equipamentos' | 'imprevistos' | 'pagamentos' | 'admin' | 'checklist'>>>
  >({});

  // Merge DB project with mock overrides
  const mergedProjects = projects.map((p) => {
    const override = mockOverrides[p.id];
    if (!override) return p;
    return { ...p, ...override };
  });

  const mergedSelectedProject =
    mergedProjects.find((p) => p.id === selectedProjectId) || mergedProjects[0] || null;

  // ---- Project CRUD (delegates to useProjects hook with DB) ----
  const handleAddProject = useCallback(
    async (data: ProjectFormData): Promise<string> => {
      try {
        const newId = await addProject(data);
        showToast('Projeto criado com sucesso!', 'success');
        return newId;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao criar projeto';
        showToast(msg, 'error');
        throw err;
      }
    },
    [addProject, showToast]
  );

  const handleUpdateProjectFull = useCallback(
    async (projectId: string, data: ProjectFormData) => {
      try {
        await updateProjectFull(projectId, data);
        showToast('Projeto atualizado!', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar projeto';
        showToast(msg, 'error');
      }
    },
    [updateProjectFull, showToast]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      try {
        await removeProject(projectId);
        showToast('Projeto excluído.', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao excluir projeto';
        showToast(msg, 'error');
      }
    },
    [removeProject, showToast]
  );

  const handleRestore = useCallback((_summary: RestoreSummary) => {
    showToast('Restauração de backup será reativada após migração completa.', 'info');
  }, []);

  // ---- Mock collection operations (local state only, not persisted) ----
  const addStage = useCallback((projectId: string, data: StageFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
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
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          obra: [...p.obra, newStage],
        },
      };
    });
  }, [mergedProjects]);

  const updateStage = useCallback((projectId: string, stageId: string, data: StageFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
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
        },
      };
    });
  }, [mergedProjects]);

  const deleteStage = useCallback((projectId: string, stageId: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          obra: p.obra.filter((s) => s.id !== stageId),
        },
      };
    });
  }, [mergedProjects]);

  const toggleCheck = useCallback((projectId: string, stageId: string, key: keyof Stage, checked: boolean) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          obra: p.obra.map((s) => (s.id === stageId ? { ...s, [key]: checked } : s)),
        },
      };
    });
  }, [mergedProjects]);

  const finishStage = useCallback((projectId: string, stageId: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          obra: p.obra.map((s) =>
            s.id === stageId
              ? { ...s, status: 'Concluído', progresso: 100, fimReal: isoToday() }
              : s
          ),
        },
      };
    });
  }, [mergedProjects]);

  const addProfessional = useCallback((projectId: string, data: ProfessionalFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      const newProf: Professional = {
        id: genId('p'),
        nome: data.nome,
        servico: data.servico,
        telefone: data.telefone,
        email: data.email,
        status: data.status,
      };
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          profissionais: [...p.profissionais, newProf],
        },
      };
    });
  }, [mergedProjects]);

  const updateProfessional = useCallback((projectId: string, profId: string, data: ProfessionalFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          profissionais: p.profissionais.map((pr) =>
            pr.id === profId
              ? { ...pr, nome: data.nome, servico: data.servico, telefone: data.telefone, email: data.email, status: data.status }
              : pr
          ),
        },
      };
    });
  }, [mergedProjects]);

  const deleteProfessional = useCallback((projectId: string, profId: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          profissionais: p.profissionais.filter((pr) => pr.id !== profId),
        },
      };
    });
  }, [mergedProjects]);

  const addJob = useCallback((projectId: string, data: JobFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
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
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          jobs: [...p.jobs, newJob],
        },
      };
    });
  }, [mergedProjects]);

  const updateJob = useCallback((projectId: string, jobId: string, data: JobFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      const n = parseInt(data.parcelas) || 1;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
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
        },
      };
    });
  }, [mergedProjects]);

  const deleteJob = useCallback((projectId: string, jobId: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          jobs: p.jobs.filter((j) => j.id !== jobId),
        },
      };
    });
  }, [mergedProjects]);

  const handleAddSupplier = useCallback(
    async (projectId: string, data: SupplierFormData): Promise<Supplier> => {
      try {
        return await addSupplier(projectId, data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar fornecedor';
        showToast(msg, 'error');
        throw err;
      }
    },
    [addSupplier, showToast]
  );

  const addMaterial = useCallback((projectId: string, data: MaterialFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
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
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          materiais: [...p.materiais, newMaterial],
        },
      };
    });
  }, [mergedProjects]);

  const updateMaterial = useCallback((projectId: string, materialId: string, data: MaterialFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
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
        },
      };
    });
  }, [mergedProjects]);

  const deleteMaterial = useCallback((projectId: string, materialId: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          materiais: p.materiais.filter((m) => m.id !== materialId),
        },
      };
    });
  }, [mergedProjects]);

  const addEquipment = useCallback((projectId: string, data: EquipmentFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
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
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          equipamentos: [...p.equipamentos, newEq],
        },
      };
    });
  }, [mergedProjects]);

  const updateEquipment = useCallback((projectId: string, eqId: string, data: EquipmentFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      const n = parseInt(data.parcelas) || 1;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
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
        },
      };
    });
  }, [mergedProjects]);

  const deleteEquipment = useCallback((projectId: string, eqId: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          equipamentos: p.equipamentos.filter((e) => e.id !== eqId),
        },
      };
    });
  }, [mergedProjects]);

  const addUnforeseen = useCallback((projectId: string, data: UnforeseenFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      const item: Unforeseen = { id: genId('i'), ...data };
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          imprevistos: [...p.imprevistos, item],
        },
      };
    });
  }, [mergedProjects]);

  const updateUnforeseen = useCallback((projectId: string, id: string, data: UnforeseenFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          imprevistos: p.imprevistos.map((u) => (u.id === id ? { ...u, ...data } : u)),
        },
      };
    });
  }, [mergedProjects]);

  const deleteUnforeseen = useCallback((projectId: string, id: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          imprevistos: p.imprevistos.filter((u) => u.id !== id),
        },
      };
    });
  }, [mergedProjects]);

  const addPayment = useCallback((projectId: string, data: PaymentFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      const item: Payment = { id: genId('pa'), ...data };
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          pagamentos: [...p.pagamentos, item],
        },
      };
    });
  }, [mergedProjects]);

  const updatePayment = useCallback((projectId: string, id: string, data: PaymentFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          pagamentos: p.pagamentos.map((pa) => (pa.id === id ? { ...pa, ...data } : pa)),
        },
      };
    });
  }, [mergedProjects]);

  const deletePayment = useCallback((projectId: string, id: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          pagamentos: p.pagamentos.filter((pa) => pa.id !== id),
        },
      };
    });
  }, [mergedProjects]);

  const addAdmin = useCallback((projectId: string, data: AdminFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      const item: AdminItem = { id: genId('a'), ...data };
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          admin: [...p.admin, item],
        },
      };
    });
  }, [mergedProjects]);

  const updateAdmin = useCallback((projectId: string, id: string, data: AdminFormData) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          admin: p.admin.map((a) => (a.id === id ? { ...a, ...data } : a)),
        },
      };
    });
  }, [mergedProjects]);

  const deleteAdmin = useCallback((projectId: string, id: string) => {
    setMockOverrides((prev) => {
      const p = mergedProjects.find((mp) => mp.id === projectId);
      if (!p) return prev;
      return {
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          admin: p.admin.filter((a) => a.id !== id),
        },
      };
    });
  }, [mergedProjects]);

  const handleUpdateProject = useCallback(
    async (projectId: string, data: ProjectSettingsFormData) => {
      try {
        await updateProject(projectId, data);
        showToast('Configurações salvas!', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar configurações';
        showToast(msg, 'error');
      }
    },
    [updateProject, showToast]
  );

  const handleImageChange = useCallback(
    async (projectId: string, base64: string) => {
      await changeProjectImage(projectId, base64);
    },
    [changeProjectImage]
  );

  const handleAddCategory = useCallback(
    async (projectId: string, kind: 'obra' | 'material', name: string) => {
      try {
        await addCategory(projectId, kind, name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao adicionar categoria';
        showToast(msg, 'error');
      }
    },
    [addCategory, showToast]
  );

  const handleRemoveCategory = useCallback(
    async (projectId: string, kind: 'obra' | 'material', name: string) => {
      try {
        await removeCategory(projectId, kind, name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao remover categoria';
        showToast(msg, 'error');
      }
    },
    [removeCategory, showToast]
  );

  const handleUpdateSupplier = useCallback(
    async (projectId: string, id: string, data: SupplierFormData) => {
      try {
        await updateSupplier(projectId, id, data);
        showToast('Fornecedor atualizado!', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao atualizar fornecedor';
        showToast(msg, 'error');
      }
    },
    [updateSupplier, showToast]
  );

  const handleDeleteSupplier = useCallback(
    async (projectId: string, id: string) => {
      try {
        await deleteSupplier(projectId, id);
        showToast('Fornecedor excluído.', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao excluir fornecedor';
        showToast(msg, 'error');
      }
    },
    [deleteSupplier, showToast]
  );

  // ---- Loading / empty state ----
  if (loading) {
    return (
      <ProtectedApp>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>Carregando projetos...</p>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </ProtectedApp>
    );
  }

  if (projectsError) {
    return (
      <ProtectedApp>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
          <p style={{ color: 'var(--error, #d94a3a)', fontSize: 16, fontWeight: 600 }}>
            Erro ao carregar projetos: {projectsError}
          </p>
          <button className="btn" onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </ProtectedApp>
    );
  }

  if (mergedProjects.length === 0 || !mergedSelectedProject) {
    return (
      <ProtectedApp>
        <AppShell
          current={currentPage}
          onNavigate={setCurrentPage}
          projects={[]}
          selectedProjectId=""
          onSelectProject={() => {}}
          coverImage=""
          projectName=""
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, textAlign: 'center' }}>
            <div>
              <h2 style={{ marginBottom: 8 }}>Nenhum projeto disponível</h2>
              <p style={{ color: 'var(--muted)', maxWidth: 400 }}>
                {profile?.role === 'admin'
                  ? 'Crie seu primeiro projeto para começar a gerenciar sua reforma.'
                  : 'Entre em contato com um administrador para receber acesso a um projeto.'}
              </p>
            </div>
            {profile?.role === 'admin' && (
              <Projects
                projects={[]}
                selectedProjectId=""
                onSelectProject={() => {}}
                onNavigate={setCurrentPage}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProjectFull}
                onDeleteProject={handleDeleteProject}
                canCreate={true}
              />
            )}
          </div>
        </AppShell>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </ProtectedApp>
    );
  }

  const isAdmin = profile?.role === 'admin';

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard project={mergedSelectedProject} />,
    projetos: (
      <Projects
        projects={mergedProjects}
        selectedProjectId={selectedProjectId || ''}
        onSelectProject={setSelectedProjectId}
        onNavigate={setCurrentPage}
        onAddProject={handleAddProject}
        onUpdateProject={handleUpdateProjectFull}
        onDeleteProject={handleDeleteProject}
        canCreate={isAdmin}
      />
    ),
    obra: (
      <Stages
        project={mergedSelectedProject}
        onAddStage={(data) => addStage(mergedSelectedProject.id, data)}
        onUpdateStage={(id, data) => updateStage(mergedSelectedProject.id, id, data)}
        onDeleteStage={(id) => deleteStage(mergedSelectedProject.id, id)}
        onToggleCheck={(id, key, checked) => toggleCheck(mergedSelectedProject.id, id, key, checked)}
        onFinishStage={(id) => finishStage(mergedSelectedProject.id, id)}
      />
    ),
    profissionais: (
      <Professionals
        project={mergedSelectedProject}
        onAddProfessional={(data) => addProfessional(mergedSelectedProject.id, data)}
        onUpdateProfessional={(id, data) => updateProfessional(mergedSelectedProject.id, id, data)}
        onDeleteProfessional={(id) => deleteProfessional(mergedSelectedProject.id, id)}
        onAddJob={(data) => addJob(mergedSelectedProject.id, data)}
        onUpdateJob={(id, data) => updateJob(mergedSelectedProject.id, id, data)}
        onDeleteJob={(id) => deleteJob(mergedSelectedProject.id, id)}
      />
    ),
    materiais: (
      <Materials
        project={mergedSelectedProject}
        onAddMaterial={(data) => addMaterial(mergedSelectedProject.id, data)}
        onUpdateMaterial={(id, data) => updateMaterial(mergedSelectedProject.id, id, data)}
        onDeleteMaterial={(id) => deleteMaterial(mergedSelectedProject.id, id)}
        onAddSupplier={(data) => handleAddSupplier(mergedSelectedProject.id, data)}
      />
    ),
    equipamentos: (
      <EquipmentPage
        project={mergedSelectedProject}
        onAddEquipment={(data) => addEquipment(mergedSelectedProject.id, data)}
        onUpdateEquipment={(id, data) => updateEquipment(mergedSelectedProject.id, id, data)}
        onDeleteEquipment={(id) => deleteEquipment(mergedSelectedProject.id, id)}
        onAddSupplier={(data) => handleAddSupplier(mergedSelectedProject.id, data)}
      />
    ),
    cronograma: (
      <Schedule
        project={mergedSelectedProject}
        onUpdateStage={(id, data) => updateStage(mergedSelectedProject.id, id, data)}
        onToggleCheck={(id, key, checked) => toggleCheck(mergedSelectedProject.id, id, key, checked)}
        onFinishStage={(id) => finishStage(mergedSelectedProject.id, id)}
      />
    ),
    financeiro: (
      <Finance
        project={mergedSelectedProject}
        onAddUnforeseen={(data) => addUnforeseen(mergedSelectedProject.id, data)}
        onUpdateUnforeseen={(id, data) => updateUnforeseen(mergedSelectedProject.id, id, data)}
        onDeleteUnforeseen={(id) => deleteUnforeseen(mergedSelectedProject.id, id)}
        onAddPayment={(data) => addPayment(mergedSelectedProject.id, data)}
        onUpdatePayment={(id, data) => updatePayment(mergedSelectedProject.id, id, data)}
        onDeletePayment={(id) => deletePayment(mergedSelectedProject.id, id)}
        onAddAdmin={(data) => addAdmin(mergedSelectedProject.id, data)}
        onUpdateAdmin={(id, data) => updateAdmin(mergedSelectedProject.id, id, data)}
        onDeleteAdmin={(id) => deleteAdmin(mergedSelectedProject.id, id)}
      />
    ),
    config: (
      <Settings
        project={mergedSelectedProject}
        onUpdateProject={(data) => handleUpdateProject(mergedSelectedProject.id, data)}
        onImageChange={(base64) => handleImageChange(mergedSelectedProject.id, base64)}
        onAddCategory={(kind, name) => handleAddCategory(mergedSelectedProject.id, kind, name)}
        onRemoveCategory={(kind, name) => handleRemoveCategory(mergedSelectedProject.id, kind, name)}
        onAddSupplier={(data) => handleAddSupplier(mergedSelectedProject.id, data)}
        onUpdateSupplier={(id, data) => handleUpdateSupplier(mergedSelectedProject.id, id, data)}
        onDeleteSupplier={(id) => handleDeleteSupplier(mergedSelectedProject.id, id)}
        allProjects={mergedProjects}
        selectedProjectId={selectedProjectId || ''}
        onRestore={handleRestore}
        showToast={showToast}
      />
    ),
  };

  return (
    <ProtectedApp>
      <AppShell
        current={currentPage}
        onNavigate={setCurrentPage}
        projects={projectOptions}
        selectedProjectId={selectedProjectId || ''}
        onSelectProject={setSelectedProjectId}
        coverImage={mergedSelectedProject.coverImage}
        projectName={mergedSelectedProject.nome}
      >
        {pages[currentPage]}
      </AppShell>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ProtectedApp>
  );
}

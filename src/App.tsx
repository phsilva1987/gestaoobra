import { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer, type ToastMsg } from './components/Toast';
import { AppLoader } from './components/AppLoader';
import { ProtectedApp } from './auth/ProtectedApp';
import { useProjects } from './hooks/useProjects';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const Stages = lazy(() => import('./pages/Stages').then(m => ({ default: m.Stages })));
const Professionals = lazy(() => import('./pages/Professionals').then(m => ({ default: m.Professionals })));
const Materials = lazy(() => import('./pages/Materials').then(m => ({ default: m.Materials })));
const EquipmentPage = lazy(() => import('./pages/Equipment').then(m => ({ default: m.Equipment })));
const Schedule = lazy(() => import('./pages/Schedule').then(m => ({ default: m.Schedule })));
const Finance = lazy(() => import('./pages/Finance').then(m => ({ default: m.Finance })));
const UsersPage = lazy(() => import('./pages/Users').then(m => ({ default: m.UsersPage })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const PageFallback = () => <AppLoader />;
import type { ProjectFormData } from './components/projects/ProjectForm';
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
import { friendlyError } from './lib/errors';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const {
    projects, selectedProject, selectedProjectId, setSelectedProjectId,
    loading, error: projectsError, profile, refresh,
    addProject, updateProject, updateProjectFull, removeProject, changeProjectImage, removeProjectImageHandler,
    addSupplier, updateSupplier, deleteSupplier, addCategory, removeCategory,
    addStage, updateStage, deleteStage, toggleCheck, finishStage,
    addProfessional, updateProfessional, deleteProfessional,
    addJob, updateJob, deleteJob,
    addMaterial, updateMaterial, deleteMaterial,
    addEquipment, updateEquipment, deleteEquipment,
    addUnforeseen, updateUnforeseen, deleteUnforeseen,
    addPayment, updatePayment, deletePayment,
    addAdmin, updateAdmin, deleteAdmin,
    addChecklistItem: _addChecklistItem, toggleChecklistItem: _toggleChecklistItem, removeChecklistItem: _removeChecklistItem,
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

  const wrap = useCallback(
    <T extends (...args: never[]) => Promise<unknown>>(
      fn: T, successMsg: string, errorFallback: string
    ): T => {
      return (async (...args: Parameters<T>) => {
        try {
          await fn(...args);
          if (successMsg) showToast(successMsg, 'success');
        } catch (err) {
          showToast(friendlyError(err, errorFallback), 'error');
          throw err;
        }
      }) as T;
    },
    [showToast]
  );

  // ---- Handlers ----
  const handleAddProject = useCallback(async (data: ProjectFormData): Promise<string> => {
    try {
      const newId = await addProject(data);
      showToast('Projeto criado com sucesso!', 'success');
      return newId;
    } catch (err) {
      showToast(friendlyError(err, 'Erro ao criar projeto'), 'error');
      throw err;
    }
  }, [addProject, showToast]);

  const handleUpdateProjectFull = useCallback(async (projectId: string, data: ProjectFormData) => {
    try { await updateProjectFull(projectId, data); showToast('Projeto atualizado!', 'success'); }
    catch (err) { showToast(friendlyError(err, 'Erro ao atualizar projeto'), 'error'); }
  }, [updateProjectFull, showToast]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try { await removeProject(projectId); showToast('Projeto excluído.', 'success'); }
    catch (err) { showToast(friendlyError(err, 'Erro ao excluir projeto'), 'error'); }
  }, [removeProject, showToast]);

  const handleUpdateProject = useCallback(async (projectId: string, data: ProjectSettingsFormData) => {
    try { await updateProject(projectId, data); showToast('Configurações salvas!', 'success'); }
    catch (err) { showToast(friendlyError(err, 'Erro ao salvar configurações'), 'error'); }
  }, [updateProject, showToast]);

  const handleImageChange = useCallback(async (projectId: string, file: File) => {
    try { await changeProjectImage(projectId, file); showToast('Imagem atualizada.', 'success'); }
    catch (err) { showToast(friendlyError(err, 'Não foi possível enviar a imagem.'), 'error'); }
  }, [changeProjectImage, showToast]);

  const handleImageRemove = useCallback(async (projectId: string) => {
    try { await removeProjectImageHandler(projectId); showToast('Imagem removida.', 'success'); }
    catch (err) { showToast(friendlyError(err, 'Não foi possível remover a imagem.'), 'error'); }
  }, [removeProjectImageHandler, showToast]);

  const handleAddCategory = useCallback(async (projectId: string, kind: 'obra' | 'material', name: string) => {
    try { await addCategory(projectId, kind, name); }
    catch (err) { showToast(friendlyError(err, 'Erro ao adicionar categoria'), 'error'); }
  }, [addCategory, showToast]);

  const handleRemoveCategory = useCallback(async (projectId: string, kind: 'obra' | 'material', name: string) => {
    try { await removeCategory(projectId, kind, name); }
    catch (err) { showToast(friendlyError(err, 'Erro ao remover categoria'), 'error'); }
  }, [removeCategory, showToast]);

  const handleAddSupplier = useCallback(async (projectId: string, data: SupplierFormData) => {
    try { return await addSupplier(projectId, data); }
    catch (err) { showToast(friendlyError(err, 'Erro ao salvar fornecedor'), 'error'); throw err; }
  }, [addSupplier, showToast]);

  const handleUpdateSupplier = useCallback(async (projectId: string, id: string, data: SupplierFormData) => {
    try { await updateSupplier(projectId, id, data); showToast('Fornecedor atualizado!', 'success'); }
    catch (err) { showToast(friendlyError(err, 'Erro ao atualizar fornecedor'), 'error'); }
  }, [updateSupplier, showToast]);

  const handleDeleteSupplier = useCallback(async (projectId: string, id: string) => {
    try { await deleteSupplier(projectId, id); showToast('Fornecedor excluído.', 'success'); }
    catch (err) { showToast(friendlyError(err, 'Erro ao excluir fornecedor'), 'error'); }
  }, [deleteSupplier, showToast]);

  const handleRestored = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // ---- Loading / error / empty states ----
  if (loading) {
    return (
      <ProtectedApp>
        <AppLoader />
      </ProtectedApp>
    );
  }

  if (projectsError) {
    return (
      <ProtectedApp>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
          <p style={{ color: 'var(--error, #d94a3a)', fontSize: 16, fontWeight: 600 }}>Erro ao carregar projetos: {projectsError}</p>
          <button className="btn" onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </ProtectedApp>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const canCreateProject = profile?.role === 'admin' || profile?.role === 'operator';

  if (projects.length === 0 || !selectedProject) {
    return (
      <ProtectedApp>
        <AppShell current={currentPage} onNavigate={setCurrentPage} projects={[]} selectedProjectId="" onSelectProject={() => {}} coverImage="" projectName="" isAdmin={isAdmin}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, textAlign: 'center' }}>
            <div>
              <h2 style={{ marginBottom: 8 }}>Nenhum projeto disponível</h2>
              <p style={{ color: 'var(--muted)', maxWidth: 400 }}>
                Você ainda não possui projetos vinculados. Você pode criar um novo projeto para começar.
              </p>
            </div>
            {canCreateProject && (
              <Suspense fallback={<PageFallback />}>
                <Projects projects={[]} selectedProjectId="" onSelectProject={() => {}} onNavigate={setCurrentPage} onAddProject={handleAddProject} onUpdateProject={handleUpdateProjectFull} onDeleteProject={handleDeleteProject} canCreate={true} />
              </Suspense>
            )}
          </div>
        </AppShell>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </ProtectedApp>
    );
  }

  const pid = selectedProject.id;

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard project={selectedProject} />,
    projetos: (
      <Projects projects={projects} selectedProjectId={selectedProjectId || ''} onSelectProject={setSelectedProjectId} onNavigate={setCurrentPage} onAddProject={handleAddProject} onUpdateProject={handleUpdateProjectFull} onDeleteProject={handleDeleteProject} canCreate={canCreateProject} />
    ),
    obra: (
      <Stages project={selectedProject}
        onAddStage={wrap((data: StageFormData) => addStage(pid, data), 'Etapa criada!', 'Erro ao criar etapa')}
        onUpdateStage={wrap((id: string, data: StageFormData) => updateStage(pid, id, data), 'Etapa atualizada!', 'Erro ao atualizar etapa')}
        onDeleteStage={wrap((id: string) => deleteStage(pid, id), 'Etapa excluída.', 'Erro ao excluir etapa')}
        onToggleCheck={wrap((id: string, key: string, checked: boolean) => toggleCheck(pid, id, key, checked), '', 'Erro ao atualizar checklist')}
        onFinishStage={wrap((id: string) => finishStage(pid, id), 'Etapa concluída!', 'Erro ao concluir etapa')}
      />
    ),
    profissionais: (
      <Professionals project={selectedProject}
        onAddProfessional={wrap((data: ProfessionalFormData) => addProfessional(pid, data), 'Profissional adicionado!', 'Erro ao adicionar profissional')}
        onUpdateProfessional={wrap((id: string, data: ProfessionalFormData) => updateProfessional(pid, id, data), 'Profissional atualizado!', 'Erro ao atualizar profissional')}
        onDeleteProfessional={wrap((id: string) => deleteProfessional(pid, id), 'Profissional excluído.', 'Erro ao excluir profissional')}
        onAddJob={wrap((data: JobFormData) => addJob(pid, data), 'Trabalho adicionado!', 'Erro ao adicionar trabalho')}
        onUpdateJob={wrap((id: string, data: JobFormData) => updateJob(pid, id, data), 'Trabalho atualizado!', 'Erro ao atualizar trabalho')}
        onDeleteJob={wrap((id: string) => deleteJob(pid, id), 'Trabalho excluído.', 'Erro ao excluir trabalho')}
        onAddPayment={wrap((data: PaymentFormData) => addPayment(pid, data), 'Pagamento adicionado!', 'Erro ao adicionar pagamento')}
        onUpdatePayment={wrap((id: string, data: PaymentFormData) => updatePayment(pid, id, data), 'Pagamento atualizado!', 'Erro ao atualizar pagamento')}
        onDeletePayment={wrap((id: string) => deletePayment(pid, id), 'Pagamento excluído.', 'Erro ao excluir pagamento')}
      />
    ),
    materiais: (
      <Materials project={selectedProject}
        onAddMaterial={wrap((data: MaterialFormData) => addMaterial(pid, data), 'Material adicionado!', 'Erro ao adicionar material')}
        onUpdateMaterial={wrap((id: string, data: MaterialFormData) => updateMaterial(pid, id, data), 'Material atualizado!', 'Erro ao atualizar material')}
        onDeleteMaterial={wrap((id: string) => deleteMaterial(pid, id), 'Material excluído.', 'Erro ao excluir material')}
        onAddSupplier={handleAddSupplier.bind(null, pid)}
        onAddPayment={wrap((data: PaymentFormData) => addPayment(pid, data), 'Pagamento adicionado!', 'Erro ao adicionar pagamento')}
        onUpdatePayment={wrap((id: string, data: PaymentFormData) => updatePayment(pid, id, data), 'Pagamento atualizado!', 'Erro ao atualizar pagamento')}
        onDeletePayment={wrap((id: string) => deletePayment(pid, id), 'Pagamento excluído.', 'Erro ao excluir pagamento')}
      />
    ),
    equipamentos: (
      <EquipmentPage project={selectedProject}
        onAddEquipment={wrap((data: EquipmentFormData) => addEquipment(pid, data), 'Equipamento adicionado!', 'Erro ao adicionar equipamento')}
        onUpdateEquipment={wrap((id: string, data: EquipmentFormData) => updateEquipment(pid, id, data), 'Equipamento atualizado!', 'Erro ao atualizar equipamento')}
        onDeleteEquipment={wrap((id: string) => deleteEquipment(pid, id), 'Equipamento excluído.', 'Erro ao excluir equipamento')}
        onAddSupplier={handleAddSupplier.bind(null, pid)}
        onAddPayment={wrap((data: PaymentFormData) => addPayment(pid, data), 'Pagamento adicionado!', 'Erro ao adicionar pagamento')}
        onUpdatePayment={wrap((id: string, data: PaymentFormData) => updatePayment(pid, id, data), 'Pagamento atualizado!', 'Erro ao atualizar pagamento')}
        onDeletePayment={wrap((id: string) => deletePayment(pid, id), 'Pagamento excluído.', 'Erro ao excluir pagamento')}
      />
    ),
    cronograma: (
      <Schedule project={selectedProject}
        onUpdateStage={wrap((id: string, data: StageFormData) => updateStage(pid, id, data), 'Etapa atualizada!', 'Erro ao atualizar etapa')}
        onToggleCheck={wrap((id: string, key: string, checked: boolean) => toggleCheck(pid, id, key, checked), '', 'Erro ao atualizar checklist')}
        onFinishStage={wrap((id: string) => finishStage(pid, id), 'Etapa concluída!', 'Erro ao concluir etapa')}
      />
    ),
    financeiro: (
      <Finance project={selectedProject}
        onAddUnforeseen={wrap((data: UnforeseenFormData) => addUnforeseen(pid, data), 'Imprevisto adicionado!', 'Erro ao adicionar imprevisto')}
        onUpdateUnforeseen={wrap((id: string, data: UnforeseenFormData) => updateUnforeseen(pid, id, data), 'Imprevisto atualizado!', 'Erro ao atualizar imprevisto')}
        onDeleteUnforeseen={wrap((id: string) => deleteUnforeseen(pid, id), 'Imprevisto excluído.', 'Erro ao excluir imprevisto')}
        onAddPayment={wrap((data: PaymentFormData) => addPayment(pid, data), 'Pagamento adicionado!', 'Erro ao adicionar pagamento')}
        onUpdatePayment={wrap((id: string, data: PaymentFormData) => updatePayment(pid, id, data), 'Pagamento atualizado!', 'Erro ao atualizar pagamento')}
        onDeletePayment={wrap((id: string) => deletePayment(pid, id), 'Pagamento excluído.', 'Erro ao excluir pagamento')}
        onAddAdmin={wrap((data: AdminFormData) => addAdmin(pid, data), 'Item adicionado!', 'Erro ao adicionar item')}
        onUpdateAdmin={wrap((id: string, data: AdminFormData) => updateAdmin(pid, id, data), 'Item atualizado!', 'Erro ao atualizar item')}
        onDeleteAdmin={wrap((id: string) => deleteAdmin(pid, id), 'Item excluído.', 'Erro ao excluir item')}
      />
    ),
    config: (
      <Settings project={selectedProject}
        onUpdateProject={(data: ProjectSettingsFormData) => handleUpdateProject(pid, data)}
        onImageChange={(file: File) => handleImageChange(pid, file)}
        onImageRemove={() => handleImageRemove(pid)}
        onAddCategory={(kind: 'obra' | 'material', name: string) => handleAddCategory(pid, kind, name)}
        onRemoveCategory={(kind: 'obra' | 'material', name: string) => handleRemoveCategory(pid, kind, name)}
        onAddSupplier={handleAddSupplier.bind(null, pid)}
        onUpdateSupplier={(id: string, data: SupplierFormData) => handleUpdateSupplier(pid, id, data)}
        onDeleteSupplier={(id: string) => handleDeleteSupplier(pid, id)}
        allProjects={projects} selectedProjectId={selectedProjectId || ''}
        onRestored={handleRestored} showToast={showToast}
        isProjectAdmin={isAdmin}
      />
    ),
    usuarios: isAdmin ? (
      <UsersPage projects={projects} currentUserId={profile?.id || ''} showToast={showToast} />
    ) : (
      <div className="card section" style={{ marginTop: 14 }}>
        <p className="empty">Você não possui permissão para acessar esta página.</p>
      </div>
    ),
  };

  return (
    <ProtectedApp>
      <AppShell current={currentPage} onNavigate={setCurrentPage} projects={projectOptions} selectedProjectId={selectedProjectId || ''} onSelectProject={setSelectedProjectId} coverImage={selectedProject.coverImage} projectName={selectedProject.nome} isAdmin={isAdmin}>
        <Suspense fallback={<PageFallback />}>
          {pages[currentPage]}
        </Suspense>
      </AppShell>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ProtectedApp>
  );
}

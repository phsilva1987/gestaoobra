import { useState, useCallback, useEffect, useRef } from 'react';
import type { ProjectData, Supplier } from '../types';
import {
  getProjects,
  createProject as dbCreateProject,
  updateProject as dbUpdateProject,
  updateProjectFull as dbUpdateProjectFull,
  deleteProject as dbDeleteProject,
} from '../services/projectService';
import { getCategories } from '../services/categoryService';
import {
  getSuppliers,
  createSupplier as dbCreateSupplier,
  updateSupplier as dbUpdateSupplier,
  deleteSupplier as dbDeleteSupplier,
} from '../services/supplierService';
import {
  createCategory as dbCreateCategory,
  deleteCategoryByName as dbDeleteCategoryByName,
} from '../services/categoryService';
import {
  getStages,
  createStage as dbCreateStage,
  updateStage as dbUpdateStage,
  deleteStage as dbDeleteStage,
  toggleStageChecklist as dbToggleStageChecklist,
  finishStage as dbFinishStage,
} from '../services/stageService';
import {
  getProfessionals,
  createProfessional as dbCreateProfessional,
  updateProfessional as dbUpdateProfessional,
  deleteProfessional as dbDeleteProfessional,
} from '../services/professionalService';
import {
  getJobs,
  createJob as dbCreateJob,
  updateJob as dbUpdateJob,
  deleteJob as dbDeleteJob,
} from '../services/jobService';
import {
  getMaterials,
  createMaterial as dbCreateMaterial,
  updateMaterial as dbUpdateMaterial,
  deleteMaterial as dbDeleteMaterial,
} from '../services/materialService';
import {
  getEquipment,
  createEquipment as dbCreateEquipment,
  updateEquipment as dbUpdateEquipment,
  deleteEquipment as dbDeleteEquipment,
} from '../services/equipmentService';
import {
  getPayments,
  createPayment as dbCreatePayment,
  updatePayment as dbUpdatePayment,
  deletePayment as dbDeletePayment,
} from '../services/paymentService';
import {
  getUnforeseen,
  createUnforeseen as dbCreateUnforeseen,
  updateUnforeseen as dbUpdateUnforeseen,
  deleteUnforeseen as dbDeleteUnforeseen,
} from '../services/unforeseenService';
import {
  getAdminItems,
  createAdminItem as dbCreateAdminItem,
  updateAdminItem as dbUpdateAdminItem,
  deleteAdminItem as dbDeleteAdminItem,
} from '../services/adminService';
import {
  getProjectChecklist,
  createChecklistItem as dbCreateChecklistItem,
  updateChecklistItem as dbUpdateChecklistItem,
  deleteChecklistItem as dbDeleteChecklistItem,
} from '../services/checklistService';
import type { ProjectFormData } from '../components/projects/ProjectForm';
import type { ProjectSettingsFormData } from '../components/settings/ProjectSettingsForm';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';
import type { StageFormData } from '../components/stages/StageForm';
import type { ProfessionalFormData } from '../components/professionals/ProfessionalForm';
import type { JobFormData } from '../components/professionals/JobForm';
import type { MaterialFormData } from '../components/materials/MaterialForm';
import type { EquipmentFormData } from '../components/equipment/EquipmentForm';
import type { UnforeseenFormData } from '../components/finance/UnforeseenForm';
import type { PaymentFormData } from '../components/finance/PaymentForm';
import type { AdminFormData } from '../components/finance/AdminForm';
import { useAuth } from '../auth/AuthProvider';
import { uploadProjectImage, removeProjectImage as dbRemoveProjectImage, getProjectImageUrl } from '../services/storageService';
import { updateProjectImage } from '../services/projectService';

async function loadProjectData(projectId: string): Promise<Partial<ProjectData>> {
  const [
    cats, suppliers, stages, professionals, jobs, materials, equipment,
    unforeseen, payments, adminItems, checklist,
  ] = await Promise.all([
    getCategories(projectId),
    getSuppliers(projectId),
    getStages(projectId),
    getProfessionals(projectId),
    getJobs(projectId),
    getMaterials(projectId),
    getEquipment(projectId),
    getUnforeseen(projectId),
    getPayments(projectId),
    getAdminItems(projectId),
    getProjectChecklist(projectId),
  ]);
  return {
    ...cats,
    fornecedores: suppliers,
    obra: stages,
    profissionais: professionals,
    jobs,
    materiais: materials,
    equipamentos: equipment,
    imprevistos: unforeseen,
    pagamentos: payments,
    admin: adminItems,
    checklist,
  };
}

export function useProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dbProjects = await getProjects();
      if (dbProjects.length === 0) {
        setProjects([]);
        setSelectedProjectId(null);
        setLoading(false);
        return;
      }
      const enriched = await Promise.all(
        dbProjects.map(async (p) => ({ ...p, ...(await loadProjectData(p.id)) }))
      );
      setProjects(enriched);
      setSelectedProjectId((prev) => {
        if (prev && enriched.some((p) => p.id === prev)) return prev;
        return enriched[0].id;
      });
      setLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar projetos';
      setError(msg);
      setProjects([]);
      setSelectedProjectId(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile && !loadedRef.current) {
      loadedRef.current = true;
      refresh();
    }
    if (!profile) {
      loadedRef.current = false;
      setProjects([]);
      setSelectedProjectId(null);
      setLoading(true);
    }
  }, [profile, refresh]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  function updateProjectState(projectId: string, updater: (p: ProjectData) => ProjectData) {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? updater(p) : p)));
  }

  // ---- Project CRUD ----
  const addProject = useCallback(async (data: ProjectFormData): Promise<string> => {
    const created = await dbCreateProject(data);
    const projectData = await loadProjectData(created.id);
    let coverImage = created.coverImage;
    if (data.imageFile) {
      try {
        const path = await uploadProjectImage(created.id, data.imageFile);
        await updateProjectImage(created.id, path);
        coverImage = getProjectImageUrl(created.id, path);
      } catch {
        throw new Error('Projeto criado, mas não foi possível enviar a imagem.');
      }
    }
    const full = { ...created, ...projectData, coverImage };
    setProjects((prev) => [...prev, full]);
    setSelectedProjectId(created.id);
    return created.id;
  }, []);

  const updateProject = useCallback(async (projectId: string, data: ProjectSettingsFormData): Promise<void> => {
    await dbUpdateProject(projectId, data);
    updateProjectState(projectId, (p) => ({
      ...p, nome: data.nome, tipo: data.tipo, status: data.status,
      config: { ...data.config, projeto: data.nome },
    }));
  }, []);

  const updateProjectFull = useCallback(async (projectId: string, data: ProjectFormData): Promise<void> => {
    let coverImage = data.coverImage;
    if (data.imageFile) {
      const path = await uploadProjectImage(projectId, data.imageFile);
      await updateProjectImage(projectId, path);
      coverImage = getProjectImageUrl(projectId, path);
    } else {
      await dbUpdateProjectFull(projectId, data);
    }
    updateProjectState(projectId, (p) => ({
      ...p, nome: data.nome, tipo: data.tipo, status: data.status, coverImage,
      config: { ...data.config, projeto: data.nome },
    }));
  }, []);

  const removeProject = useCallback(async (projectId: string): Promise<void> => {
    await dbDeleteProject(projectId);
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== projectId);
      if (remaining.length === 0) setSelectedProjectId(null);
      else if (projectId === selectedProjectId) setSelectedProjectId(remaining[0].id);
      return remaining;
    });
  }, [selectedProjectId]);

  const changeProjectImage = useCallback(async (projectId: string, file: File): Promise<void> => {
    const path = await uploadProjectImage(projectId, file);
    await updateProjectImage(projectId, path);
    const url = getProjectImageUrl(projectId, path);
    updateProjectState(projectId, (p) => ({ ...p, coverImage: url }));
  }, []);

  const removeProjectImageHandler = useCallback(async (projectId: string): Promise<void> => {
    await dbRemoveProjectImage(projectId);
    await updateProjectImage(projectId, '');
    updateProjectState(projectId, (p) => ({ ...p, coverImage: '' }));
  }, []);

  // ---- Suppliers ----
  const addSupplier = useCallback(async (projectId: string, data: SupplierFormData): Promise<Supplier> => {
    const created = await dbCreateSupplier(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, fornecedores: [...p.fornecedores, created] }));
    return created;
  }, []);

  const updateSupplier = useCallback(async (projectId: string, id: string, data: SupplierFormData): Promise<void> => {
    await dbUpdateSupplier(id, data);
    updateProjectState(projectId, (p) => ({
      ...p, fornecedores: p.fornecedores.map((f) => (f.id === id ? { ...f, ...data } : f)),
    }));
  }, []);

  const deleteSupplier = useCallback(async (projectId: string, id: string): Promise<void> => {
    await dbDeleteSupplier(id);
    updateProjectState(projectId, (p) => ({ ...p, fornecedores: p.fornecedores.filter((f) => f.id !== id) }));
  }, []);

  // ---- Categories ----
  const addCategory = useCallback(async (projectId: string, kind: 'obra' | 'material', name: string): Promise<void> => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const baseKey = kind === 'obra' ? 'categoriasObra' : 'categoriasMaterial';
    const extraKey = kind === 'obra' ? 'categoriasObraExtra' : 'categoriasMaterialExtra';
    const all = [...(project[baseKey] || []), ...(project[extraKey] || [])];
    if (all.some((c) => c.toLowerCase() === name.toLowerCase())) return;
    await dbCreateCategory(projectId, kind, name);
    updateProjectState(projectId, (p) => ({ ...p, [extraKey]: [...(p[extraKey] || []), name] }));
  }, [projects]);

  const removeCategory = useCallback(async (projectId: string, kind: 'obra' | 'material', name: string): Promise<void> => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const inUse = kind === 'obra'
      ? project.obra.some((s) => s.categoria === name)
      : project.materiais.some((m) => m.categoria === name);
    if (inUse) return;
    const extraKey = kind === 'obra' ? 'categoriasObraExtra' : 'categoriasMaterialExtra';
    const isInExtra = (project[extraKey] || []).includes(name);
    if (isInExtra) await dbDeleteCategoryByName(projectId, kind, name);
    updateProjectState(projectId, (p) => {
      const baseKey = kind === 'obra' ? 'categoriasObra' : 'categoriasMaterial';
      return {
        ...p,
        [baseKey]: (p[baseKey] || []).filter((c) => c !== name),
        [extraKey]: (p[extraKey] || []).filter((c) => c !== name),
      };
    });
  }, [projects]);

  // ---- Stages ----
  const addStage = useCallback(async (projectId: string, data: StageFormData): Promise<void> => {
    const stage = await dbCreateStage(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, obra: [...p.obra, stage] }));
  }, []);

  const updateStage = useCallback(async (projectId: string, stageId: string, data: StageFormData): Promise<void> => {
    await dbUpdateStage(stageId, data);
    updateProjectState(projectId, (p) => ({
      ...p, obra: p.obra.map((s) => (s.id === stageId ? { ...s, nome: data.nome, categoria: data.categoria, prioridade: data.prioridade, dependencia: data.dependencia, status: data.status, progresso: data.progresso, inicio: data.inicio, fim: data.fim, observacao: data.observacao } : s)),
    }));
  }, []);

  const deleteStage = useCallback(async (projectId: string, stageId: string): Promise<void> => {
    await dbDeleteStage(stageId);
    updateProjectState(projectId, (p) => ({ ...p, obra: p.obra.filter((s) => s.id !== stageId) }));
  }, []);

  const toggleCheck = useCallback(async (projectId: string, stageId: string, key: string, completed: boolean): Promise<void> => {
    const labelMap: Record<string, string> = {
      checkServico: 'Serviço executado',
      checkConferido: 'Serviço conferido',
      checkLimpo: 'Ambiente limpo',
      checkPagamento: 'Pagamento conferido',
      checkPendencias: 'Sem pendências',
    };
    const label = labelMap[key] || key;
    await dbToggleStageChecklist(stageId, label, completed);
    updateProjectState(projectId, (p) => ({
      ...p, obra: p.obra.map((s) => (s.id === stageId ? { ...s, [key]: completed } : s)),
    }));
  }, []);

  const finishStage = useCallback(async (projectId: string, stageId: string): Promise<void> => {
    await dbFinishStage(stageId);
    updateProjectState(projectId, (p) => ({
      ...p, obra: p.obra.map((s) => s.id === stageId ? { ...s, status: 'Concluído', progresso: 100, fimReal: new Date().toISOString().slice(0, 10), checkServico: true, checkConferido: true, checkLimpo: true, checkPagamento: true, checkPendencias: true } : s),
    }));
  }, []);

  // ---- Professionals ----
  const addProfessional = useCallback(async (projectId: string, data: ProfessionalFormData): Promise<void> => {
    const prof = await dbCreateProfessional(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, profissionais: [...p.profissionais, prof] }));
  }, []);

  const updateProfessional = useCallback(async (projectId: string, profId: string, data: ProfessionalFormData): Promise<void> => {
    await dbUpdateProfessional(profId, data);
    updateProjectState(projectId, (p) => ({ ...p, profissionais: p.profissionais.map((pr) => pr.id === profId ? { ...pr, ...data } : pr) }));
  }, []);

  const deleteProfessional = useCallback(async (projectId: string, profId: string): Promise<void> => {
    await dbDeleteProfessional(profId);
    updateProjectState(projectId, (p) => ({ ...p, profissionais: p.profissionais.filter((pr) => pr.id !== profId) }));
  }, []);

  // ---- Jobs ----
  const addJob = useCallback(async (projectId: string, data: JobFormData): Promise<void> => {
    const job = await dbCreateJob(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, jobs: [...p.jobs, job] }));
  }, []);

  const updateJob = useCallback(async (projectId: string, jobId: string, data: JobFormData): Promise<void> => {
    await dbUpdateJob(jobId, data);
    const n = parseInt(data.parcelas) || 1;
    updateProjectState(projectId, (p) => ({
      ...p, jobs: p.jobs.map((j) => j.id === jobId ? { ...j, etapa_id: data.etapa_id, profissional_id: data.profissional_id, valor: data.valor, pago: data.pago, forma: data.forma, parcelas: data.forma === 'Cartão' ? data.parcelas : '1x', chavePix: data.forma === 'Pix' ? data.chavePix : '', valorParcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null, status: data.status } : j),
    }));
  }, []);

  const deleteJob = useCallback(async (projectId: string, jobId: string): Promise<void> => {
    await dbDeleteJob(jobId);
    updateProjectState(projectId, (p) => ({ ...p, jobs: p.jobs.filter((j) => j.id !== jobId) }));
  }, []);

  // ---- Materials ----
  const addMaterial = useCallback(async (projectId: string, data: MaterialFormData): Promise<void> => {
    const mat = await dbCreateMaterial(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, materiais: [...p.materiais, mat] }));
  }, []);

  const updateMaterial = useCallback(async (projectId: string, materialId: string, data: MaterialFormData): Promise<void> => {
    await dbUpdateMaterial(materialId, data);
    updateProjectState(projectId, (p) => ({
      ...p, materiais: p.materiais.map((m) => m.id === materialId ? { ...m, ...data } : m),
    }));
  }, []);

  const deleteMaterial = useCallback(async (projectId: string, materialId: string): Promise<void> => {
    await dbDeleteMaterial(materialId);
    updateProjectState(projectId, (p) => ({ ...p, materiais: p.materiais.filter((m) => m.id !== materialId) }));
  }, []);

  // ---- Equipment ----
  const addEquipment = useCallback(async (projectId: string, data: EquipmentFormData): Promise<void> => {
    const eq = await dbCreateEquipment(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, equipamentos: [...p.equipamentos, eq] }));
  }, []);

  const updateEquipment = useCallback(async (projectId: string, eqId: string, data: EquipmentFormData): Promise<void> => {
    await dbUpdateEquipment(eqId, data);
    updateProjectState(projectId, (p) => ({
      ...p, equipamentos: p.equipamentos.map((e) => e.id === eqId ? { ...e, ...data } : e),
    }));
  }, []);

  const deleteEquipment = useCallback(async (projectId: string, eqId: string): Promise<void> => {
    await dbDeleteEquipment(eqId);
    updateProjectState(projectId, (p) => ({ ...p, equipamentos: p.equipamentos.filter((e) => e.id !== eqId) }));
  }, []);

  // ---- Unforeseen ----
  const addUnforeseen = useCallback(async (projectId: string, data: UnforeseenFormData): Promise<void> => {
    const item = await dbCreateUnforeseen(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, imprevistos: [...p.imprevistos, item] }));
  }, []);

  const updateUnforeseen = useCallback(async (projectId: string, id: string, data: UnforeseenFormData): Promise<void> => {
    await dbUpdateUnforeseen(id, data);
    updateProjectState(projectId, (p) => ({ ...p, imprevistos: p.imprevistos.map((u) => u.id === id ? { ...u, ...data } : u) }));
  }, []);

  const deleteUnforeseen = useCallback(async (projectId: string, id: string): Promise<void> => {
    await dbDeleteUnforeseen(id);
    updateProjectState(projectId, (p) => ({ ...p, imprevistos: p.imprevistos.filter((u) => u.id !== id) }));
  }, []);

  // ---- Payments ----
  const addPayment = useCallback(async (projectId: string, data: PaymentFormData): Promise<void> => {
    const item = await dbCreatePayment(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, pagamentos: [...p.pagamentos, item] }));
  }, []);

  const updatePayment = useCallback(async (projectId: string, id: string, data: PaymentFormData): Promise<void> => {
    await dbUpdatePayment(id, data);
    updateProjectState(projectId, (p) => ({ ...p, pagamentos: p.pagamentos.map((pa) => pa.id === id ? { ...pa, ...data } : pa) }));
  }, []);

  const deletePayment = useCallback(async (projectId: string, id: string): Promise<void> => {
    await dbDeletePayment(id);
    updateProjectState(projectId, (p) => ({ ...p, pagamentos: p.pagamentos.filter((pa) => pa.id !== id) }));
  }, []);

  // ---- Admin Items ----
  const addAdmin = useCallback(async (projectId: string, data: AdminFormData): Promise<void> => {
    const item = await dbCreateAdminItem(projectId, data);
    updateProjectState(projectId, (p) => ({ ...p, admin: [...p.admin, item] }));
  }, []);

  const updateAdmin = useCallback(async (projectId: string, id: string, data: AdminFormData): Promise<void> => {
    await dbUpdateAdminItem(id, data);
    updateProjectState(projectId, (p) => ({ ...p, admin: p.admin.map((a) => a.id === id ? { ...a, ...data } : a) }));
  }, []);

  const deleteAdmin = useCallback(async (projectId: string, id: string): Promise<void> => {
    await dbDeleteAdminItem(id);
    updateProjectState(projectId, (p) => ({ ...p, admin: p.admin.filter((a) => a.id !== id) }));
  }, []);

  // ---- Checklist ----
  const addChecklistItem = useCallback(async (projectId: string, nome: string): Promise<void> => {
    const item = await dbCreateChecklistItem(projectId, nome);
    updateProjectState(projectId, (p) => ({ ...p, checklist: [...p.checklist, item] }));
  }, []);

  const toggleChecklistItem = useCallback(async (projectId: string, id: string, feito: boolean): Promise<void> => {
    await dbUpdateChecklistItem(id, feito);
    updateProjectState(projectId, (p) => ({ ...p, checklist: p.checklist.map((c) => c.id === id ? { ...c, feito } : c) }));
  }, []);

  const removeChecklistItem = useCallback(async (projectId: string, id: string): Promise<void> => {
    await dbDeleteChecklistItem(id);
    updateProjectState(projectId, (p) => ({ ...p, checklist: p.checklist.filter((c) => c.id !== id) }));
  }, []);

  return {
    projects, selectedProject, selectedProjectId, setSelectedProjectId,
    loading, error, refresh, profile,
    // Project CRUD
    addProject, updateProject, updateProjectFull, removeProject, changeProjectImage, removeProjectImageHandler,
    // Suppliers
    addSupplier, updateSupplier, deleteSupplier,
    // Categories
    addCategory, removeCategory,
    // Stages
    addStage, updateStage, deleteStage, toggleCheck, finishStage,
    // Professionals
    addProfessional, updateProfessional, deleteProfessional,
    // Jobs
    addJob, updateJob, deleteJob,
    // Materials
    addMaterial, updateMaterial, deleteMaterial,
    // Equipment
    addEquipment, updateEquipment, deleteEquipment,
    // Unforeseen
    addUnforeseen, updateUnforeseen, deleteUnforeseen,
    // Payments
    addPayment, updatePayment, deletePayment,
    // Admin
    addAdmin, updateAdmin, deleteAdmin,
    // Checklist
    addChecklistItem, toggleChecklistItem, removeChecklistItem,
  };
}

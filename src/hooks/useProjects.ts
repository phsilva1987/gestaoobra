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
import { mockProjects } from '../lib/mockProjects';
import type { ProjectFormData } from '../components/projects/ProjectForm';
import type { ProjectSettingsFormData } from '../components/settings/ProjectSettingsForm';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';
import { useAuth } from '../auth/AuthProvider';

// TEMPORARY: hydrate DB project with mock collections for un-migrated entities.
// During incremental migration, structural data (project, categories, suppliers)
// comes from the DB, while collections not yet migrated (stages, professionals,
// jobs, materials, equipment, payments, unforeseen, admin, checklist) come from mock.
function hydrateWithMockCollections(
  dbProject: ProjectData,
  projectId: string
): ProjectData {
  const mock = mockProjects.find((p) => p.id === projectId);
  if (!mock) return dbProject;
  return {
    ...dbProject,
    coverImage: dbProject.coverImage || mock.coverImage,
    obra: [...mock.obra],
    profissionais: [...mock.profissionais],
    jobs: [...mock.jobs],
    materiais: [...mock.materiais],
    equipamentos: [...mock.equipamentos],
    imprevistos: [...mock.imprevistos],
    pagamentos: [...mock.pagamentos],
    admin: [...mock.admin],
    checklist: [...mock.checklist],
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

      // Load categories and suppliers for each project
      const enriched = await Promise.all(
        dbProjects.map(async (p) => {
          const [cats, sups] = await Promise.all([
            getCategories(p.id),
            getSuppliers(p.id),
          ]);
          const enrichedProject: ProjectData = {
            ...p,
            ...cats,
            fornecedores: sups,
          };
          return enrichedProject;
        })
      );

      // TEMPORARY: hydrate with mock collections for un-migrated entities.
      // This keeps Stages, Professionals, Jobs, Materials, Equipment, Finance, etc. working.
      const hydrated = enriched.map((p) => hydrateWithMockCollections(p, p.id));

      setProjects(hydrated);
      setSelectedProjectId((prev) => {
        if (prev && hydrated.some((p) => p.id === prev)) return prev;
        return hydrated[0].id;
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

  // Load projects once when the user is authenticated
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

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || null;

  const addProject = useCallback(
    async (data: ProjectFormData): Promise<string> => {
      const created = await dbCreateProject(data);
      // Load categories (will be global defaults) and suppliers (empty)
      const [cats, sups] = await Promise.all([
        getCategories(created.id),
        getSuppliers(created.id),
      ]);
      const newProject: ProjectData = {
        ...created,
        ...cats,
        fornecedores: sups,
      };
      const hydrated = hydrateWithMockCollections(newProject, created.id);
      setProjects((prev) => [...prev, hydrated]);
      setSelectedProjectId(created.id);
      return created.id;
    },
    []
  );

  const updateProject = useCallback(
    async (projectId: string, data: ProjectSettingsFormData): Promise<void> => {
      await dbUpdateProject(projectId, data);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                nome: data.nome,
                tipo: data.tipo,
                status: data.status,
                config: { ...data.config, projeto: data.nome },
              }
            : p
        )
      );
    },
    []
  );

  const updateProjectFull = useCallback(
    async (projectId: string, data: ProjectFormData): Promise<void> => {
      await dbUpdateProjectFull(projectId, data);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                nome: data.nome,
                tipo: data.tipo,
                status: data.status,
                coverImage: data.coverImage,
                config: { ...data.config, projeto: data.nome },
              }
            : p
        )
      );
    },
    []
  );

  const removeProject = useCallback(
    async (projectId: string): Promise<void> => {
      await dbDeleteProject(projectId);
      setProjects((prev) => {
        const remaining = prev.filter((p) => p.id !== projectId);
        if (remaining.length === 0) {
          setSelectedProjectId(null);
        } else if (projectId === selectedProjectId) {
          setSelectedProjectId(remaining[0].id);
        }
        return remaining;
      });
    },
    [selectedProjectId]
  );

  const changeProjectImage = useCallback(
    async (projectId: string, base64: string): Promise<void> => {
      // TEMPORARY: base64 stays in memory only; Storage will be a future phase.
      // We don't persist base64 to the DB cover_image_path column.
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, coverImage: base64 } : p
        )
      );
    },
    []
  );

  const addSupplier = useCallback(
    async (projectId: string, data: SupplierFormData): Promise<Supplier> => {
      const created = await dbCreateSupplier(projectId, data);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, fornecedores: [...p.fornecedores, created] }
            : p
        )
      );
      return created;
    },
    []
  );

  const updateSupplier = useCallback(
    async (projectId: string, id: string, data: SupplierFormData): Promise<void> => {
      await dbUpdateSupplier(id, data);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                fornecedores: p.fornecedores.map((f) =>
                  f.id === id
                    ? { ...f, nome: data.nome, telefone: data.telefone, email: data.email, site: data.site }
                    : f
                ),
              }
            : p
        )
      );
    },
    []
  );

  const deleteSupplier = useCallback(
    async (projectId: string, id: string): Promise<void> => {
      await dbDeleteSupplier(id);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, fornecedores: p.fornecedores.filter((f) => f.id !== id) }
            : p
        )
      );
    },
    []
  );

  const addCategory = useCallback(
    async (projectId: string, kind: 'obra' | 'material', name: string): Promise<void> => {
      // Check for duplicates in current state
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const baseKey = kind === 'obra' ? 'categoriasObra' : 'categoriasMaterial';
      const extraKey = kind === 'obra' ? 'categoriasObraExtra' : 'categoriasMaterialExtra';
      const all = [...(project[baseKey] || []), ...(project[extraKey] || [])];
      if (all.some((c) => c.toLowerCase() === name.toLowerCase())) return;

      await dbCreateCategory(projectId, kind, name);
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            [extraKey]: [...(p[extraKey] || []), name],
          };
        })
      );
    },
    [projects]
  );

  const removeCategory = useCallback(
    async (projectId: string, kind: 'obra' | 'material', name: string): Promise<void> => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      // Preserve frontend validation for mock-bound categories
      const inUse = kind === 'obra'
        ? project.obra.some((s) => s.categoria === name)
        : project.materiais.some((m) => m.categoria === name);
      if (inUse) return;

      // Only delete project-specific categories from DB
      const extraKey = kind === 'obra' ? 'categoriasObraExtra' : 'categoriasMaterialExtra';
      const isInExtra = (project[extraKey] || []).includes(name);
      if (isInExtra) {
        await dbDeleteCategoryByName(projectId, kind, name);
      }

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const baseKey = kind === 'obra' ? 'categoriasObra' : 'categoriasMaterial';
          return {
            ...p,
            [baseKey]: (p[baseKey] || []).filter((c) => c !== name),
            [extraKey]: (p[extraKey] || []).filter((c) => c !== name),
          };
        })
      );
    },
    [projects]
  );

  return {
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    loading,
    error,
    refresh,
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
  };
}

import type { ProjectData, Supplier } from '../types';
import type { ProjectSettingsFormData } from '../components/settings/ProjectSettingsForm';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';
import { ProjectSettingsForm } from '../components/settings/ProjectSettingsForm';
import { ProjectImageManager } from '../components/settings/ProjectImageManager';
import { CategoryManager } from '../components/settings/CategoryManager';
import { SupplierManager } from '../components/settings/SupplierManager';
import { BackupSection } from '../components/settings/BackupSection';
import { TeamManager } from '../components/team/TeamManager';

interface SettingsProps {
  project: ProjectData;
  onUpdateProject: (data: ProjectSettingsFormData) => void;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  onAddCategory: (kind: 'obra' | 'material', name: string) => void;
  onRemoveCategory: (kind: 'obra' | 'material', name: string) => void;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
  onUpdateSupplier: (id: string, data: SupplierFormData) => void;
  onDeleteSupplier: (id: string) => void;
  allProjects: ProjectData[];
  selectedProjectId: string;
  onRestored: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  isProjectAdmin: boolean;
  currentUserId: string;
}

export function Settings({
  project,
  onUpdateProject,
  onImageChange,
  onImageRemove,
  onAddCategory,
  onRemoveCategory,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  allProjects,
  selectedProjectId,
  onRestored,
  showToast,
  isProjectAdmin,
  currentUserId,
}: SettingsProps) {
  return (
    <>
      <div className="page-top">
        <div>
          <h1>Configurações</h1>
          <p>Dados da empresa, responsável e parâmetros da reforma</p>
        </div>
      </div>

      <ProjectSettingsForm project={project} onSave={onUpdateProject} />

      <div style={{ marginTop: 14 }}>
        <ProjectImageManager project={project} onImageChange={onImageChange} onImageRemove={onImageRemove} isAdmin={isProjectAdmin} />
      </div>

      <CategoryManager project={project} onAdd={onAddCategory} onRemove={onRemoveCategory} />

      <SupplierManager
        project={project}
        onAdd={onAddSupplier}
        onUpdate={onUpdateSupplier}
        onDelete={onDeleteSupplier}
      />

      <TeamManager
        projectId={project.id}
        isProjectAdmin={isProjectAdmin}
        currentUserId={currentUserId}
        showToast={showToast}
      />

      <BackupSection
        projects={allProjects}
        selectedProjectId={selectedProjectId}
        onRestored={onRestored}
        showToast={showToast}
      />
    </>
  );
}

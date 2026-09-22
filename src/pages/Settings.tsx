import type { ProjectData, Supplier } from '../types';
import type { ProjectSettingsFormData } from '../components/settings/ProjectSettingsForm';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';
import { ProjectSettingsForm } from '../components/settings/ProjectSettingsForm';
import { ProjectImageManager } from '../components/settings/ProjectImageManager';
import { CategoryManager } from '../components/settings/CategoryManager';
import { SupplierManager } from '../components/settings/SupplierManager';

interface SettingsProps {
  project: ProjectData;
  onUpdateProject: (data: ProjectSettingsFormData) => void;
  onImageChange: (base64: string) => void;
  onAddCategory: (kind: 'obra' | 'material', name: string) => void;
  onRemoveCategory: (kind: 'obra' | 'material', name: string) => void;
  onAddSupplier: (data: SupplierFormData) => Supplier;
  onUpdateSupplier: (id: string, data: SupplierFormData) => void;
  onDeleteSupplier: (id: string) => void;
}

export function Settings({
  project,
  onUpdateProject,
  onImageChange,
  onAddCategory,
  onRemoveCategory,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
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
        <ProjectImageManager project={project} onImageChange={onImageChange} />
      </div>

      <CategoryManager project={project} onAdd={onAddCategory} onRemove={onRemoveCategory} />

      <SupplierManager
        project={project}
        onAdd={onAddSupplier}
        onUpdate={onUpdateSupplier}
        onDelete={onDeleteSupplier}
      />
    </>
  );
}

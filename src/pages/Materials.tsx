import { useState } from 'react';
import type { Material, ProjectData, Supplier } from '../types';
import { MaterialTable } from '../components/materials/MaterialTable';
import { MaterialForm, type MaterialFormData } from '../components/materials/MaterialForm';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';

interface MaterialsProps {
  project: ProjectData;
  onAddMaterial: (data: MaterialFormData) => void;
  onUpdateMaterial: (id: string, data: MaterialFormData) => void;
  onDeleteMaterial: (id: string) => void;
  onAddSupplier: (data: SupplierFormData) => Supplier;
}

type Modal =
  | { type: 'form'; material: Material | null }
  | { type: 'delete'; material: Material }
  | null;

export function Materials({
  project,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onAddSupplier,
}: MaterialsProps) {
  const [modal, setModal] = useState<Modal>(null);

  function handleSave(data: MaterialFormData) {
    if (modal?.type === 'form' && modal.material) {
      onUpdateMaterial(modal.material.id, data);
    } else {
      onAddMaterial(data);
    }
    setModal(null);
  }

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Materiais</h1>
          <p>Compras vinculadas às etapas da obra</p>
        </div>
        <button className="btn" onClick={() => setModal({ type: 'form', material: null })}>
          + Adicionar material
        </button>
      </div>

      <MaterialTable
        project={project}
        onEdit={(material) => setModal({ type: 'form', material })}
        onDelete={(material) => setModal({ type: 'delete', material })}
      />

      {modal?.type === 'form' && (
        <MaterialForm
          material={modal.material}
          project={project}
          onAddSupplier={onAddSupplier}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === 'delete' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir material</h2>
            <p>Confirma a exclusão de <b>{modal.material.nome}</b>?</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button
                className="btn danger"
                onClick={() => { onDeleteMaterial(modal.material.id); setModal(null); }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

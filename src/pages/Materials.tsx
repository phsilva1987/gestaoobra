import { useState } from 'react';
import type { Material, ProjectData, Supplier } from '../types';
import { MaterialTable } from '../components/materials/MaterialTable';
import { MaterialForm, type MaterialFormData } from '../components/materials/MaterialForm';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';

interface MaterialsProps {
  project: ProjectData;
  onAddMaterial: (data: MaterialFormData) => Promise<void> | void;
  onUpdateMaterial: (id: string, data: MaterialFormData) => Promise<void> | void;
  onDeleteMaterial: (id: string) => Promise<void> | void;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(data: MaterialFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'form' && modal.material) {
        await onUpdateMaterial(modal.material.id, data);
      } else {
        await onAddMaterial(data);
      }
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
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
          saving={saving}
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
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try { await onDeleteMaterial(modal.material.id); setModal(null); }
                  catch { /* toast shown by wrap */ }
                  finally { setDeleting(false); }
                }}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

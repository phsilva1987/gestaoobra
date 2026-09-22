import { useState } from 'react';
import type { Equipment, ProjectData, Supplier } from '../types';
import { EquipmentTable } from '../components/equipment/EquipmentTable';
import { EquipmentForm, type EquipmentFormData } from '../components/equipment/EquipmentForm';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';

interface EquipmentProps {
  project: ProjectData;
  onAddEquipment: (data: EquipmentFormData) => void;
  onUpdateEquipment: (id: string, data: EquipmentFormData) => void;
  onDeleteEquipment: (id: string) => void;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
}

type Modal =
  | { type: 'form'; equipment: Equipment | null }
  | { type: 'delete'; equipment: Equipment }
  | null;

export function Equipment({
  project,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onAddSupplier,
}: EquipmentProps) {
  const [modal, setModal] = useState<Modal>(null);

  function handleSave(data: EquipmentFormData) {
    if (modal?.type === 'form' && modal.equipment) {
      onUpdateEquipment(modal.equipment.id, data);
    } else {
      onAddEquipment(data);
    }
    setModal(null);
  }

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Equipamentos</h1>
          <p>Inventário de equipamentos, vinculados às etapas da obra</p>
        </div>
        <button className="btn" onClick={() => setModal({ type: 'form', equipment: null })}>
          + Adicionar equipamento
        </button>
      </div>

      <EquipmentTable
        project={project}
        onEdit={(equipment) => setModal({ type: 'form', equipment })}
        onDelete={(equipment) => setModal({ type: 'delete', equipment })}
      />

      {modal?.type === 'form' && (
        <EquipmentForm
          equipment={modal.equipment}
          project={project}
          onAddSupplier={onAddSupplier}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === 'delete' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir equipamento</h2>
            <p>Confirma a exclusão de <b>{modal.equipment.nome}</b>?</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button
                className="btn danger"
                onClick={() => { onDeleteEquipment(modal.equipment.id); setModal(null); }}
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

import { useState } from 'react';
import type { Equipment, ProjectData, Supplier, Commitment, Payment } from '../types';
import { EquipmentTable } from '../components/equipment/EquipmentTable';
import { EquipmentForm, type EquipmentFormData } from '../components/equipment/EquipmentForm';
import { PaymentForm, type PaymentFormData } from '../components/finance/PaymentForm';
import { CommitmentDetail } from '../components/finance/CommitmentDetail';
import { money, fmt } from '../lib/format';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';

interface EquipmentProps {
  project: ProjectData;
  onAddEquipment: (data: EquipmentFormData) => Promise<void> | void;
  onUpdateEquipment: (id: string, data: EquipmentFormData) => Promise<void> | void;
  onDeleteEquipment: (id: string) => Promise<void> | void;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
  onAddPayment: (data: PaymentFormData) => Promise<void> | void;
  onUpdatePayment: (id: string, data: PaymentFormData) => Promise<void> | void;
  onDeletePayment: (id: string) => Promise<void> | void;
}

type Modal =
  | { type: 'form'; equipment: Equipment | null }
  | { type: 'delete'; equipment: Equipment }
  | { type: 'pay'; commitment: Commitment }
  | { type: 'view-payments'; commitment: Commitment }
  | { type: 'edit-payment'; payment: Payment; commitment: Commitment | null }
  | { type: 'delete-payment'; payment: Payment }
  | null;

export function Equipment({
  project,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onAddSupplier,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
}: EquipmentProps) {
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(data: EquipmentFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'form' && modal.equipment) {
        await onUpdateEquipment(modal.equipment.id, data);
      } else {
        await onAddEquipment(data);
      }
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
  }

  async function handlePay(data: PaymentFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'edit-payment' && modal.payment) {
        await onUpdatePayment(modal.payment.id, data);
      } else {
        await onAddPayment(data);
      }
      if (modal?.type === 'view-payments') {
        setModal({ type: 'view-payments', commitment: modal.commitment });
      } else {
        setModal(null);
      }
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
  }

  async function handleDeletePayment() {
    if (modal?.type !== 'delete-payment') return;
    setDeleting(true);
    try {
      await onDeletePayment(modal.payment.id);
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setDeleting(false); }
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
        onPay={(commitment) => setModal({ type: 'pay', commitment })}
      />

      {modal?.type === 'form' && (
        <EquipmentForm
          equipment={modal.equipment}
          project={project}
          onAddSupplier={onAddSupplier}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          onPay={(commitment) => setModal({ type: 'pay', commitment })}
          onViewPayments={(commitment) => setModal({ type: 'view-payments', commitment })}
          saving={saving}
        />
      )}

      {modal?.type === 'pay' && (
        <PaymentForm
          payment={null}
          commitment={modal.commitment}
          onSave={handlePay}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.type === 'view-payments' && (
        <CommitmentDetail
          commitment={modal.commitment}
          project={project}
          onPay={(c) => setModal({ type: 'pay', commitment: c })}
          onEditPayment={(p) => setModal({ type: 'edit-payment', payment: p, commitment: modal.commitment })}
          onDeletePayment={(p) => setModal({ type: 'delete-payment', payment: p })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'edit-payment' && modal.commitment && (
        <PaymentForm
          payment={modal.payment}
          commitment={modal.commitment}
          onSave={handlePay}
          onCancel={() => setModal({ type: 'view-payments', commitment: modal.commitment! })}
          saving={saving}
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
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try { await onDeleteEquipment(modal.equipment.id); setModal(null); }
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

      {modal?.type === 'delete-payment' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir pagamento?</h2>
            <p>Você está prestes a excluir:</p>
            <p><b>{modal.payment.referencia}</b><br />{money(modal.payment.valor)} — {fmt(modal.payment.paidAt)}</p>
            <p className="hint">Essa ação atualizará o saldo pendente do compromisso.</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn danger" disabled={deleting} onClick={handleDeletePayment}>
                {deleting ? 'Excluindo...' : 'Excluir pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

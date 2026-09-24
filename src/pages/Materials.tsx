import { useState } from 'react';
import type { Material, ProjectData, Supplier, Commitment, Payment } from '../types';
import { MaterialTable } from '../components/materials/MaterialTable';
import { MaterialForm, type MaterialFormData } from '../components/materials/MaterialForm';
import { PaymentForm, type PaymentFormData } from '../components/finance/PaymentForm';
import { CommitmentDetail } from '../components/finance/CommitmentDetail';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';

interface MaterialsProps {
  project: ProjectData;
  onAddMaterial: (data: MaterialFormData) => Promise<void> | void;
  onUpdateMaterial: (id: string, data: MaterialFormData) => Promise<void> | void;
  onDeleteMaterial: (id: string) => Promise<void> | void;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
  onAddPayment: (data: PaymentFormData) => Promise<void> | void;
  onUpdatePayment: (id: string, data: PaymentFormData) => Promise<void> | void;
  onDeletePayment: (id: string) => Promise<void> | void;
}

type Modal =
  | { type: 'form'; material: Material | null }
  | { type: 'delete'; material: Material }
  | { type: 'pay'; commitment: Commitment }
  | { type: 'view-payments'; commitment: Commitment }
  | { type: 'edit-payment'; payment: Payment; commitment: Commitment | null }
  | { type: 'delete-payment'; payment: Payment }
  | null;

export function Materials({
  project,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onAddSupplier,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
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
        onPay={(commitment) => setModal({ type: 'pay', commitment })}
      />

      {modal?.type === 'form' && (
        <MaterialForm
          material={modal.material}
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

      {modal?.type === 'delete-payment' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir pagamento?</h2>
            <p>Você está prestes a excluir:</p>
            <p><b>{modal.payment.referencia}</b><br />{moneyPayment(modal.payment)}</p>
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

function moneyPayment(p: Payment): string {
  return `${p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — ${p.paidAt}`;
}

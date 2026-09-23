import { useState } from 'react';
import type { Unforeseen, Payment, AdminItem, ProjectData } from '../types';
import { FinanceKpis } from '../components/finance/FinanceKpis';
import { CategoryComparison } from '../components/finance/CategoryComparison';
import { UnforeseenTable } from '../components/finance/UnforeseenTable';
import { UnforeseenForm, type UnforeseenFormData } from '../components/finance/UnforeseenForm';
import { PaymentsTable } from '../components/finance/PaymentsTable';
import { PaymentForm, type PaymentFormData } from '../components/finance/PaymentForm';
import { AdminTable } from '../components/finance/AdminTable';
import { AdminForm, type AdminFormData } from '../components/finance/AdminForm';

interface FinanceProps {
  project: ProjectData;
  onAddUnforeseen: (data: UnforeseenFormData) => Promise<void> | void;
  onUpdateUnforeseen: (id: string, data: UnforeseenFormData) => Promise<void> | void;
  onDeleteUnforeseen: (id: string) => Promise<void> | void;
  onAddPayment: (data: PaymentFormData) => Promise<void> | void;
  onUpdatePayment: (id: string, data: PaymentFormData) => Promise<void> | void;
  onDeletePayment: (id: string) => Promise<void> | void;
  onAddAdmin: (data: AdminFormData) => Promise<void> | void;
  onUpdateAdmin: (id: string, data: AdminFormData) => Promise<void> | void;
  onDeleteAdmin: (id: string) => Promise<void> | void;
}

type Modal =
  | { type: 'unforeseen'; item: Unforeseen | null }
  | { type: 'delete-unforeseen'; item: Unforeseen }
  | { type: 'payment'; item: Payment | null }
  | { type: 'delete-payment'; item: Payment }
  | { type: 'admin'; item: AdminItem | null }
  | { type: 'delete-admin'; item: AdminItem }
  | null;

export function Finance({
  project,
  onAddUnforeseen,
  onUpdateUnforeseen,
  onDeleteUnforeseen,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
}: FinanceProps) {
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const labelOf = (m: Modal) => {
    if (m?.type === 'unforeseen' || m?.type === 'delete-unforeseen') return 'imprevisto';
    if (m?.type === 'payment' || m?.type === 'delete-payment') return 'pagamento';
    if (m?.type === 'admin' || m?.type === 'delete-admin') return 'item';
    return '';
  };

  async function handleSaveUnforeseen(data: UnforeseenFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'unforeseen' && modal.item) await onUpdateUnforeseen(modal.item.id, data);
      else await onAddUnforeseen(data);
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
  }

  async function handleSavePayment(data: PaymentFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'payment' && modal.item) await onUpdatePayment(modal.item.id, data);
      else await onAddPayment(data);
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
  }

  async function handleSaveAdmin(data: AdminFormData) {
    setSaving(true);
    try {
      if (modal?.type === 'admin' && modal.item) await onUpdateAdmin(modal.item.id, data);
      else await onAddAdmin(data);
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!modal) return;
    setDeleting(true);
    try {
      if (modal.type === 'delete-unforeseen') await onDeleteUnforeseen(modal.item.id);
      else if (modal.type === 'delete-payment') await onDeletePayment(modal.item.id);
      else if (modal.type === 'delete-admin') await onDeleteAdmin(modal.item.id);
      setModal(null);
    } catch { /* toast shown by wrap */ }
    finally { setDeleting(false); }
  }

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Financeiro</h1>
          <p>Orçamento, pagamentos, imprevistos e comparativo por categoria</p>
        </div>
        <button className="btn" onClick={() => setModal({ type: 'payment', item: null })}>
          + Registrar pagamento
        </button>
      </div>

      <FinanceKpis project={project} />

      <div className="finance-grid">
        <CategoryComparison project={project} />
        <div>
          <div className="finance-panel-head">
            <h3>Imprevistos</h3>
            <button className="btn secondary" onClick={() => setModal({ type: 'unforeseen', item: null })}>+ Registrar</button>
          </div>
          <UnforeseenTable
            project={project}
            onEdit={(item) => setModal({ type: 'unforeseen', item })}
            onDelete={(item) => setModal({ type: 'delete-unforeseen', item })}
          />
        </div>
      </div>

      <div className="card section" style={{ marginTop: 14 }}>
        <div className="finance-panel-head">
          <h3>Histórico e próximos pagamentos</h3>
          <button className="btn secondary" onClick={() => setModal({ type: 'payment', item: null })}>+ Pagamento</button>
        </div>
        <PaymentsTable
          project={project}
          onEdit={(item) => setModal({ type: 'payment', item })}
          onDelete={(item) => setModal({ type: 'delete-payment', item })}
        />
      </div>

      <div className="card section" style={{ marginTop: 14 }}>
        <div className="finance-panel-head">
          <div>
            <h3>Administrativo separado da obra</h3>
            <span className="hint">CNPJ, contador, certificado e taxas.</span>
          </div>
          <button className="btn secondary" onClick={() => setModal({ type: 'admin', item: null })}>+ Adicionar item</button>
        </div>
        <AdminTable
          project={project}
          onEdit={(item) => setModal({ type: 'admin', item })}
          onDelete={(item) => setModal({ type: 'delete-admin', item })}
        />
      </div>

      {modal?.type === 'unforeseen' && (
        <UnforeseenForm
          unforeseen={modal.item}
          onSave={handleSaveUnforeseen}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.type === 'payment' && (
        <PaymentForm
          payment={modal.item}
          onSave={handleSavePayment}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.type === 'admin' && (
        <AdminForm
          item={modal.item}
          onSave={handleSaveAdmin}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.type.startsWith('delete-') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir {labelOf(modal)}</h2>
            <p>Confirma a exclusão deste registro?</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn danger" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

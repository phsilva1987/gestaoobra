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
  onAddUnforeseen: (data: UnforeseenFormData) => void;
  onUpdateUnforeseen: (id: string, data: UnforeseenFormData) => void;
  onDeleteUnforeseen: (id: string) => void;
  onAddPayment: (data: PaymentFormData) => void;
  onUpdatePayment: (id: string, data: PaymentFormData) => void;
  onDeletePayment: (id: string) => void;
  onAddAdmin: (data: AdminFormData) => void;
  onUpdateAdmin: (id: string, data: AdminFormData) => void;
  onDeleteAdmin: (id: string) => void;
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

  const labelOf = (m: Modal) => {
    if (m?.type === 'unforeseen' || m?.type === 'delete-unforeseen') return 'imprevisto';
    if (m?.type === 'payment' || m?.type === 'delete-payment') return 'pagamento';
    if (m?.type === 'admin' || m?.type === 'delete-admin') return 'item';
    return '';
  };

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

      <div className="grid two">
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
          onSave={(data) => {
            if (modal.item) onUpdateUnforeseen(modal.item.id, data);
            else onAddUnforeseen(data);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === 'payment' && (
        <PaymentForm
          payment={modal.item}
          onSave={(data) => {
            if (modal.item) onUpdatePayment(modal.item.id, data);
            else onAddPayment(data);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === 'admin' && (
        <AdminForm
          item={modal.item}
          onSave={(data) => {
            if (modal.item) onUpdateAdmin(modal.item.id, data);
            else onAddAdmin(data);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type.startsWith('delete-') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modalbox" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir {labelOf(modal)}</h2>
            <p>Confirma a exclusão deste registro?</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button
                className="btn danger"
                onClick={() => {
                  if (modal.type === 'delete-unforeseen') onDeleteUnforeseen(modal.item.id);
                  else if (modal.type === 'delete-payment') onDeletePayment(modal.item.id);
                  else if (modal.type === 'delete-admin') onDeleteAdmin(modal.item.id);
                  setModal(null);
                }}
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

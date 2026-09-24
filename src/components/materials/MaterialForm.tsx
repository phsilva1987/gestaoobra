import { useState, useEffect } from 'react';
import type { Material, ProjectData, Supplier, Commitment } from '../../types';
import { SupplierSelect } from '../suppliers/SupplierSelect';
import type { SupplierFormData } from '../suppliers/SupplierForm';
import { CurrencyInput } from '../CurrencyInput';
import { totalPaidForEntity } from '../../services/commitmentService';
import { money } from '../../lib/format';

const UNIDADES = ['un', 'm²', 'm', 'kg', 'L', 'caixa', 'pacote'];
const STATUS_MATERIAL = ['Pendente', 'Comprado', 'Entregue'];
const CATEGORIAS_MATERIAL_DEFAULT = ['Demolição', 'Alvenaria', 'Elétrica', 'Hidráulica', 'Iluminação', 'Pintura', 'Piso', 'Climatização', 'Banheiros', 'Acabamentos', 'Limpeza', 'Ferragens e fixação', 'Outros'];

export interface MaterialFormData {
  nome: string;
  categoria: string;
  fornecedorId: string;
  quantidade: number;
  unidade: string;
  unitario: number;
  data: string;
  status: string;
  etapa_id: string;
}

interface MaterialFormProps {
  material: Material | null;
  project: ProjectData;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
  onSave: (data: MaterialFormData) => Promise<void> | void;
  onCancel: () => void;
  onPay: (commitment: Commitment) => void;
  saving?: boolean;
}

export function MaterialForm({ material, project, onAddSupplier, onSave, onCancel, onPay, saving = false }: MaterialFormProps) {
  const categorias = [...new Set([...(project.categoriasMaterial || CATEGORIAS_MATERIAL_DEFAULT), ...(project.categoriasMaterialExtra || [])])];

  const [form, setForm] = useState<MaterialFormData>({
    nome: material?.nome || '',
    categoria: material?.categoria || categorias[0] || '',
    fornecedorId: material?.fornecedorId || '',
    quantidade: material?.quantidade || 1,
    unidade: material?.unidade || 'un',
    unitario: material?.unitario || 0,
    data: material?.data || '',
    status: material?.status || 'Pendente',
    etapa_id: material?.etapa_id || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (material) {
      setForm({
        nome: material.nome,
        categoria: material.categoria,
        fornecedorId: material.fornecedorId,
        quantidade: material.quantidade,
        unidade: material.unidade,
        unitario: material.unitario,
        data: material.data,
        status: material.status,
        etapa_id: material.etapa_id,
      });
    }
  }, [material]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome do item.';
    if (!form.etapa_id) e.etapa_id = 'Selecione a etapa vinculada.';
    if (form.quantidade < 0) e.quantidade = 'Quantidade não pode ser negativa.';
    if (form.unitario < 0) e.unitario = 'Valor unitário não pode ser negativo.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave({ ...form, nome: form.nome.trim() });
  }

  const total = form.quantidade * form.unitario;
  const pago = material ? totalPaidForEntity(project.pagamentos, 'MATERIAL', material.id) : 0;
  const saldo = Math.max(0, total - pago);

  function handlePay() {
    if (!material) return;
    const stage = project.obra.find((s) => s.id === material.etapa_id);
    onPay({
      id: `MATERIAL:${material.id}`,
      sourceType: 'MATERIAL',
      sourceId: material.id,
      referencia: material.nome,
      stageId: material.etapa_id,
      stageName: stage?.nome || '—',
      contratado: total,
      pago,
      saldo,
      status: pago >= total && total > 0 ? 'Pago' : pago > 0 ? 'Parcial' : 'Pendente',
      vencimento: material.data || '',
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox modalbox-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{material ? 'Editar material' : 'Novo material'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field full">
              <label>Nome do item *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
              {errors.nome && <span className="field-error">{errors.nome}</span>}
            </div>
            <div className="form-field">
              <label>Categoria</label>
              <input
                type="text"
                list="categorias-material-list"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
              <datalist id="categorias-material-list">
                {categorias.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="form-field">
              <label>Quantidade</label>
              <input type="number" min={0} step="0.01" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: +e.target.value || 0 })} />
              {errors.quantidade && <span className="field-error">{errors.quantidade}</span>}
            </div>
            <div className="form-field">
              <label>Unidade</label>
              <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Valor unitário (R$)</label>
              <CurrencyInput value={form.unitario} onChange={(v) => setForm({ ...form, unitario: v })} />
              {errors.unitario && <span className="field-error">{errors.unitario}</span>}
            </div>
            <div className="form-field">
              <label>Data da compra</label>
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_MATERIAL.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field full">
              <label>Etapa vinculada *</label>
              <select value={form.etapa_id} onChange={(e) => setForm({ ...form, etapa_id: e.target.value })}>
                <option value="">Selecione a etapa…</option>
                {project.obra.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              {errors.etapa_id && <span className="field-error">{errors.etapa_id}</span>}
            </div>
          </div>

          {material && (
            <div className="entity-finance-summary">
              <div className="entity-finance-item">
                <small>Total</small>
                <strong>{money(total)}</strong>
              </div>
              <div className="entity-finance-item">
                <small>Pago</small>
                <strong>{money(pago)}</strong>
              </div>
              <div className="entity-finance-item">
                <small>Saldo</small>
                <strong>{money(saldo)}</strong>
              </div>
              {saldo > 0 && (
                <button type="button" className="btn secondary" onClick={handlePay}>Registrar pagamento</button>
              )}
            </div>
          )}

          <SupplierSelect
            value={form.fornecedorId}
            onChange={(fornecedorId) => setForm({ ...form, fornecedorId })}
            project={project}
            onAddSupplier={onAddSupplier}
          />
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import type { Material, ProjectData, Supplier } from '../../types';
import { SupplierSelect } from '../suppliers/SupplierSelect';
import type { SupplierFormData } from '../suppliers/SupplierForm';

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
  pago: number;
  data: string;
  status: string;
  etapa_id: string;
}

interface MaterialFormProps {
  material: Material | null;
  project: ProjectData;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
  onSave: (data: MaterialFormData) => void;
  onCancel: () => void;
}

export function MaterialForm({ material, project, onAddSupplier, onSave, onCancel }: MaterialFormProps) {
  const categorias = [...new Set([...(project.categoriasMaterial || CATEGORIAS_MATERIAL_DEFAULT), ...(project.categoriasMaterialExtra || [])])];

  const [form, setForm] = useState<MaterialFormData>({
    nome: material?.nome || '',
    categoria: material?.categoria || categorias[0] || '',
    fornecedorId: material?.fornecedorId || '',
    quantidade: material?.quantidade || 1,
    unidade: material?.unidade || 'un',
    unitario: material?.unitario || 0,
    pago: material?.pago || 0,
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
        pago: material.pago,
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
    if (form.pago < 0) e.pago = 'Pago não pode ser negativo.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave({ ...form, nome: form.nome.trim() });
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
              <input type="number" min={0} step="0.01" value={form.unitario} onChange={(e) => setForm({ ...form, unitario: +e.target.value || 0 })} />
              {errors.unitario && <span className="field-error">{errors.unitario}</span>}
            </div>
            <div className="form-field">
              <label>Valor pago (R$)</label>
              <input type="number" min={0} step="0.01" value={form.pago} onChange={(e) => setForm({ ...form, pago: +e.target.value || 0 })} />
              {errors.pago && <span className="field-error">{errors.pago}</span>}
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
          <SupplierSelect
            value={form.fornecedorId}
            onChange={(fornecedorId) => setForm({ ...form, fornecedorId })}
            project={project}
            onAddSupplier={onAddSupplier}
          />
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

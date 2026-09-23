import { useState, useEffect } from 'react';
import type { Equipment, ProjectData, Supplier } from '../../types';
import { SupplierSelect } from '../suppliers/SupplierSelect';
import type { SupplierFormData } from '../suppliers/SupplierForm';
import { CurrencyInput } from '../CurrencyInput';

const FORMAS_PAGAMENTO = ['Pix', 'Cartão', 'Em Dinheiro'];
const PARCELAS_OPTS = ['1x', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x', '11x', '12x'];
const STATUS_EQUIPAMENTO = ['Comprado', 'Aguardando entrega', 'Entregue', 'Montado'];

export interface EquipmentFormData {
  nome: string;
  quantidade: number;
  valor: number;
  fornecedorId: string;
  forma: string;
  chavePix: string;
  parcelas: string;
  compra: string;
  entrega: string;
  status: string;
  etapa_id: string;
}

interface EquipmentFormProps {
  equipment: Equipment | null;
  project: ProjectData;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
  onSave: (data: EquipmentFormData) => Promise<void> | void;
  onCancel: () => void;
  saving?: boolean;
}

export function EquipmentForm({ equipment, project, onAddSupplier, onSave, onCancel, saving = false }: EquipmentFormProps) {
  const [form, setForm] = useState<EquipmentFormData>({
    nome: equipment?.nome || '',
    quantidade: equipment?.quantidade || 1,
    valor: equipment?.valor || 0,
    fornecedorId: equipment?.fornecedorId || '',
    forma: equipment?.forma || 'Pix',
    chavePix: equipment?.chavePix || '',
    parcelas: equipment?.parcelas || '1x',
    compra: equipment?.compra || '',
    entrega: equipment?.entrega || '',
    status: equipment?.status || 'Comprado',
    etapa_id: equipment?.etapa_id || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment) {
      setForm({
        nome: equipment.nome,
        quantidade: equipment.quantidade,
        valor: equipment.valor,
        fornecedorId: equipment.fornecedorId,
        forma: equipment.forma,
        chavePix: equipment.chavePix,
        parcelas: equipment.parcelas,
        compra: equipment.compra,
        entrega: equipment.entrega,
        status: equipment.status,
        etapa_id: equipment.etapa_id,
      });
    }
  }, [equipment]);

  function handleFormaChange(forma: string) {
    setForm((f) => ({
      ...f,
      forma,
      chavePix: forma === 'Pix' ? f.chavePix : '',
      parcelas: forma === 'Cartão' ? f.parcelas : '1x',
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome do aparelho.';
    if (!form.etapa_id) e.etapa_id = 'Selecione a etapa vinculada.';
    if (form.valor < 0) e.valor = 'Valor não pode ser negativo.';
    if (form.compra && form.entrega && form.entrega < form.compra)
      e.entrega = 'A data de entrega não pode ser anterior à data de compra.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave({ ...form, nome: form.nome.trim() });
  }

  const valorParcela =
    form.forma === 'Cartão' && form.valor > 0
      ? form.valor / (parseInt(form.parcelas) || 1)
      : null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox modalbox-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{equipment ? 'Editar equipamento' : 'Novo equipamento'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Nome do aparelho *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
              {errors.nome && <span className="field-error">{errors.nome}</span>}
            </div>
            <div className="form-field">
              <label>Quantidade</label>
              <input type="number" min={0} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: +e.target.value || 0 })} />
            </div>
            <div className="form-field">
              <label>Valor total (R$)</label>
              <CurrencyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
              {errors.valor && <span className="field-error">{errors.valor}</span>}
            </div>
            <div className="form-field">
              <label>Forma de pagamento</label>
              <select value={form.forma} onChange={(e) => handleFormaChange(e.target.value)}>
                {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {form.forma === 'Pix' && (
              <div className="form-field full">
                <label>Chave Pix</label>
                <input type="text" value={form.chavePix} onChange={(e) => setForm({ ...form, chavePix: e.target.value })} />
              </div>
            )}
            {form.forma === 'Cartão' && (
              <>
                <div className="form-field">
                  <label>Parcelamento</label>
                  <select value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: e.target.value })}>
                    {PARCELAS_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {valorParcela !== null && (
                  <div className="form-field">
                    <label>Valor da parcela</label>
                    <input type="text" value={valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} readOnly />
                  </div>
                )}
              </>
            )}
            <div className="form-field">
              <label>Data de compra</label>
              <input type="date" value={form.compra} onChange={(e) => setForm({ ...form, compra: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Data de entrega</label>
              <input type="date" value={form.entrega} onChange={(e) => setForm({ ...form, entrega: e.target.value })} />
              {errors.entrega && <span className="field-error">{errors.entrega}</span>}
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_EQUIPAMENTO.map((s) => <option key={s} value={s}>{s}</option>)}
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
            <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

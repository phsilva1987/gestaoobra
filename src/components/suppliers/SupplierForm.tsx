import { useState, useEffect } from 'react';
import type { Supplier } from '../../types';

export interface SupplierFormData {
  nome: string;
  telefone: string;
  email: string;
  site: string;
}

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSave: (data: SupplierFormData) => Supplier | Promise<Supplier>;
  onCancel: () => void;
}

export function SupplierForm({ supplier, onSave, onCancel }: SupplierFormProps) {
  const [form, setForm] = useState<SupplierFormData>({
    nome: supplier?.nome || '',
    telefone: supplier?.telefone || '',
    email: supplier?.email || '',
    site: supplier?.site || '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplier) {
      setForm({
        nome: supplier.nome,
        telefone: supplier.telefone,
        email: supplier.email,
        site: supplier.site,
      });
    }
  }, [supplier]);

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.nome.trim()) {
      setError('Informe o nome do fornecedor.');
      return;
    }
    onSave({ ...form, nome: form.nome.trim() });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox modalbox-sm" onClick={(e) => e.stopPropagation()}>
        <h2>{supplier ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field full">
              <label>Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                autoFocus
              />
              {error && <span className="field-error">{error}</span>}
            </div>
            <div className="form-field">
              <label>Telefone</label>
              <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="form-field">
              <label>E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-field full">
              <label>Site / Instagram</label>
              <input type="text" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

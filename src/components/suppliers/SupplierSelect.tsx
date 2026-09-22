import { useState } from 'react';
import type { Supplier, ProjectData } from '../../types';
import { SupplierForm, type SupplierFormData } from './SupplierForm';

interface SupplierSelectProps {
  value: string;
  onChange: (fornecedorId: string) => void;
  project: ProjectData;
  onAddSupplier: (data: SupplierFormData) => Supplier | Promise<Supplier>;
}

export function SupplierSelect({ value, onChange, project, onAddSupplier }: SupplierSelectProps) {
  const [showForm, setShowForm] = useState(false);

  function handleSave(data: SupplierFormData): Promise<Supplier> {
    const result = onAddSupplier(data);
    if (result instanceof Promise) {
      return result.then((newSupplier) => {
        onChange(newSupplier.id);
        setShowForm(false);
        return newSupplier;
      });
    }
    onChange(result.id);
    setShowForm(false);
    return Promise.resolve(result);
  }

  return (
    <div className="form-field full">
      <label>Fornecedor</label>
      <div className="supplier-select-row">
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1 }}>
          <option value="">Selecione o fornecedor…</option>
          {project.fornecedores.map((f) => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>
        <button type="button" className="btn secondary" onClick={() => setShowForm(true)}>+ Novo</button>
      </div>
      {showForm && (
        <SupplierForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

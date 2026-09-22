import { useState } from 'react';
import type { Supplier, ProjectData } from '../../types';
import { SupplierForm, type SupplierFormData } from '../suppliers/SupplierForm';

interface SupplierManagerProps {
  project: ProjectData;
  onAdd: (data: SupplierFormData) => Supplier;
  onUpdate: (id: string, data: SupplierFormData) => void;
  onDelete: (id: string) => void;
}

export function SupplierManager({ project, onAdd, onUpdate, onDelete }: SupplierManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  function handleSave(data: SupplierFormData): Supplier {
    let result: Supplier;
    if (editing) {
      onUpdate(editing.id, data);
      result = { ...editing, ...data };
    } else {
      result = onAdd(data);
    }
    setShowForm(false);
    setEditing(null);
    return result;
  }

  function handleDelete() {
    if (!deleting) return;
    onDelete(deleting.id);
    setDeleting(null);
  }

  const matCount = project.materiais.filter((m) => m.fornecedorId === deleting?.id).length;
  const eqCount = project.equipamentos.filter((e) => e.fornecedorId === deleting?.id).length;

  return (
    <>
      <h3 className="config-v19-title" style={{ margin: '26px 0 4px' }}>Fornecedores</h3>
      <div className="card section">
        <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span className="hint">Cadastro usado nos campos "Fornecedor" de Materiais e Equipamentos.</span>
          <button className="btn" onClick={() => { setEditing(null); setShowForm(true); }}>+ Adicionar fornecedor</button>
        </div>
        <div className="stage-table-scroll">
          <table>
            <thead>
              <tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Site / Instagram</th><th></th></tr>
            </thead>
            <tbody>
              {project.fornecedores.length ? (
                project.fornecedores.map((f) => (
                  <tr key={f.id}>
                    <td><b>{f.nome}</b></td>
                    <td>{f.telefone || '—'}</td>
                    <td>{f.email || '—'}</td>
                    <td>{f.site || '—'}</td>
                    <td className="rowactions">
                      <button onClick={() => { setEditing(f); setShowForm(true); }}>Editar</button>
                      <button onClick={() => setDeleting(f)}>Excluir</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="empty">Nenhum fornecedor cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <SupplierForm
          supplier={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="modalbox modalbox-sm" onClick={(e) => e.stopPropagation()}>
            <h2>Excluir fornecedor</h2>
            {matCount > 0 || eqCount > 0 ? (
              <p>
                Este fornecedor possui {matCount} material(is) e {eqCount} equipamento(s) vinculados.
                Troque o fornecedor desses registros antes de excluir.
              </p>
            ) : (
              <p>Confirma a exclusão de "{deleting.nome}"?</p>
            )}
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setDeleting(null)}>
                {matCount > 0 || eqCount > 0 ? 'Entendi' : 'Cancelar'}
              </button>
              {matCount === 0 && eqCount === 0 && (
                <button className="btn danger" onClick={handleDelete}>Excluir</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import type { ProjectData } from '../../types';

type Kind = 'obra' | 'material';

interface CategoryManagerProps {
  project: ProjectData;
  onAdd: (kind: Kind, name: string) => void;
  onRemove: (kind: Kind, name: string) => void;
}

function CategoryChips({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (name: string) => void;
}) {
  if (!items.length) {
    return <span className="hint">Nenhuma categoria.</span>;
  }
  return (
    <div className="config-v19-chips">
      {items.map((c) => (
        <span key={c} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '3px 5px 3px 0' }}>
          {c}
          <button
            type="button"
            onClick={() => onRemove(c)}
            style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontWeight: 700 }}
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}

export function CategoryManager({ project, onAdd, onRemove }: CategoryManagerProps) {
  const [obraInput, setObraInput] = useState('');
  const [matInput, setMatInput] = useState('');

  function handleAdd(kind: Kind, value: string, reset: () => void) {
    const v = value.trim();
    if (!v) return;
    onAdd(kind, v);
    reset();
  }

  return (
    <>
      <h3 className="config-v19-title" style={{ margin: '26px 0 4px' }}>Categorias</h3>
      <p className="hint" style={{ marginTop: 0 }}>
        Base geral, disponível em todos os projetos. Cada projeto também pode ter categorias só dele (adicionadas direto no formulário de Obra/Materiais).
      </p>
      <div className="grid two config-v19-grid">
        <div className="card section config-v19-card">
          <h3 style={{ marginTop: 0 }}>Categorias de Obra</h3>
          <CategoryChips items={project.categoriasObra} onRemove={(name) => onRemove('obra', name)} />
          {project.categoriasObraExtra.length > 0 && (
            <>
              <div className="hint" style={{ margin: '12px 0 4px', fontWeight: 600 }}>Só deste projeto:</div>
              <CategoryChips items={project.categoriasObraExtra} onRemove={(name) => onRemove('obra', name)} />
            </>
          )}
          <div className="config-v19-add" style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'stretch' }}>
            <input
              type="text"
              placeholder="Nova categoria"
              value={obraInput}
              onChange={(e) => setObraInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd('obra', obraInput, () => setObraInput('')); } }}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className="btn secondary" onClick={() => handleAdd('obra', obraInput, () => setObraInput(''))}>+ Adicionar</button>
          </div>
        </div>
        <div className="card section config-v19-card">
          <h3 style={{ marginTop: 0 }}>Categorias de Materiais</h3>
          <CategoryChips items={project.categoriasMaterial} onRemove={(name) => onRemove('material', name)} />
          {project.categoriasMaterialExtra.length > 0 && (
            <>
              <div className="hint" style={{ margin: '12px 0 4px', fontWeight: 600 }}>Só deste projeto:</div>
              <CategoryChips items={project.categoriasMaterialExtra} onRemove={(name) => onRemove('material', name)} />
            </>
          )}
          <div className="config-v19-add" style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'stretch' }}>
            <input
              type="text"
              placeholder="Nova categoria"
              value={matInput}
              onChange={(e) => setMatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd('material', matInput, () => setMatInput('')); } }}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className="btn secondary" onClick={() => handleAdd('material', matInput, () => setMatInput(''))}>+ Adicionar</button>
          </div>
        </div>
      </div>
    </>
  );
}

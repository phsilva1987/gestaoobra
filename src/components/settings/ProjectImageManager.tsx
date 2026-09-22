import { useRef, useState } from 'react';
import type { ProjectData } from '../../types';
import { ALLOWED_TYPES, MAX_SIZE } from '../../services/storageService';
import { friendlyError } from '../../lib/errors';

interface ProjectImageManagerProps {
  project: ProjectData;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  isAdmin: boolean;
}

export function ProjectImageManager({ project, onImageChange, onImageRemove, isAdmin }: ProjectImageManagerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG ou WebP.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('A imagem excede o tamanho permitido (5 MB).');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      await onImageChange(file);
    } catch (err) {
      setError(friendlyError(err, 'Não foi possível enviar a imagem.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      await onImageRemove();
    } catch (err) {
      setError(friendlyError(err, 'Não foi possível remover a imagem.'));
    } finally {
      setUploading(false);
    }
  }

  // Signed URLs already carry their own query string; do not append a cache buster.
  const coverUrl = project.coverImage;

  return (
    <div className="card section">
      <h3 style={{ marginTop: 0 }}>Imagem do projeto</h3>
      <div className="project-cover-preview">
        {project.coverImage ? (
          <img src={coverUrl} alt={`Imagem do projeto ${project.nome}`} />
        ) : (
          <span>Nenhuma imagem selecionada</span>
        )}
      </div>
      <div className="project-cover-actions" style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {isAdmin && (
          <>
            <label className="btn secondary" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Enviando imagem...' : 'Selecionar imagem'}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            {project.coverImage && (
              <button type="button" className="btn secondary" onClick={handleRemove} disabled={uploading}>
                Remover imagem
              </button>
            )}
          </>
        )}
        {!isAdmin && (
          <span className="hint">Apenas administradores podem alterar a imagem.</span>
        )}
      </div>
      <div className="hint" style={{ marginTop: 8 }}>
        JPG, PNG ou WebP · até 5 MB · a imagem é otimizada automaticamente.
      </div>
      <div className="hint" style={{ marginTop: 4 }}>
        A imagem fica vinculada somente a este projeto e muda automaticamente ao trocar de projeto.
      </div>
      {error && <span className="field-error" style={{ display: 'block', marginTop: 8 }}>{error}</span>}
    </div>
  );
}

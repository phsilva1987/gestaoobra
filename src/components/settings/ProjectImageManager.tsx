import { useRef, useState } from 'react';
import type { ProjectData } from '../../types';

interface ProjectImageManagerProps {
  project: ProjectData;
  onImageChange: (base64: string) => void;
}

function resizeImage(file: File, maxDim = 1600, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function ProjectImageManager({ project, onImageChange }: ProjectImageManagerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImage(file);
      onImageChange(base64);
      setError('');
    } catch (err) {
      setError((err as Error).message || 'Erro ao processar a imagem.');
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="card section">
      <h3 style={{ marginTop: 0 }}>Imagem do projeto</h3>
      <div className="project-cover-preview">
        {project.coverImage ? (
          <img src={project.coverImage} alt={`Imagem do projeto ${project.nome}`} />
        ) : (
          <span>Nenhuma imagem selecionada</span>
        )}
      </div>
      <div className="project-cover-actions" style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label className="btn secondary" style={{ cursor: 'pointer' }}>
          Selecionar imagem
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </label>
        {project.coverImage && (
          <button type="button" className="btn secondary" onClick={() => onImageChange('')}>
            Remover imagem
          </button>
        )}
      </div>
      <div className="hint" style={{ marginTop: 8 }}>
        JPG, PNG ou WebP · a imagem será otimizada automaticamente.
      </div>
      <div className="hint" style={{ marginTop: 4 }}>
        A imagem fica vinculada somente a este projeto e muda automaticamente ao trocar de projeto.
      </div>
      {error && <span className="field-error" style={{ display: 'block', marginTop: 8 }}>{error}</span>}
    </div>
  );
}

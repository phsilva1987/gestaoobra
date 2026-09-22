import { supabase } from '../lib/supabase';

const BUCKET = 'project-images';
const MAX_SIZE = 5_000_000;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getFilePath(projectId: string): string {
  return `${projectId}/cover.webp`;
}

const SIGNED_URL_TTL = 21600; // 6h

export async function getProjectImageUrl(_projectId: string, coverPath: string): Promise<string> {
  if (!coverPath) return '';
  if (coverPath.startsWith('http') || coverPath.startsWith('/') || coverPath.startsWith('data:')) {
    return coverPath;
  }
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(coverPath, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
}

export function isStoragePath(path: string): boolean {
  return !!path && !path.startsWith('http') && !path.startsWith('/') && !path.startsWith('data:');
}

export function resizeImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Formato de imagem não suportado.'));
      return;
    }
    if (file.size > MAX_SIZE) {
      reject(new Error('A imagem excede o tamanho permitido (5 MB).'));
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
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Não foi possível processar a imagem.'));
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadProjectImage(projectId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato de imagem não suportado. Use JPG, PNG ou WebP.');
  }
  const blob = await resizeImage(file);
  const path = getFilePath(projectId);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (error) throw error;
  return path;
}

export async function removeProjectImage(projectId: string): Promise<void> {
  const path = getFilePath(projectId);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error && !error.message.includes('not found')) throw error;
}

export { BUCKET, ALLOWED_TYPES, MAX_SIZE };

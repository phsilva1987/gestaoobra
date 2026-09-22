import type { ProjectData } from '../types';
import { mockProjects } from './mockData';

export type { ProjectData };

export function getProjectOptions(): { id: string; nome: string; tipo: string }[] {
  return mockProjects.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo }));
}

export { mockProjects };

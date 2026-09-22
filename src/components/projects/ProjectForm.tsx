import { useState, useEffect, useRef } from 'react';
import type { ProjectData, ProjectConfig } from '../../types';

const TIPOS = ['Studio / Comercial', 'Apartamento', 'Casa', 'Loja', 'Escritório', 'Residencial', 'Outro'];
const STATUS = ['Planejamento', 'Em andamento', 'Pausada', 'Concluída', 'Cancelada'];

export interface ProjectFormData {
  nome: string;
  tipo: string;
  status: string;
  coverImage: string;
  config: ProjectConfig;
}

interface ProjectFormProps {
  project: ProjectData | null;
  onSave: (data: ProjectFormData) => void;
  onCancel: () => void;
  saving?: boolean;
}

function emptyConfig(): ProjectConfig {
  return {
    empresa: '', projeto: '', documento: '', responsavel: '',
    telefone: '', email: '', endereco: '', cidade: '',
    respObra: '', orcamento: 0, inicio: '', fim: '',
  };
}

export function ProjectForm({ project, onSave, onCancel, saving = false }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>({
    nome: project?.nome || '',
    tipo: project?.tipo || 'Apartamento',
    status: project?.status || 'Planejamento',
    coverImage: project?.coverImage || '',
    config: project ? { ...project.config } : emptyConfig(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      setForm({
        nome: project.nome,
        tipo: project.tipo,
        status: project.status,
        coverImage: project.coverImage,
        config: { ...project.config },
      });
    }
  }, [project]);

  function setCfg<K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  }

  function handleImageFile(file: File) {
    if (file.size > 2_000_000) {
      setErrors((e) => ({ ...e, coverImage: 'A imagem deve ter no máximo 2 MB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, coverImage: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome do projeto.';
    if (form.config.orcamento < 0) e.orcamento = 'Orçamento não pode ser negativo.';
    if (form.config.inicio && form.config.fim && form.config.fim < form.config.inicio)
      e.fim = 'A data final não pode ser anterior à data de início.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      nome: form.nome.trim(),
      config: { ...form.config, projeto: form.nome.trim() },
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox modalbox-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{project ? 'Editar projeto' : 'Novo projeto'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Nome do projeto *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
              {errors.nome && <span className="field-error">{errors.nome}</span>}
            </div>
            <div className="form-field">
              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Cliente / Empresa / Proprietário</label>
              <input type="text" value={form.config.empresa} onChange={(e) => setCfg('empresa', e.target.value)} />
            </div>
            <div className="form-field">
              <label>CNPJ / CPF</label>
              <input type="text" value={form.config.documento} onChange={(e) => setCfg('documento', e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div className="form-field">
              <label>Responsável</label>
              <input type="text" value={form.config.responsavel} onChange={(e) => setCfg('responsavel', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Responsável pela obra</label>
              <input type="text" value={form.config.respObra} onChange={(e) => setCfg('respObra', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Telefone / WhatsApp</label>
              <input type="text" value={form.config.telefone} onChange={(e) => setCfg('telefone', e.target.value)} placeholder="(13) 99999-9999" />
            </div>
            <div className="form-field">
              <label>E-mail</label>
              <input type="email" value={form.config.email} onChange={(e) => setCfg('email', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Cidade / UF</label>
              <input type="text" value={form.config.cidade} onChange={(e) => setCfg('cidade', e.target.value)} />
            </div>
            <div className="form-field full">
              <label>Endereço da obra</label>
              <input type="text" value={form.config.endereco} onChange={(e) => setCfg('endereco', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Orçamento total (R$)</label>
              <input type="number" min={0} step="0.01" value={form.config.orcamento} onChange={(e) => setCfg('orcamento', +e.target.value || 0)} />
              {errors.orcamento && <span className="field-error">{errors.orcamento}</span>}
            </div>
            <div className="form-field">
              <label>Data de início</label>
              <input type="date" value={form.config.inicio} onChange={(e) => setCfg('inicio', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Previsão de término</label>
              <input type="date" value={form.config.fim} onChange={(e) => setCfg('fim', e.target.value)} />
              {errors.fim && <span className="field-error">{errors.fim}</span>}
            </div>
            <div className="form-field full">
              <label>Imagem do projeto</label>
              <div className="project-cover-actions">
                {form.coverImage && (
                  <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={form.coverImage} alt="Prévia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <button type="button" className="btn secondary" onClick={() => fileRef.current?.click()}>
                  {form.coverImage ? 'Trocar imagem' : 'Selecionar imagem'}
                </button>
                {form.coverImage && (
                  <button type="button" className="btn secondary" onClick={() => setForm((f) => ({ ...f, coverImage: '' }))}>
                    Remover
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                />
              </div>
              {errors.coverImage && <span className="field-error">{errors.coverImage}</span>}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn" disabled={saving}>{project ? (saving ? 'Salvando...' : 'Salvar alterações') : (saving ? 'Criando...' : 'Criar projeto')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

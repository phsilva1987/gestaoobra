import { useState, useEffect } from 'react';
import type { ProjectData, ProjectConfig } from '../../types';

const TIPOS = ['Studio / Comercial', 'Apartamento', 'Casa', 'Loja', 'Escritório', 'Residencial', 'Outro'];
const STATUS = ['Planejamento', 'Em andamento', 'Pausada', 'Concluída', 'Cancelada'];

export interface ProjectSettingsFormData {
  nome: string;
  tipo: string;
  status: string;
  config: ProjectConfig;
}

interface ProjectSettingsFormProps {
  project: ProjectData;
  onSave: (data: ProjectSettingsFormData) => void;
}

export function ProjectSettingsForm({ project, onSave }: ProjectSettingsFormProps) {
  const [form, setForm] = useState<ProjectSettingsFormData>({
    nome: project.nome,
    tipo: project.tipo,
    status: project.status,
    config: { ...project.config },
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      nome: project.nome,
      tipo: project.tipo,
      status: project.status,
      config: { ...project.config },
    });
  }, [project]);

  function setCfg<K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.nome.trim()) {
      setError('Informe o nome do projeto.');
      return;
    }
    onSave({ ...form, nome: form.nome.trim(), config: { ...form.config, projeto: form.nome.trim() } });
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card section">
      <h3 style={{ marginTop: 0 }}>Identificação da empresa e projeto</h3>
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-grid">
          <div className="form-field">
            <label>Nome do projeto *</label>
            <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
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
            <input type="text" value={form.config.respObra} onChange={(e) => setCfg('respObra', e.target.value)} placeholder="Empreiteiro, arquiteto ou responsável" />
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
        </div>

        <h3 style={{ margin: '24px 0 4px' }}>Parâmetros financeiros e prazo</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Orçamento total (R$)</label>
            <input type="number" min={0} step="0.01" value={form.config.orcamento} onChange={(e) => setCfg('orcamento', +e.target.value || 0)} />
          </div>
          <div className="form-field">
            <label>Data de início</label>
            <input type="date" value={form.config.inicio} onChange={(e) => setCfg('inicio', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Previsão de término</label>
            <input type="date" value={form.config.fim} onChange={(e) => setCfg('fim', e.target.value)} />
          </div>
        </div>

        {error && <span className="field-error">{error}</span>}
        <div className="modal-actions" style={{ marginTop: 16 }}>
          {saved && <span className="hint" style={{ color: 'var(--green)' }}>Salvo com sucesso!</span>}
          <button type="submit" className="btn">Salvar configurações</button>
        </div>
      </form>
    </div>
  );
}

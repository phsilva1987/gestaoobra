import { useState, useEffect } from 'react';
import type { Stage, ProjectData } from '../../types';

const STATUS_OBRA = ['Não iniciado', 'Cotação', 'Contratado', 'Em andamento', 'Bloqueado', 'Concluído'];
const PRIORIDADES = ['Crítica', 'Alta', 'Média', 'Baixa'];

const PROGRESSO_SUGERIDO: Record<string, number | undefined> = {
  'Não iniciado': 0,
  'Cotação': 20,
  'Contratado': 40,
  'Em andamento': 50,
  'Concluído': 100,
};

export interface StageFormData {
  nome: string;
  categoria: string;
  prioridade: string;
  dependencia: string;
  inicio: string;
  fim: string;
  status: string;
  progresso: number;
  observacao: string;
}

interface StageFormProps {
  stage: Stage | null;
  project: ProjectData;
  onSave: (data: StageFormData) => void;
  onCancel: () => void;
}

export function StageForm({ stage, project, onSave, onCancel }: StageFormProps) {
  const categoriasObra = [...new Set([...(project.categoriasObra || []), ...(project.categoriasObraExtra || [])])];
  const [form, setForm] = useState<StageFormData>({
    nome: stage?.nome || '',
    categoria: stage?.categoria || categoriasObra[0] || '',
    prioridade: stage?.prioridade || 'Média',
    dependencia: stage?.dependencia || '',
    inicio: stage?.inicio || '',
    fim: stage?.fim || '',
    status: stage?.status || 'Não iniciado',
    progresso: stage?.progresso || 0,
    observacao: stage?.observacao || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (stage) {
      setForm({
        nome: stage.nome,
        categoria: stage.categoria,
        prioridade: stage.prioridade,
        dependencia: stage.dependencia,
        inicio: stage.inicio,
        fim: stage.fim,
        status: stage.status,
        progresso: stage.progresso,
        observacao: stage.observacao,
      });
    }
  }, [stage]);

  function handleStatusChange(status: string) {
    const sugestao = PROGRESSO_SUGERIDO[status];
    setForm((f) => ({
      ...f,
      status,
      progresso: sugestao !== undefined ? sugestao : f.progresso,
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Informe o nome da etapa.';
    if (form.inicio && form.fim && form.fim < form.inicio)
      e.fim = 'A data de término não pode ser anterior à data de início.';
    if (form.progresso < 0 || form.progresso > 100)
      e.progresso = 'Progresso deve estar entre 0 e 100.';
    if (form.dependencia && form.dependencia === stage?.id)
      e.dependencia = 'A etapa não pode depender dela mesma.';
    if (form.dependencia && !project.obra.some((s) => s.id === form.dependencia))
      e.dependencia = 'A dependência deve ser uma etapa do mesmo projeto.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      nome: form.nome.trim(),
      dependencia: form.dependencia || '',
    });
  }

  const dependenciaOptions = project.obra.filter((s) => s.id !== stage?.id);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <h2>{stage ? 'Editar etapa' : 'Nova etapa'}</h2>
        <form onSubmit={handleSubmit} className="stage-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                autoFocus
              />
              {errors.nome && <span className="field-error">{errors.nome}</span>}
            </div>
            <div className="form-field">
              <label>Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {categoriasObra.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Prioridade</label>
              <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Depende de (etapa anterior)</label>
              <select value={form.dependencia} onChange={(e) => setForm({ ...form, dependencia: e.target.value })}>
                <option value="">Nenhuma</option>
                {dependenciaOptions.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              {errors.dependencia && <span className="field-error">{errors.dependencia}</span>}
            </div>
            <div className="form-field">
              <label>Início</label>
              <input type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Fim previsto</label>
              <input type="date" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} />
              {errors.fim && <span className="field-error">{errors.fim}</span>}
            </div>
            <div className="form-field">
              <label>Situação</label>
              <select value={form.status} onChange={(e) => handleStatusChange(e.target.value)}>
                {STATUS_OBRA.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Progresso (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.progresso}
                onChange={(e) => setForm({ ...form, progresso: +e.target.value || 0 })}
              />
              {errors.progresso && <span className="field-error">{errors.progresso}</span>}
            </div>
            <div className="form-field full">
              <label>Observações</label>
              <textarea
                rows={3}
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              />
            </div>
          </div>
          {stage && (
            <div className="stage-derived-info">
              <div className="mini-note">
                <b>Responsável</b> e <b>custo</b> são derivados automaticamente dos vínculos de profissionais, materiais e equipamentos.
                Gerencie-os em suas respectivas páginas.
              </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import type { ProjectData } from '../../types';
import { downloadBackup, parseBackup, readFileAsText, type RestoreSummary } from '../../lib/backup';

interface BackupSectionProps {
  projects: ProjectData[];
  selectedProjectId: string;
  onRestore: (summary: RestoreSummary) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function BackupSection({ projects, selectedProjectId, onRestore, showToast }: BackupSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<RestoreSummary | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    try {
      downloadBackup(projects, selectedProjectId);
      showToast('Backup exportado com sucesso.', 'success');
    } catch (e) {
      showToast('Não foi possível gerar o backup: ' + (e as Error).message, 'error');
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSummary(null);
    setPendingText(null);
    try {
      const text = await readFileAsText(file);
      const result = parseBackup(text);
      if (!result.ok || !result.summary) {
        setError(result.error || 'Arquivo inválido.');
        showToast(result.error || 'Arquivo inválido.', 'error');
        return;
      }
      setSummary(result.summary);
      setPendingText(text);
    } catch (e) {
      setError((e as Error).message);
      showToast((e as Error).message, 'error');
    }
  };

  const confirmRestore = () => {
    if (!summary || !pendingText) return;
    onRestore(summary);
    setSummary(null);
    setPendingText(null);
    showToast('Backup restaurado com sucesso.', 'success');
  };

  const cancelRestore = () => {
    setSummary(null);
    setPendingText(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <h3 style={{ margin: '26px 0 4px' }}>Backup e restauração</h3>
      <div className="grid two">
        <div className="card section">
          <h3 style={{ marginTop: 0 }}>Baixar backup</h3>
          <p className="hint">Gera um arquivo .json com o estado completo do sistema — todos os projetos cadastrados, serviços da obra, financeiro, materiais, equipamentos, profissionais e configurações.</p>
          <div className="actions" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
            <button className="btn" onClick={handleExport}>Baixar backup (.json)</button>
          </div>
        </div>
        <div className="card section">
          <h3 style={{ marginTop: 0 }}>Restaurar backup</h3>
          <p className="hint">Selecione um arquivo .json exportado por este sistema. <b>Isso substitui todos os dados atuais</b> pelos dados do arquivo — não pode ser desfeito.</p>
          <div className="actions" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
            <button className="btn secondary" onClick={() => fileRef.current?.click()}>Restaurar backup</button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="card section" style={{ marginTop: 14, borderColor: '#d94a3a' }}>
          <p style={{ margin: 0, color: '#d94a3a', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {summary && (
        <div className="card section" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Confirmar restauração</h3>
          <p className="hint">O backup contém <b>{summary.projectCount}</b> projeto(s), <b>{summary.stageCount}</b> etapa(s), <b>{summary.jobCount}</b> trabalho(s), <b>{summary.materialCount}</b> material(is), <b>{summary.equipmentCount}</b> equipamento(s) e <b>{summary.supplierCount}</b> fornecedor(es).</p>
          <p className="hint" style={{ color: '#d94a3a' }}>Restaurar este backup vai SUBSTITUIR todos os dados atuais. Essa ação não pode ser desfeita.</p>
          <div className="actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
            <button className="btn danger" onClick={confirmRestore}>Confirmar restauração</button>
            <button className="btn secondary" onClick={cancelRestore}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="mini-note" style={{ marginTop: 14 }}>
        O backup inclui todos os projetos. Guarde o arquivo em um local seguro.
      </div>
    </>
  );
}

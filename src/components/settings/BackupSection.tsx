import { useRef, useState } from 'react';
import type { ProjectData } from '../../types';
import { downloadBackup, parseBackup, readFileAsText, type RestoreSummary } from '../../lib/backup';
import { restoreBackupToDb, type RestoreResultRow } from '../../services/restoreService';

interface BackupSectionProps {
  projects: ProjectData[];
  selectedProjectId: string;
  onRestored: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function BackupSection({ projects, selectedProjectId, onRestored, showToast }: BackupSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<RestoreSummary | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResults, setRestoreResults] = useState<RestoreResultRow[] | null>(null);

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
    setRestoreResults(null);
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

  const confirmRestore = async () => {
    if (!pendingText) return;
    setRestoring(true);
    try {
      const results = await restoreBackupToDb(pendingText);
      setRestoreResults(results);
      showToast('Backup importado com sucesso.', 'success');
      setSummary(null);
      setPendingText(null);
      await onRestored();
    } catch (e) {
      const msg = (e as Error).message || 'Não foi possível importar o backup.';
      setError('Não foi possível importar o backup. Nenhum dado foi alterado.');
      showToast(msg, 'error');
    } finally {
      setRestoring(false);
    }
  };

  const cancelRestore = () => {
    setSummary(null);
    setPendingText(null);
    setError(null);
    setRestoreResults(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <h3 style={{ margin: '26px 0 4px' }}>Backup e restauração</h3>
      <div className="grid two">
        <div className="card section">
          <h3 style={{ marginTop: 0 }}>Baixar backup</h3>
          <p className="hint">Gera um arquivo .json com o estado completo do sistema — todos os projetos cadastrados, serviços da obra, financeiro, materiais, equipamentos, profissionais e configurações.</p>
          <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
            <button className="btn" onClick={handleExport}>Baixar backup (.json)</button>
          </div>
        </div>
        <div className="card section">
          <h3 style={{ marginTop: 0 }}>Importar backup</h3>
          <p className="hint">Selecione um arquivo .json exportado por este sistema. <b>Os projetos do arquivo serão importados como novos projetos</b> — os dados existentes não são substituídos.</p>
          <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
            <button className="btn secondary" onClick={() => fileRef.current?.click()}>Selecionar arquivo</button>
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
          <h3 style={{ marginTop: 0 }}>Confirmar importação</h3>
          <p className="hint">O backup contém <b>{summary.projectCount}</b> projeto(s), <b>{summary.stageCount}</b> etapa(s), <b>{summary.jobCount}</b> trabalho(s), <b>{summary.materialCount}</b> material(is), <b>{summary.equipmentCount}</b> equipamento(s) e <b>{summary.supplierCount}</b> fornecedor(es).</p>
          <p className="hint">Esta operação irá gravar dados no banco. Os projetos serão importados como novos, com novos IDs. Você se tornará administrador dos projetos importados.</p>
          <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
            <button className="btn" onClick={confirmRestore} disabled={restoring}>
              {restoring ? 'Importando backup...' : 'Importar Backup'}
            </button>
            <button className="btn secondary" onClick={cancelRestore} disabled={restoring}>Cancelar</button>
          </div>
        </div>
      )}

      {restoreResults && (
        <div className="card section" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>Importação concluída</h3>
          {restoreResults.map((r, i) => (
            <p key={i} className="hint" style={{ marginBottom: 4 }}>
              <b>{r.project_name}</b>: {r.records} registros importados.
            </p>
          ))}
          <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
            <button className="btn secondary" onClick={() => setRestoreResults(null)}>Fechar</button>
          </div>
        </div>
      )}

      <div className="mini-note" style={{ marginTop: 14 }}>
        O backup inclui todos os projetos. Guarde o arquivo em um local seguro.
      </div>
    </>
  );
}

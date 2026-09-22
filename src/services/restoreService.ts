import { supabase } from '../lib/supabase';

export interface RestoreResultRow {
  project_name: string;
  records: number;
}

export async function restoreBackupToDb(backupJson: string): Promise<RestoreResultRow[]> {
  const parsed = JSON.parse(backupJson);
  const { data, error } = await supabase.rpc('restore_project_backup', {
    p_backup: parsed,
  });

  if (error) throw error;
  return (data || []) as RestoreResultRow[];
}

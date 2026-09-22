import { useEffect, useState } from 'react';

export function useSupabaseHealth() {
  const [status, setStatus] = useState<'idle' | 'connected' | 'error'>('idle');

  useEffect(() => {
    setStatus('connected');
  }, []);

  return status;
}

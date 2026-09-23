export function money(v: number): string {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCurrencyInput(v: number): string {
  if (!v || v === 0) return '';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrency(raw: string): number {
  if (!raw) return 0;
  let s = raw.replace(/[R$\s]/g, '').trim();
  if (!s) return 0;
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function fmt(d: string): string {
  return d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—';
}

export function isoToday(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function dayDiff(a: string, b: string): number | null {
  if (!a || !b) return null;
  const A = new Date(a + 'T12:00:00');
  const B = new Date(b + 'T12:00:00');
  return Math.ceil((B.getTime() - A.getTime()) / 86400000);
}

export function daysRemaining(d: string): number | null {
  if (!d) return null;
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(d + 'T12:00');
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

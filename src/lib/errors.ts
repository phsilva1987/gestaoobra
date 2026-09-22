/**
 * Turns any thrown error into a message that is safe to show to the user.
 * Raw database / provider messages leak schema, constraint and policy details,
 * so they are logged to the console and never rendered.
 */
export function friendlyError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(err);

  if (msg.includes('foreign_key_violation') || msg.includes('23503')) {
    return 'Este registro possui vínculos e não pode ser excluído.';
  }
  if (msg.includes('23505')) {
    return 'Já existe um registro com estes dados.';
  }
  if (msg.includes('42501') || msg.includes('permission') || msg.includes('policy')) {
    return 'Você não possui permissão para executar esta ação.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Não foi possível acessar o servidor. Tente novamente.';
  }
  if (msg.includes('Sessão expirada')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  return fallback;
}

/**
 * Sign-in feedback must never differ between "no such account" and
 * "wrong password", otherwise anyone can discover which e-mails are registered.
 */
export function friendlyAuthError(err: unknown, fallback = 'E-mail ou senha inválidos.'): string {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(err);

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Não foi possível acessar o servidor. Tente novamente.';
  }
  if (msg.toLowerCase().includes('rate limit') || msg.includes('429')) {
    return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
  }
  return fallback;
}

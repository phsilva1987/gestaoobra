import type { ProjectData } from '../types';
import { money, fmt } from './format';
import { projectTotals, unforeseenTotal, categoryStats, materialTotal } from './calculations';

function escCsv(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
  return '"' + safe.replace(/"/g, '""') + '"';
}

function csvMoney(v: number): string {
  return Number(v || 0).toFixed(2).replace('.', ',');
}

function brDateNow(): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());
}

function safeFileName(s: string): string {
  return (s || 'noremati').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

function downloadBlob(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

interface ReportData {
  geradoEm: string;
  empresa: {
    nome: string;
    cnpj: string;
    responsavel: string;
    telefone: string;
    email: string;
    endereco: string;
    cidade: string;
    uf: string;
    projeto: string;
    responsavelObra: string;
    periodo: string;
  };
  resumo: {
    budget: number;
    contratado: number;
    pago: number;
    apagar: number;
    materiais: number;
    imprevistos: number;
    administrativo: number;
    equipamentos: number;
    progresso: number;
    saldo: number;
  };
  categorias: { categoria: string; previsto: number; contratado: number; diferenca: number }[];
  pagamentos: ProjectData['pagamentos'];
  materiais: ProjectData['materiais'];
  imprevistos: ProjectData['imprevistos'];
  admin: ProjectData['admin'];
  obra: ProjectData['obra'];
}

function buildReportData(project: ProjectData): ReportData {
  const t = projectTotals(project);
  const cats = categoryStats(project);
  const c = project.config;
  return {
    geradoEm: brDateNow(),
    empresa: {
      nome: c.empresa || 'Não informado',
      cnpj: c.documento || 'Não informado',
      responsavel: c.responsavel || 'Não informado',
      telefone: c.telefone || 'Não informado',
      email: c.email || 'Não informado',
      endereco: c.endereco || 'Não informado',
      cidade: c.cidade || '',
      uf: '',
      projeto: c.projeto || project.nome,
      responsavelObra: c.respObra || 'Não informado',
      periodo: `${c.inicio ? fmt(c.inicio) : '—'} → ${c.fim ? fmt(c.fim) : '—'}`,
    },
    resumo: {
      budget: t.budget,
      contratado: t.contratado,
      pago: t.pago,
      apagar: t.apagar,
      materiais: t.materiais,
      imprevistos: unforeseenTotal(project.imprevistos),
      administrativo: t.adm,
      equipamentos: t.eq,
      progresso: t.prog,
      saldo: t.available,
    },
    categorias: Object.entries(cats).map(([categoria, v]) => ({
      categoria,
      previsto: v.prev,
      contratado: v.real,
      diferenca: v.real - v.prev,
    })),
    pagamentos: [...project.pagamentos],
    materiais: [...project.materiais],
    imprevistos: [...project.imprevistos],
    admin: [...project.admin],
    obra: [...project.obra],
  };
}

export function exportFinanceiroCSV(project: ProjectData): void {
  const r = buildReportData(project);
  const rows: (string | number)[][] = [];
  rows.push(['RELATÓRIO FINANCEIRO - REFORMA']);
  rows.push(['Empresa', r.empresa.nome]);
  rows.push(['CNPJ / CPF', r.empresa.cnpj]);
  rows.push(['Responsável', r.empresa.responsavel]);
  rows.push(['Período', r.empresa.periodo]);
  rows.push(['Gerado em', r.geradoEm]);
  rows.push([]);
  rows.push(['RESUMO FINANCEIRO']);
  rows.push(['Investimento planejado', csvMoney(r.resumo.budget)]);
  rows.push(['Valor contratado', csvMoney(r.resumo.contratado)]);
  rows.push(['Valor pago', csvMoney(r.resumo.pago)]);
  rows.push(['A pagar', csvMoney(r.resumo.apagar)]);
  rows.push(['Materiais', csvMoney(r.resumo.materiais)]);
  rows.push(['Imprevistos', csvMoney(r.resumo.imprevistos)]);
  rows.push(['Administrativo pago', csvMoney(r.resumo.administrativo)]);
  rows.push(['Saldo disponível', csvMoney(r.resumo.saldo)]);
  rows.push([]);
  rows.push(['COMPARATIVO POR CATEGORIA']);
  rows.push(['Categoria', 'Previsto', 'Contratado', 'Diferença']);
  r.categorias.forEach((x) => rows.push([x.categoria, csvMoney(x.previsto), csvMoney(x.contratado), csvMoney(x.diferenca)]));
  rows.push([]);
  rows.push(['PAGAMENTOS']);
  rows.push(['Referência', 'Tipo', 'Valor', 'Vencimento', 'Forma', 'Status']);
  r.pagamentos.forEach((x) => rows.push([x.referencia || '', x.tipo || '', csvMoney(x.valor), fmt(x.vencimento), x.forma || '', x.status || '']));
  rows.push([]);
  rows.push(['MATERIAIS']);
  rows.push(['Material', 'Categoria', 'Fornecedor', 'Quantidade', 'Unidade', 'Valor unitário', 'Valor total', 'Status']);
  r.materiais.forEach((x) => rows.push([x.nome || '', x.categoria || '', x.fornecedorId || '', x.quantidade || 0, x.unidade || '', csvMoney(x.unitario), csvMoney(materialTotal(x)), x.status || '']));
  rows.push([]);
  rows.push(['IMPREVISTOS']);
  rows.push(['Item', 'Categoria', 'Responsável', 'Valor', 'Impacto prazo (dias)', 'Status']);
  r.imprevistos.forEach((x) => rows.push([x.nome || '', x.categoria || '', '', csvMoney(x.valor), x.impactoDias || 0, x.status || '']));
  rows.push([]);
  rows.push(['ADMINISTRATIVO']);
  rows.push(['Item', 'Valor', 'Pago', 'Status']);
  r.admin.forEach((x) => rows.push([x.nome || '', csvMoney(x.valor), csvMoney(x.pago), x.status || '']));

  const csv = '\ufeff' + rows.map((row) => row.map(escCsv).join(';')).join('\r\n');
  downloadBlob(csv, 'text/csv;charset=utf-8;', `${safeFileName(r.empresa.nome)}_relatorio_financeiro.csv`);
}

export function exportFinanceiroExcel(project: ProjectData): void {
  const r = buildReportData(project);
  const escH = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
  const m = (v: number) => money(Number(v || 0));
  const tr = (cells: string[], th = false) => `<tr>${cells.map((c) => `<${th ? 'th' : 'td'}>${c}</${th ? 'th' : 'td'}>`).join('')}</tr>`;

  let body = `<h1>Relatório Financeiro - Reforma</h1>
  <p><b>Empresa:</b> ${escH(r.empresa.nome)}<br><b>CNPJ/CPF:</b> ${escH(r.empresa.cnpj)}<br><b>Responsável:</b> ${escH(r.empresa.responsavel)}<br><b>Período:</b> ${escH(r.empresa.periodo)}<br><b>Gerado em:</b> ${escH(r.geradoEm)}</p>
  <h2>Resumo financeiro</h2><table border="1" cellspacing="0" cellpadding="6">`;
  body += tr(['Indicador', 'Valor'], true);
  [['Investimento planejado', r.resumo.budget], ['Valor contratado', r.resumo.contratado], ['Valor pago', r.resumo.pago], ['A pagar', r.resumo.apagar], ['Materiais', r.resumo.materiais], ['Imprevistos', r.resumo.imprevistos], ['Administrativo pago', r.resumo.administrativo], ['Saldo disponível', r.resumo.saldo]].forEach((x) => (body += tr([x[0] as string, m(x[1] as number)])));
  body += `</table><h2>Comparativo por categoria</h2><table border="1" cellspacing="0" cellpadding="6">${tr(['Categoria', 'Previsto', 'Contratado', 'Diferença'], true)}`;
  r.categorias.forEach((x) => (body += tr([x.categoria, m(x.previsto), m(x.contratado), m(x.diferenca)])));
  body += '</table>';
  body += `</table><h2>Pagamentos</h2><table border="1" cellspacing="0" cellpadding="6">${tr(['Referência', 'Tipo', 'Valor', 'Vencimento', 'Forma', 'Status'], true)}`;
  r.pagamentos.forEach((x) => (body += tr([x.referencia || '', x.tipo || '', m(x.valor), fmt(x.vencimento), x.forma || '', x.status || ''])));
  body += '</table>';
  body += `<h2>Materiais</h2><table border="1" cellspacing="0" cellpadding="6">${tr(['Material', 'Categoria', 'Qtd.', 'Unitário', 'Total', 'Status'], true)}`;
  r.materiais.forEach((x) => (body += tr([x.nome || '', x.categoria || '', String(x.quantidade || 0) + ' ' + (x.unidade || ''), m(x.unitario), m(materialTotal(x)), x.status || ''])));
  body += '</table>';
  body += `<h2>Imprevistos</h2><table border="1" cellspacing="0" cellpadding="6">${tr(['Item', 'Categoria', 'Valor', 'Impacto prazo', 'Status'], true)}`;
  r.imprevistos.forEach((x) => (body += tr([x.nome || '', x.categoria || '', m(x.valor), (x.impactoDias || 0) + ' dia(s)', x.status || ''])));
  body += '</table>';
  body += `<h2>Administrativo</h2><table border="1" cellspacing="0" cellpadding="6">${tr(['Item', 'Valor', 'Pago', 'Status'], true)}`;
  r.admin.forEach((x) => (body += tr([x.nome || '', m(x.valor), m(x.pago), x.status || ''])));
  body += '</table>';

  const excel = `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
  downloadBlob('\ufeff' + excel, 'application/vnd.ms-excel', `${safeFileName(r.empresa.nome)}_relatorio_financeiro.xls`);
}

function escH(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}

export function printReport(project: ProjectData, full = false): void {
  const r = buildReportData(project);
  const m = (v: number) => money(Number(v || 0));

  const fullSections = full
    ? `<h2>Pagamentos</h2><table><thead><tr><th>Referência</th><th>Tipo</th><th>Valor</th><th>Vencimento</th><th>Forma</th><th>Status</th></tr></thead><tbody>${r.pagamentos.map((x) => `<tr><td>${escH(x.referencia)}</td><td>${escH(x.tipo)}</td><td>${m(x.valor)}</td><td>${fmt(x.vencimento)}</td><td>${escH(x.forma)}</td><td>${escH(x.status)}</td></tr>`).join('')}</tbody></table>
       <h2>Materiais</h2><table><thead><tr><th>Material</th><th>Categoria</th><th>Qtd.</th><th>Unitário</th><th>Total</th><th>Status</th></tr></thead><tbody>${r.materiais.map((x) => `<tr><td>${escH(x.nome)}</td><td>${escH(x.categoria)}</td><td>${x.quantidade || 0} ${escH(x.unidade)}</td><td>${m(x.unitario)}</td><td>${m(materialTotal(x))}</td><td>${escH(x.status)}</td></tr>`).join('')}</tbody></table>
       <h2>Imprevistos</h2><table><thead><tr><th>Item</th><th>Categoria</th><th>Valor</th><th>Impacto prazo</th><th>Status</th></tr></thead><tbody>${r.imprevistos.map((x) => `<tr><td>${escH(x.nome)}</td><td>${escH(x.categoria)}</td><td>${m(x.valor)}</td><td>${x.impactoDias || 0} dia(s)</td><td>${escH(x.status)}</td></tr>`).join('')}</tbody></table>
       <h2>Administrativo</h2><table><thead><tr><th>Item</th><th>Valor</th><th>Pago</th><th>Status</th></tr></thead><tbody>${r.admin.map((x) => `<tr><td>${escH(x.nome)}</td><td>${m(x.valor)}</td><td>${m(x.pago)}</td><td>${escH(x.status)}</td></tr>`).join('')}</tbody></table>`
    : '';

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório Reforma</title>
  <style>
    *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;color:#222}
    body{padding:32px;max-width:900px;margin:auto}
    h1{font-size:22px;margin:0 0 4px}
    h2{font-size:15px;margin:24px 0 8px;border-bottom:2px solid #c9a227;padding-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:12px}
    th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
    th{background:#faf5ea}
    .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
    .muted{color:#888;font-size:13px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0}
    .k{border:1px solid #e3d9c0;border-radius:8px;padding:10px;background:#fffaf3}
    .k b{display:block;font-size:16px;margin-top:4px}
    .footer{margin-top:32px;font-size:11px;color:#aaa;text-align:center}
    @media print{body{padding:0;max-width:none}}
  </style></head><body>
  <div class="head"><div><h1>${escH(r.empresa.nome)}</h1><div class="muted">${escH(r.empresa.projeto)}</div></div><div><b>Período:</b> ${escH(r.empresa.periodo)}<br><b>Gerado em:</b> ${escH(r.geradoEm)}</div></div>
  <table><tr><td><b>CNPJ/CPF</b><br>${escH(r.empresa.cnpj)}</td><td><b>Responsável</b><br>${escH(r.empresa.responsavel)}</td><td><b>Telefone</b><br>${escH(r.empresa.telefone)}</td></tr><tr><td colspan="2"><b>Endereço</b><br>${escH(r.empresa.endereco)} ${escH(r.empresa.cidade)}</td><td><b>Responsável pela obra</b><br>${escH(r.empresa.responsavelObra)}</td></tr></table>
  <h2>Resumo financeiro</h2><div class="grid">
    <div class="k">Planejado<b>${m(r.resumo.budget)}</b></div><div class="k">Contratado<b>${m(r.resumo.contratado)}</b></div><div class="k">Pago<b>${m(r.resumo.pago)}</b></div><div class="k">A pagar<b>${m(r.resumo.apagar)}</b></div>
    <div class="k">Saldo disponível<b>${m(r.resumo.saldo)}</b></div><div class="k">Materiais<b>${m(r.resumo.materiais)}</b></div><div class="k">Imprevistos<b>${m(r.resumo.imprevistos)}</b></div><div class="k">Progresso físico<b>${r.resumo.progresso}%</b></div>
  </div>
  <h2>Comparativo por categoria</h2><table><thead><tr><th>Categoria</th><th>Previsto</th><th>Contratado</th><th>Diferença</th></tr></thead><tbody>${r.categorias.map((x) => `<tr><td>${escH(x.categoria)}</td><td>${m(x.previsto)}</td><td>${m(x.contratado)}</td><td>${m(x.diferenca)}</td></tr>`).join('')}</tbody></table>
  ${fullSections}
  <div class="footer">Relatório gerado pelo sistema de Gestão da Reforma</div></body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('O navegador bloqueou a janela do relatório. Permita pop-ups e tente novamente.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 450);
}

// Gerador do relatório PRIVADO de insígnias — node _gen-insignias.js
// Lê o Reporte Comercial (.xlsb, atualizado mensalmente pelo Sandro) e produz
// equipa/insignias/index.html (noindex): presença insígnia × mundo + buracos.
// NUNCA publica preços, volumes financeiros, crédito, comerciais nem clientes fora da whitelist.
// O módulo xlsx vive no scratchpad da sessão; instalar com `npm i xlsx` se faltar.
const fs = require('fs');
let XLSX;
try { XLSX = require('xlsx'); }
catch { XLSX = require('C:/Users/sandr/AppData/Local/Temp/claude/C--Users-sandr-OneDrive-Terrae---Os-Caetanos-Im-veis-T4-Odiveas-HF-Fotos/f5f53d8a-df3a-4229-85ae-e71f02efa468/scratchpad/node_modules/xlsx'); }

const FICHEIRO = 'C:/Users/sandr/OneDrive/Ambiente de Trabalho/Quente & Bom - 2026 - Reporte Comercial.xlsb';

// Whitelist aprovada pelo Sandro (2026-07-07): padrão na faturação → insígnia pública
const INSIGNIAS = [
  ['Candando', /conticash/i],
  ['Maxi', /^CND\b|CND -/i],
  ['Kibabo', /stoka/i],
  ['Nossa Casa', /noble group|nossa casa/i],
  ['Shoprite', /shoprite|mercado fresco de angola/i],
  ['Deskontão', /score distribui/i],
  ['BigOne', /vastness/i],
  ['Alimenta Angola', /alimenta angola/i],
  ['Africana Discount', /africana discount/i],
  ['Postos Pumangol', /pumangol/i],
  ['Postos Sonangol', /sonangol|sonagalp|p\.a\.? sonangol/i],
];

const wb = XLSX.readFile(FICHEIRO);
const sku = XLSX.utils.sheet_to_json(wb.Sheets['Tab.SKU'], { header: 1, defval: '' });
// Referencia → { marca, mundo }
const porRef = {};
for (const r of sku.slice(2)) {
  if (!r[1]) continue;
  porRef[String(r[1])] = { marca: String(r[4] || ''), mundo: String(r[6] || 'Outros') };
}

const vpf = XLSX.utils.sheet_to_json(wb.Sheets['VPF'], { header: 1, defval: '' });
const mapa = {};      // insignia → mundo → nº linhas de fatura (só marca Quente & Bom)
const distrib = {};   // insignia → nº linhas de produtos distribuídos (outras marcas)
let maxData = 0;
for (const r of vpf.slice(2)) {
  const cliente = String(r[5] || '');
  if (!cliente) continue;
  const ins = INSIGNIAS.find(([, re]) => re.test(cliente));
  if (!ins) continue;
  if (typeof r[2] === 'number' && r[2] > maxData) maxData = r[2];
  const p = porRef[String(r[8])] || { marca: '', mundo: 'Outros' };
  if (/quente/i.test(p.marca)) {
    mapa[ins[0]] = mapa[ins[0]] || {};
    mapa[ins[0]][p.mundo] = (mapa[ins[0]][p.mundo] || 0) + 1;
  } else {
    distrib[ins[0]] = (distrib[ins[0]] || 0) + 1;
  }
}

const mundos = [...new Set(Object.values(mapa).flatMap(m => Object.keys(m)))].sort();
const dataRef = maxData ? new Date(Date.UTC(1899, 11, 30) + maxData * 86400000).toISOString().slice(0, 10) : '?';
const hoje = new Date().toISOString().slice(0, 10);

const linhas = INSIGNIAS.map(([nome]) => {
  const m = mapa[nome] || {};
  const cels = mundos.map(w => m[w]
    ? `<td style="text-align:center;background:#e8f6e8;color:#256d25;font-weight:700">✓ <span style="font-size:11px;color:#8a7157">(${m[w]})</span></td>`
    : `<td style="text-align:center;background:#fdecec;color:#b03030;font-weight:700">—</td>`).join('');
  const so = !Object.keys(m).length;
  return `<tr><td><b>${nome}</b>${so ? ' <span style="font-size:11px;color:#b03030">(sem compras QeB no período!)</span>' : ''}${distrib[nome] ? ' <span style="font-size:11px;color:#8a7157">(+distribuição)</span>' : ''}</td>${cels}</tr>`;
}).join('\n');

const buracos = INSIGNIAS.flatMap(([nome]) => {
  const m = mapa[nome] || {};
  return mundos.filter(w => !m[w]).map(w => `<li><b>${nome}</b> não comprou <b>${w}</b></li>`);
});

// Clientes ADORMECIDOS: Distribuição Moderna na carteira sem qualquer fatura no ano
const cl = XLSX.utils.sheet_to_json(wb.Sheets['Tab.CL'], { header: 1, defval: '' });
const compraram = new Set(vpf.slice(2).map(r => String(r[3] || '')));
const grupoAtivo = nome => { const i = INSIGNIAS.find(([, re]) => re.test(nome)); return i && mapa[i[0]] && Object.keys(mapa[i[0]]).length; };
const adormecidos = cl.slice(2)
  .filter(r => /Distribuição Moderna/i.test(String(r[4] || '')) && String(r[1] || '') && !compraram.has(String(r[0] || '')))
  .map(r => `<li><b>${String(r[1]).trim()}</b> (nº ${r[0]})${grupoAtivo(String(r[1])) ? ' <span style="color:#8a7157;font-size:12px">— o grupo compra por outra entidade; possível conta antiga</span>' : ' <span style="color:#b03030;font-size:12px">— grupo inteiro sem compras!</span>'}</li>`);

const html = `<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow"><title>Insígnias × Mundos — interno</title>
<link rel="stylesheet" href="/assets/css/qeb.css?v=6"></head>
<body style="padding:40px 20px;max-width:1100px;margin:0 auto">
<p class="eyebrow" style="color:var(--orange)">EQUIPA COMERCIAL · CONFIDENCIAL — não partilhar fora da empresa</p>
<h1 style="font-family:var(--display);margin:8px 0 4px">Presença por insígnia × mundo de produto</h1>
<p style="color:var(--muted);font-size:14px">Fonte: Reporte Comercial (entregas até ${dataRef}) · gerado a ${hoje} · nº entre parênteses = linhas de fatura de produtos Quente e Bom. Sem valores financeiros de propósito.</p>
<div style="overflow-x:auto;margin-top:20px"><table style="border-collapse:collapse;width:100%;font-size:14px;font-family:var(--sans)">
<tr style="background:var(--brown);color:#fff"><th style="padding:10px;text-align:left">Insígnia</th>${mundos.map(w => `<th style="padding:10px">${w}</th>`).join('')}</tr>
${linhas}
</table></div>
<h2 style="font-family:var(--display);margin:34px 0 10px">🎯 Buracos (oportunidades de venda)</h2>
<ul style="line-height:1.9;font-size:15px">${buracos.join('\n')}</ul>
<h2 style="font-family:var(--display);margin:34px 0 10px">😴 Clientes adormecidos — Distribuição Moderna sem UMA fatura este ano (${adormecidos.length})</h2>
<ul style="line-height:1.9;font-size:15px">${adormecidos.join('\n')}</ul>
<p style="margin-top:26px;color:var(--muted);font-size:13.5px">Nota: o grupo Noble (Nossa Casa) opera as lojas <b>Angomart</b> — as 7 contas Angomart estão a zero, confirmando que a Quente e Bom não entra lá. Venda cruzada prioritária.</p>
</body></html>`;

fs.mkdirSync('equipa/insignias', { recursive: true });
fs.writeFileSync('equipa/insignias/index.html', html);
console.log(`equipa/insignias/index.html — ${INSIGNIAS.length} insígnias × ${mundos.length} mundos · ${buracos.length} buracos · dados até ${dataRef}`);

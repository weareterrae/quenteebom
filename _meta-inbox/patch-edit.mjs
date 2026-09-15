import fs from 'node:fs';
let s = fs.readFileSync('index-sandro.ts', 'utf8');
const a = '    const res = await publish(row);';
if (!s.includes(a)) throw new Error('send anchor');
s = s.replace(a, `    // edição antes de enviar (página editar.html do site): substitui o rascunho pelo texto do Sandro
    const ePub = url.searchParams.get("pub"), ePriv = url.searchParams.get("priv");
    if (ePub !== null && ePub.trim()) { row.reply = ePub.trim(); if (ePriv !== null) row.private_reply = ePriv.trim(); await db.from(TABLE).update({ reply: row.reply, private_reply: row.private_reply, detail: "editado pelo Sandro" }).eq("id", id); }
    const res = await publish(row);`);
const idx = s.indexOf('<a href="${link}"');
if (idx < 0) throw new Error('botão');
const lineEnd = s.indexOf('</a>', idx) + 4;
const editLink = '${BRAND_SITE}/editar.html?fn=${encodeURIComponent(FN_BASE)}&id=${p.id}&sig=${p.sig}&kind=${p.kind}&pub=${encodeURIComponent(p.pub || "")}&priv=${encodeURIComponent(p.priv || "")}&in=${encodeURIComponent(String(p.incoming || "").slice(0, 300))}';
const extra = '\n      <div style="margin-top:12px"><a href="' + editLink + '" style="color:${BRAND_ACCENT};font-weight:600;text-decoration:none;font-size:14px;border:1px solid ${BRAND_ACCENT};padding:10px 22px;border-radius:999px;display:inline-block">Editar e enviar</a></div>';
s = s.slice(0, lineEnd) + extra + s.slice(lineEnd);
fs.writeFileSync('index-sandro.ts', s);
console.log('send editável:', s.includes('editado pelo Sandro'), 'botão editar:', s.includes('Editar e enviar'));

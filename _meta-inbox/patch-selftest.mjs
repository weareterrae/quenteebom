import fs from 'node:fs';
let s = fs.readFileSync('index-sandro.ts', 'utf8');
const anchor = "  if (req.method === \"POST\") {";
if (!s.includes(anchor)) throw new Error('anchor não encontrada');
if (!s.includes('/selftest')) {
const route = `  if (req.method === "GET" && url.pathname.endsWith("/selftest") && url.searchParams.get("key") === VERIFY_TOKEN) {
    const out: any = {};
    try { const tk = await pageTok(); out.pageTok = tk ? "ok" : "vazio"; } catch (e) { out.pageTok = "erro " + String(e); }
    try { const h = await convoHistory("0"); out.convo = "ok " + JSON.stringify(h).slice(0, 40); } catch (e) { out.convo = "erro " + String(e); }
    try { const p = await brand(); out.prompt = p.slice(0, 60); } catch (e) { out.prompt = "erro " + String(e); }
    try { const t0 = Date.now(); const r = await claude("Responde só com a palavra OK.", "teste", 20); out.claude = (r || "(vazio)") + " " + (Date.now() - t0) + "ms"; } catch (e) { out.claude = "erro " + String(e); }
    try {
      const { data, error } = await db.from(TABLE).insert({ platform: "Teste", kind: "message", account_id: "0", target_id: "0", recipient_id: "0", author: "selftest", incoming: "selftest", reply: "", private_reply: "", status: "test" }).select("id").single();
      out.insert = error ? "erro " + JSON.stringify(error) : "ok";
      if (data?.id) await db.from(TABLE).delete().eq("id", data.id);
    } catch (e) { out.insert = "erro " + String(e); }
    return new Response(JSON.stringify(out, null, 1), { headers: { "content-type": "application/json" } });
  }
`;
s = s.replace(anchor, route + anchor);
fs.writeFileSync('index-sandro.ts', s);
}
console.log('selftest ok');

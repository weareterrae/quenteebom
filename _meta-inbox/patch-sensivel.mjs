import fs from 'node:fs';
let s = fs.readFileSync('index-sandro.ts', 'utf8');
if (!s.includes('SENSIVEL')) {
  const anchor = '        let pub = "", priv = "", autoOk = false, autoMotivo = "";';
  if (!s.includes(anchor)) throw new Error('anchor');
  s = s.replace(anchor, anchor + `
        // Temas sensíveis (estratégia 5 Set): nunca há rascunho. O email vem marcado "só à mão".
        const SENSIVEL = /\b(partid[oa]s?|governo|governos|presidente|ministro|corrup[çc][aã]o|colonial|colonialismo|sal[áa]rios?|ordenados?|despedid[oa]s?|despedimentos?|tribunal|tribunais|processo judicial|advogad[oa]s?|religi[aã]o|deus|pol[íi]tica|elei[çc][õo]es|MPLA|UNITA|imigrantes?|racis(mo|ta))\b/i;
        if (SENSIVEL.test(String(it.incoming || ""))) {
          const { data: insS } = await db.from(TABLE).insert({
            platform: it.platform, kind: it.kind, account_id: it.account_id, target_id: it.target_id,
            recipient_id: it.recipient_id, author: it.author, incoming: it.incoming,
            reply: "", private_reply: "", status: "pending", detail: "tema sensível: só à mão",
          }).select("id").single();
          if (insS?.id) await notify({ ...it, id: insS.id, pub: "", priv: "", sig: await hmacHex(HMAC_SECRET, insS.id),
            holdReason: "Tema sensível (política, salários, tribunais ou religião). Sem rascunho de propósito: responde à mão na app, ou ignora." });
          continue;
        }`);
  fs.writeFileSync('index-sandro.ts', s);
}
console.log('sensivel:', s.includes('SENSIVEL'));

// Netlify Function: submission-created
// Dispara automaticamente a CADA formulário submetido no site (Netlify Forms).
// Envia ao Sandro/equipa comercial um email formatado com o lead + botão "Responder já no WhatsApp".
// Filosofia igual à do inbox do Joaquim: NADA é enviado ao cliente automaticamente —
// o email dá tudo pronto para a equipa responder num toque.
//
// Config necessária (Netlify → Site settings → Environment variables):
//   RESEND_API_KEY  (a mesma chave Resend usada pelo inbox; domínio quenteebom.com já verificado)
//   LEADS_EMAIL     (opcional; destino dos avisos; default sandro.qb@gmail.com)
//   LEADS_FROM      (opcional; remetente; default "Leads Quente e Bom <leads@quenteebom.com>")

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const TO_EMAIL   = process.env.LEADS_EMAIL || "sandro.qb@gmail.com";
// Remetente: usa o mesmo do inbox (onboarding@resend.dev — remetente de teste do Resend).
// Entrega só ao email da conta Resend (sandro.qb@gmail.com), o que basta para os avisos de lead.
// Para remetente próprio (leads@quenteebom.com) OU enviar a mais pessoas, verificar o domínio no Resend
// e definir a env LEADS_FROM.
const FROM_EMAIL = process.env.LEADS_FROM || "Quente e Bom Leads <onboarding@resend.dev>";

// nomes de formulário -> etiqueta amigável (para o assunto/cabeçalho)
const FORM_LABELS = {
  "lead-revendedor": "Novo revendedor 🤝",
  "encomenda-profissional": "Pedido de cotação 📋",
  "contacto": "Mensagem de contacto ✉️",
  "candidatura": "Candidatura 👤",
};
// campos que, se existirem, são um número de telefone/WhatsApp
const PHONE_KEYS = ["whatsapp", "telefone", "tel", "telemovel", "contacto", "phone"];
const NAME_KEYS  = ["nome", "name", "primeiro-nome"];
const BIZ_KEYS   = ["negocio", "empresa", "organizacao", "loja"];

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pick = (data, keys) => { for (const k of Object.keys(data)) { if (keys.includes(k.toLowerCase())) return data[k]; } return ""; };
// normaliza para wa.me: só dígitos; assume +244 (Angola) se vier sem indicativo
function waNumber(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 9 && d.startsWith("9")) d = "244" + d; // nº angolano local (9 dígitos)
  return d;
}

exports.handler = async (event) => {
  try {
    if (!RESEND_KEY) return { statusCode: 200, body: "sem RESEND_API_KEY — nada enviado" };
    const body = JSON.parse(event.body || "{}");
    const payload = body.payload || {};
    const formName = payload.form_name || "formulario";
    const data = payload.data || {};
    // ignora o honeypot e campos internos
    delete data["bot-field"]; delete data["bt"]; delete data["form-name"];

    const label = FORM_LABELS[formName] || `Novo formulário (${formName})`;
    const nome = pick(data, NAME_KEYS);
    const negocio = pick(data, BIZ_KEYS);
    const phoneRaw = pick(data, PHONE_KEYS);
    const wa = waNumber(phoneRaw);

    // linhas da tabela (todos os campos preenchidos, por ordem)
    const rows = Object.keys(data)
      .filter((k) => String(data[k] || "").trim() !== "")
      .map((k) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1e6d8;color:#9b8290;font-size:12.5px;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;vertical-align:top">${esc(k)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1e6d8;font-size:15px;color:#3A2030">${esc(data[k])}</td>
      </tr>`).join("");

    // mensagem calorosa pré-escrita para o WhatsApp (PT de Angola)
    const primeiro = String(nome || "").trim().split(/\s+/)[0] || "";
    const saud = primeiro ? `Olá, ${primeiro}!` : "Olá!";
    const refNeg = negocio ? ` para *${negocio}*` : "";
    const waMsg = `${saud} 🧡 Fala a equipa da Quente e Bom. Recebemos o seu pedido${refNeg} através do nosso site e é já um gosto ajudar. Quando lhe fica bem falarmos?`;
    const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(waMsg)}` : "";

    const cta = waLink
      ? `<div style="text-align:center;margin:22px 0">
           <a href="${waLink}" style="background:#25D366;color:#fff;font-weight:800;text-decoration:none;padding:14px 30px;border-radius:999px;font-size:16px;display:inline-block">Responder já no WhatsApp 💬</a>
           <div style="font-size:12px;color:#9b8290;margin-top:8px">Abre a conversa com a mensagem já escrita — é só rever e enviar.</div>
         </div>`
      : `<div style="text-align:center;margin:18px 0;font-size:13px;color:#9b8290">Sem número de WhatsApp neste formulário — responde pelo canal indicado acima.</div>`;

    const html = `
    <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#3A2030">
      <div style="background:#5B2A4A;color:#fff;border-radius:14px;padding:18px 22px">
        <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#F6C440;font-weight:700">Quente e Bom · Lead do site</div>
        <div style="font-size:19px;font-weight:800;margin-top:4px">${esc(label)}</div>
      </div>
      ${cta}
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #f0e6d6;border-radius:12px;overflow:hidden;margin:12px 0">${rows}</table>
      <div style="font-size:12px;color:#9b8290;text-align:center;margin-top:10px">Responde depressa — um lead B2B esfria em horas. ☀️</div>
    </div>`;

    const subject = `☀️ ${label}${negocio ? " — " + negocio : (nome ? " — " + nome : "")}`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to: [TO_EMAIL], subject, html }),
    });
    return { statusCode: 200, body: r.ok ? "lead enviado" : "erro Resend: " + (await r.text()) };
  } catch (e) {
    return { statusCode: 200, body: "erro: " + (e && e.message) };
  }
};

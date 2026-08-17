// Helper partilhado para chamar o Gemini com resiliência a falhas transitórias
// da Google (503 "overloaded", 429, outros 5xx, timeouts/rede). Absorve os
// soluços breves da Google: tenta várias chaves e vários modelos, com retries
// e backoff curto. Devolve o texto na PRIMEIRA resposta válida, ou null se tudo
// falhar — mantendo o contrato de fallback/manutenção de quem chama.

// Erros que valem a pena repetir (transitórios): timeouts, rate-limit e 5xx.
const TRANSITORIOS = new Set([408, 425, 429, 500, 502, 503, 504]);
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

// Opções:
//   system          string | undefined  — instrução de sistema (opcional)
//   contents        array               — já no formato Gemini (construído por quem chama)
//   maxOutputTokens number              — quem chama aplica o seu próprio mínimo
//   safetySettings  array | undefined   — passa tal e qual se existir
//   models          string[]            — [modeloPrincipal, ...reservas]; a ordem manda
//   baseUrl         string | undefined  — sem barra final; default = endpoint público
//   logPrefix       string              — prefixo dos logs (ex.: "joaquim"/"redator")
// Devolve { text, model } no sucesso, ou null se nenhuma combinação resultar.
export async function chamarGemini({
  system,
  contents,
  maxOutputTokens,
  safetySettings,
  models,
  baseUrl,
  logPrefix = "gemini",
  timeoutMs = 0,      // teto por tentativa (0 = sem limite; o site do Joaquim usa ~2500 para não pendurar o visitante)
  tentativas = 3,     // tentativas por (chave, modelo)
}) {
  // Chaves por ordem: a principal e, se existir, a de reserva.
  const chaves = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
  if (!chaves.length) return null;

  const base = (baseUrl || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
  const listaModelos = (models || []).filter(Boolean);

  const bodyBase = {
    ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
    contents,
    ...(safetySettings ? { safetySettings } : {}),
  };

  for (const chave of chaves) {
    for (const modelo of listaModelos) {
      // Pensamento: o pro leva um pouco (128) para ter alma; as reservas flash ficam a 0 (rápidas).
      const cfg = { maxOutputTokens };
      if (/pro/.test(modelo)) cfg.thinkingConfig = { thinkingBudget: 128 };
      else if (/2\.5|latest/.test(modelo)) cfg.thinkingConfig = { thinkingBudget: 0 };
      const body = JSON.stringify({ ...bodyBase, generationConfig: cfg });
      // Até N tentativas por (chave, modelo) com backoff 400ms*tentativa (400, 800).
      for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
        const ctl = timeoutMs ? new AbortController() : null;
        const tm = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
        try {
          const r = await fetch(`${base}/v1beta/models/${modelo}:generateContent`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": chave },
            body,
            ...(ctl ? { signal: ctl.signal } : {}),
          });
          if (tm) clearTimeout(tm);
          if (!r.ok) {
            const detalhe = (await r.text()).slice(0, 200);
            if (TRANSITORIOS.has(r.status)) {
              // Transitório: repete no mesmo modelo enquanto houver tentativas.
              if (tentativa < tentativas) {
                console.error(`${logPrefix}: Gemini ${modelo}`, r.status, `→ retry ${tentativa}`);
                await dorme(400 * tentativa);
                continue;
              }
              console.error(`${logPrefix}: Gemini ${modelo}`, r.status, detalhe, "→ próximo modelo");
              break; // esgotou os retries → passa ao próximo modelo
            }
            // Permanente (400/401/403/404): não vale a pena repetir este modelo.
            console.error(`${logPrefix}: Gemini ${modelo}`, r.status, detalhe, "→ próximo modelo");
            break;
          }
          const j = await r.json();
          const texto = (j?.candidates?.[0]?.content?.parts || [])
            .filter((p) => !p.thought) // exclui as partes de "raciocínio" dos modelos thinking
            .map((p) => p.text || "")
            .join("")
            .trim();
          if (texto) return { text: texto, model: modelo };
          break; // texto vazio → próximo modelo
        } catch (e) {
          // AbortError / falhas de rede contam como transitórias.
          if (tentativa < tentativas) {
            console.error(`${logPrefix}: Gemini ${modelo} falha de rede`, e?.name || e, `→ retry ${tentativa}`);
            await dorme(400 * tentativa);
            continue;
          }
          console.error(`${logPrefix}: Gemini ${modelo} falha de rede`, e, "→ próximo modelo");
          break; // esgotou os retries → próximo modelo
        }
      }
    }
  }
  return null;
}

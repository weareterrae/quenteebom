// Generaliza a descrição da marca usada no resumo semanal (era "padaria/pastelaria angolana" fixo).
import fs from 'node:fs';
let s = fs.readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
if (!s.includes('BRAND_DESC')) {
  s = s.replace('const BRAND_SITE   = env("BRAND_SITE", "https://quenteebom.com");', 'const BRAND_SITE   = env("BRAND_SITE", "https://quenteebom.com");\nconst BRAND_DESC   = env("BRAND_DESC", "padaria/pastelaria angolana"); // descrição curta da marca para o resumo semanal');
  s = s.replace('analista de comunidade da marca ${BRAND} (padaria/pastelaria angolana)', 'analista de comunidade da marca ${BRAND} (${BRAND_DESC})');
  fs.writeFileSync(new URL('./index.ts', import.meta.url), s);
}
console.log('BRAND_DESC ocorrências:', (s.match(/BRAND_DESC/g) || []).length);

# Quente e Bom — Evolução do produto digital · Relatório de entrega

Trabalho local, **não publicado** (deploy único no fim). Ponto de restauro: tag git `baseline-site-evolucao` (HEAD `aebad00`).
Ambiente de verificação: servidor estático local + browser; cada lote verificado ao vivo (0 erros de consola).

---

## 1. Resumo executivo
Evolução rigorosa do site (não redesign): preservada a identidade ("O sol nasce. O pão também.", "Todos os dias, uma delícia.", Joaquim, cores, tom). Focos entregues: **segurança, acessibilidade, consentimento/privacidade, analytics, conversão B2B (cotação), descoberta de produto (catálogo + páginas de produto), onde comprar, institucional, SEO técnico**. Nada de dados inventados — o que falta está marcado `[VALIDAÇÃO INTERNA NECESSÁRIA]`.

## 2. Ficheiros alterados / criados (principais)
- **netlify.toml** — cabeçalhos de segurança (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS).
- **404.html** — página de erro on-brand (novo).
- **assets/js/site.js** — skip link; consentimento de cookies; camada central `window.qbTrack`; rodapé legal injetado; eventos globais.
- **assets/js/bento.js** — Joaquim acessível (Escape, botão ✕, focus-trap, aria); evento `JoaquimAberto`; fluxos ligados a `/onde-comprar/` e `/produtos/`.
- **assets/css/qeb.css** — skip link, `:focus-visible`, banner de cookies, rodapé legal, breadcrumbs, `.sr-only`, ações de receita, toast, **CSS de impressão**.
- **_gen-qeb.js** — breadcrumbs + BreadcrumbList; cartões de categoria ligados a produto; gera **/produtos/**, **/produtos/[slug]/**, **/onde-comprar/**, **/quem-somos/**; twitter cards.
- **_gen-prof.js** — **cotação reconstruída** (catálogo pesquisável); nav religada.
- **_gen-extra.js** — receitas com breadcrumb, imprimir/partilhar/lista, relacionadas, produtos ligados; twitter cards; og:type.
- **bento-prompt.txt** — Joaquim conhece as rotas novas.
- **recrutamento/index.html** — formulário encerrado desativado (fora do DOM/tabulação), CTA de saída, JS protegido.
- **cookies/index.html**, **termos/index.html** — páginas legais novas.
- **index.html** — WebSite JSON-LD; rodapé religado.
- **sitemap.xml** — 186 URLs (produtos, novas rotas).

## 3. Novas rotas
`/produtos/` · `/produtos/[slug]/` (80) · `/onde-comprar/` · `/quem-somos/` · `/cookies/` · `/termos/` · `404`.

## 4. Componentes / funcionalidades criados
- Banner de consentimento de cookies (não carrega Pixel/Metricool antes de aceitar).
- Camada central de analytics `qbTrack` (fim dos eventos dispersos).
- Catálogo de cotação (pesquisa, filtros, quantidades, resumo desktop/mobile, validação por campo, RGPD, prevenção de duplo envio, referência de pedido).
- Catálogo de produtos do consumidor (pesquisa + filtros) + páginas de produto (modelo extensível).
- Breadcrumbs + BreadcrumbList em categorias, produtos e receitas.
- Ações de receita (imprimir/partilhar/lista de compras) + relacionadas.
- Onde comprar (insígnias aprovadas + captador de procura província→zona→produto).
- Skip link, foco visível, chat acessível.

## 5. Dados migrados
- 80 produtos de retalho (nome, descrição, categoria, imagem) → catálogo + páginas de produto.
- 71 artigos profissionais + gama de prateleira (retalho.json) → catálogo de cotação.
- Modelo de produto preparado para receber peso/ingredientes/alergénios/nutrição/conservação (ver ponto 10).

## 6. Integrações
Netlify Forms (cotação, revendedor, contacto, onde-comprar) + função `submission-created.js` (email via Resend). Meta Pixel `1428486132666431` e Metricool — **agora atrás de consentimento**. Joaquim: Netlify Function + Claude (base de conhecimento em bento-prompt.txt).

## 7. Eventos analíticos (via `qbTrack`)
PageView, Lead, LeadB2B{tipo}, Contact{metodo}, VerReceita, JoaquimAberto, CotacaoEnviada{artigos}, OndeComprarProcura{provincia,produto}, ReceitaImpressa/Partilhada, ListaCompras. Respeitam consentimento; `dataLayer` preenchido.

## 8. Lighthouse (a correr no deploy)
Não corrido neste ambiente (sem CLI). Expectativa: SEO e Best Practices altos (headers, canonical, JSON-LD, títulos únicos); Acessibilidade reforçada (skip link, foco, aria, contraste da paleta). **Correr Lighthouse mobile+desktop após o deploy e registar.**

## 9. Testes efetuados (ao vivo, local)
404; recrutamento (0 campos, 0 erros); Joaquim (Escape/✕/aria); consentimento (Pixel só após aceitar) + qbTrack; cotação (pesquisa/filtro/carrinho/validação/referência); /produtos/ (pesquisa/filtro/links); página de produto (JSON-LD, sem dados falsos); /onde-comprar/ (validação, só insígnias aprovadas); /quem-somos/; receita (ações, relacionadas); navegação religada; varredura SEO (H1/canonical/title).

## 10. [VALIDAÇÃO INTERNA NECESSÁRIA]
- Fichas de produto: peso, formatos, ingredientes, alergénios, nutrição, conservação (estrutura pronta; só publicar com dados do ERP/fichas técnicas).
- Onde comprar: base de lojas com morada/coordenadas (hoje é por insígnia/zona + captador de procura).
- Quem somos: nº de colaboradores, capacidade produtiva, certificações, marcos datados, fotos reais de fábrica/equipa.
- Catálogo PDF profissional (só publicar botão com PDF aprovado).

## 11. Revisão jurídica necessária
`/cookies/` e `/termos/` (estrutura baseada nas tecnologias reais; texto final a rever). Rever também `/privacidade.html`.

## 12. Fotos / dados adicionais
Fotos reais de fábrica/equipa (quem-somos); fotografias ilustrativas por produto (páginas de produto usam a imagem existente por convenção).

## 13. Afinação adicional feita (ronda 2)
- Homepage: nav "Produtos" → /produtos/; CTAs "Ver todos os produtos" e "Ver onde comprar"; afirmação não verificável ("milhares de mesas") suavizada; botão do Joaquim já não tapa a barra da cotação em mobile.
- Área Profissional (landing): breadcrumb + FAQ (4 perguntas, só respostas confirmadas) + FAQPage JSON-LD.
- Dicas: breadcrumb.

## 13b. Sugestões futuras não implementadas
- CSP (Content-Security-Policy): o site usa muito inline (onclick/estilos), pelo que uma CSP útil exige refactor com nonces/hashes — fica como trabalho próprio (report-only sem valor real enquanto precisar de `unsafe-inline`).
- Dicas → artigos individuais: só quando houver conteúdo útil por artigo (evitar páginas finas).
- Mapa de lojas quando existir base fiável com coordenadas.
- Bump de versões `?v=` dos assets (não crítico: netlify.toml revalida CSS/JS a cada visita).

## 14. Instruções de deploy
1. Rever `git status` / `git diff` no repositório do site.
2. Correr os geradores para garantir consistência: `node _gen-qeb.js && node _gen-prof.js && node _gen-extra.js`.
3. (Opcional) Bump de `?v=` de qeb.css/site.js/bento.js.
4. Commit + push para o branch ligado ao Netlify → build automático.
5. Pós-deploy: submeter sitemap no Search Console; correr Lighthouse; testar 1 submissão de cada formulário.

## 15. Plano de rollback
- Restauro de ficheiro: `git checkout baseline-site-evolucao -- <ficheiro>`.
- Rollback total no Netlify: **Deploys → deploy anterior → Publish deploy** (instantâneo).
- Os geradores permitem reconstruir qualquer página a partir dos dados.

# Eleições Presidenciais 2026 · Frontend

Site da enquete **não oficial** do 2º turno da eleição presidencial de 2026 (Lula × Flávio Bolsonaro): React + Vite + Tailwind, com um BFF em Express.

- Backend: [backend-presidential-elections](https://github.com/StanleyBack-dev/backend-presidential-elections)
- Fluxo: `navegador → BFF (/api/elections/*) → backend (/graphql) → Postgres`

```
src/                 React (página única: placar, voto, análise, comprovante)
server/              BFF Express — única porta pública da API
api/[...all].js      BFF como função serverless na Vercel
public/              fotos oficiais (TSE) e imagem de prévia do link
```

## Rodando localmente

```bash
cp server/.env.local.example server/.env.local   # mesmo INTERNAL_API_SECRET do backend
cp .env.example .env.local
npm install
npm run dev        # Vite em :5173 e BFF em :5000
npm run dev:lan    # idem, acessível pelo celular na mesma rede Wi-Fi
```

## Endpoints do BFF

| Método | Rota                        | Descrição                                  |
| ------ | --------------------------- | ------------------------------------------ |
| GET    | `/api/elections/candidates` | Candidatos (cache de CDN de 1h)            |
| GET    | `/api/elections/results`    | Totais, % e votos por estado (cache de 5s) |
| GET    | `/api/elections/analytics`  | Análise com filtros (cache de 10s)         |
| POST   | `/api/elections/votes`      | Registra um voto                           |

Filtros de `/analytics` (query string): `region`, `states` (`SP,RJ`), `from`, `to`, `leader`, `minVotes`, `sortBy`, `sortCandidate`, `order`, `granularity`. Parâmetros desconhecidos ou inválidos retornam 400. No site, os filtros ficam na URL (`?regiao=sudeste&periodo=24h`).

## Comprovante de votação

Depois de votar, o site gera no navegador uma imagem 1080×1920 (formato Stories do Instagram).

- **Voto visível por padrão**, com opção de esconder antes de compartilhar.
- **"Postar nos Stories":** abre o compartilhamento nativo do celular com a imagem anexada. Sites não podem postar direto nos Stories; isso é exclusivo de apps nativos.
- **WhatsApp, Telegram, X e Facebook:** no celular, enviam a imagem com um texto com emojis como legenda. No computador, abrem o link do app; a imagem chega pela prévia do link.
- **Privacidade:** CPF e data de nascimento nunca aparecem. Para reabrir o comprovante, o navegador guarda localmente estado, horário e opção escolhida; nada disso vai para o servidor.

### Prévia do link (Open Graph)

As tags ficam em `index.html` e a imagem em `public/og-image.png` (1200×630). As prévias exigem URL absoluta: o build usa `VITE_SITE_URL` ou, na Vercel, o domínio de produção (`VERCEL_PROJECT_PRODUCTION_URL`, exposto automaticamente por padrão).

## Segurança

- Sem CORS: SPA e BFF no mesmo domínio.
- CSP, HSTS e demais headers em `vercel.json`; helmet no BFF.
- Rate limit por IP no BFF, além do rate limit autoritativo no backend.
- O BFF repassa só campos conhecidos do voto, nunca loga corpo de requisição e se autentica no backend com `INTERNAL_API_SECRET`.

## Deploy (Vercel)

O workflow `deploy.yml` publica após o CI passar na `master`.

- **Secrets do GitHub:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- **Variáveis de ambiente na Vercel:** `BACKEND_GRAPHQL_URL` (URL do backend + `/graphql`), `INTERNAL_API_SECRET`, `VITE_TURNSTILE_SITE_KEY` e, opcionalmente, `VITE_SITE_URL`.

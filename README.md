# shahwaiz.dev

Minimal personal site. Astro + Groq + Turso + Vercel.

## Features

- Homepage with a streaming chatbot that answers questions about you (with RAG over a personal knowledge base)
- Blog powered by markdown files in `src/content/blog/`
- Password-protected `/dashboard` to upload/list/delete knowledge base docs
- Claude-inspired dark palette, Fraunces serif + Inter body
- View transitions, subtle framer-motion animations

## Stack

| | |
|---|---|
| Framework | [Astro 4](https://astro.build) (server output) |
| UI islands | React + Tailwind + framer-motion |
| Hosting | [Vercel](https://vercel.com) |
| Database | [Turso](https://turso.tech) (libSQL with native vector search) |
| LLM | [Groq](https://groq.com) (default: `llama-3.3-70b-versatile`) |
| Embeddings | [Voyage AI](https://voyageai.com) (`voyage-3-lite`, 512-d) |
| DNS | Cloudflare Domains (shahwaiz.dev) → Vercel |

---

## One-time setup

### 1. Clone locally

```bash
git clone <your-repo-url> shahwaiz-dev
cd shahwaiz-dev
npm install
cp .env.example .env
```

### 2. Create accounts & collect keys

All free. Aim for ~15 minutes.

**Groq** — https://console.groq.com/keys
- Sign in, create an API key. Paste into `.env` as `GROQ_API_KEY`.

**Voyage AI** — https://dash.voyageai.com
- Sign up, create an API key. Paste as `VOYAGE_API_KEY`.
- Free tier is 50M tokens. Way more than you'll use.

**Turso** — https://turso.tech
- Install the CLI: `brew install tursodatabase/tap/turso` (or see their docs).
- `turso auth login`
- `turso db create shahwaiz-dev`
- `turso db show shahwaiz-dev --url` → paste as `TURSO_DATABASE_URL`
- `turso db tokens create shahwaiz-dev` → paste as `TURSO_AUTH_TOKEN`

**Dashboard auth**
- Pick any password → `DASHBOARD_PASSWORD`
- Generate a session secret: `openssl rand -base64 32` → `SESSION_SECRET`

### 3. Initialize the database schema

```bash
npm run db:init
```

Creates the `kb_documents` and `kb_chunks` tables plus a vector index.

### 4. Run it locally

```bash
npm run dev
```

Visit http://localhost:4321. The chatbot will work without any KB docs (it just won't know anything about you yet). Go to http://localhost:4321/dashboard to add some.

**What to upload first:** your resume, a bio, a list of current projects, how-to-reach-you info. Paste them as separate documents — the retrieval is per-chunk anyway.

---

## Deploying

### 5. Push to GitHub

```bash
git init
git add .
git commit -m "initial"
gh repo create shahwaiz-dev --private --source=. --push
# or create the repo on github.com and push manually
```

### 6. Connect Vercel

1. Go to https://vercel.com/new
2. Import the GitHub repo
3. Framework preset: **Astro** (auto-detected)
4. Under "Environment Variables", paste every variable from your `.env`:
   - `GROQ_API_KEY`, `GROQ_MODEL`
   - `VOYAGE_API_KEY`, `VOYAGE_MODEL`
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - `DASHBOARD_PASSWORD`, `SESSION_SECRET`
5. Deploy.

### 7. Wire up the domain

In Vercel: Project → Settings → Domains → **Add `shahwaiz.dev`**. Vercel will give you DNS records (usually an A record for the apex and a CNAME for `www`).

In Cloudflare: Domains → shahwaiz.dev → DNS records. Add whatever Vercel asked for. **Set proxy to "DNS only" (grey cloud)** — you want Vercel's edge handling TLS, not Cloudflare proxying on top.

Propagation is usually a few minutes. HTTPS is automatic.

---

## Day-to-day

### Write a blog post

Create a markdown file in `src/content/blog/`:

```markdown
---
title: "my new post"
description: "what it's about"
pubDate: 2026-05-01
tags: ["tag1"]
draft: false
---

post body...
```

Commit and push. Vercel redeploys in ~20 seconds.

### Update the knowledge base

Go to `https://shahwaiz.dev/dashboard`, sign in with your password, paste or upload new content. The bot picks it up immediately — no redeploy needed.

### Swap the LLM

Change `GROQ_MODEL` in Vercel env vars. Options:
- `llama-3.3-70b-versatile` — best quality, still very fast (~275 t/s)
- `llama-3.1-8b-instant` — fastest (~750 t/s), less nuanced
- `mixtral-8x7b-32768` — longer context

### Update your profile picture

Drop a file at `public/pfp.jpg`. Square, 400×400 is plenty.

---

## Project structure

```
src/
├── layouts/Layout.astro         # shared page shell
├── components/
│   ├── Chatbot.tsx              # homepage chatbot island
│   └── KbManager.tsx            # dashboard KB manager
├── lib/
│   ├── db.ts                    # Turso client
│   ├── groq.ts                  # Groq client
│   ├── embeddings.ts            # Voyage embeddings
│   ├── chunk.ts                 # text chunker
│   ├── rag.ts                   # upsert/retrieve
│   ├── auth.ts                  # session cookie helpers
│   └── prompts.ts               # system prompt + RAG prompt builder
├── pages/
│   ├── index.astro              # homepage
│   ├── blog/                    # blog index + post pages
│   ├── dashboard/               # login + protected dashboard
│   └── api/                     # chat, kb CRUD, auth routes
├── content/blog/                # markdown posts
└── styles/global.css
scripts/init-db.ts               # schema setup
```

## Notes on costs

At a personal-site traffic level, all five services (Vercel, GitHub, Turso, Groq, Voyage) are free. You only start paying if the bot gets hammered — and even then, Groq rate-limits before it charges.

## License

MIT — do whatever.

# Neo Mind Flow — Blog (Astro)

Blog estático de autoajuda/desenvolvimento pessoal + livros. Stack: **Astro 5**,
Markdown (content collections), deploy em GitHub Pages (grátis).

## Como rodar localmente

```bash
npm install
npm run dev        # servidor de desenvolvimento (http://localhost:4321)
npm run build      # gera o site estático em dist/
npm run preview    # serve o build localmente
```

## Como publicar um post

1. Crie um arquivo Markdown em `src/content/blog/`.
2. Frontmatter obrigatório:

```md
---
title: "Título do artigo"
description: "Descrição (aparece no Google/redes sociais)"
pubDate: 2026-08-17
tags: ["books"]
---

Conteúdo do artigo aqui...
```

3. O post aparece automaticamente na home, no RSS e no sitemap.

## Analytics (opcional)

Crie um `.env` (copie de `.env.example`) e preencha os IDs:

- `PUBLIC_GSC_VERIFICATION` — token do Google Search Console
- `PUBLIC_GA4_ID` — Measurement ID do Google Analytics (GA4)
- `PUBLIC_CLARITY_ID` — Project ID do Microsoft Clarity

No deploy (GitHub Pages), os mesmos valores são configurados como **Variables**
do repositório (Settings → Secrets and variables → Actions → Variables).

## Deploy (GitHub Pages)

- Ative Pages em Settings → Pages → Source: **GitHub Actions**.
- O workflow `.github/workflows/deploy.yml` faz build + deploy a cada push em `main`.
- Depois, aponte o domínio (ex.: `blog.neomindflow.cloud`) via CNAME em Pages.

## Estrutura

```
src/
  content/blog/      # posts em Markdown
  content.config.ts  # schema dos posts
  layouts/           # Layout base + BlogPost
  components/        # Analytics (GSC/GA4/Clarity)
  pages/             # home, /blog/[...slug], /about, rss
public/              # robots.txt, favicon
```

## Fluxo de publicação (agente)

O conteúdo é gerenciado 100% por Markdown + git. O agente escreve o post → commit →
push → GitHub Actions publica. Revisão via pull request antes de ir pra `main`.

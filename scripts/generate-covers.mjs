#!/usr/bin/env node
/**
 * Neo Mind Flow — gerador de capas OG.
 * Roda depois do `astro build`. Não usa navegador: satori faz o layout, resvg rasteriza.
 *
 *   node scripts/generate-covers.mjs
 *
 * Lê o frontmatter dos posts em src/, gera:
 *   public/covers/<slug>-og.png     1200x630   (Open Graph / Twitter)
 *   public/covers/<slug>-cover.png  1200x800   (capa dentro do post, opcional)
 *   public/covers/default-og.png               (fallback do site)
 *
 * Regenera apenas o que mudou (compara mtime do .md com o do .png).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/* ------------------------------------------------------------------ config */
const PAPER = '#FBFAF8';
const INK = '#17150F';
const GREY = '#6B6558';
const GREEN = '#14532D';
const BORDER = '#E5E0D8';
const DOMAIN = process.env.SITE_DOMAIN || 'neomindflow.cloud';
const SITE_NAME = 'Neo Mind Flow';

const FONT_DIR = path.join(ROOT, 'scripts', 'fonts');
const OUT_DIR = path.join(ROOT, 'public', 'covers');
const CONTENT_DIRS = [
  'src/content/blog', 'src/data/blog', 'src/content/posts',
  'src/data/posts', 'src/blog', 'src/pages/blog',
];

const PRESETS = {
  og:    { W: 1200, H: 630, pad: 80, tMax: 66, tMin: 34, tag: 15, ruleGap: 26, tagGap: 22, footPad: 22, wm: 24, url: 15, maxLines: 4 },
  cover: { W: 1200, H: 800, pad: 88, tMax: 78, tMin: 38, tag: 16, ruleGap: 30, tagGap: 24, footPad: 24, wm: 26, url: 16, maxLines: 5 },
};

/* ------------------------------------------------------------------- fonts */
const font = (f) => fs.readFileSync(path.join(FONT_DIR, f));
const FONTS = [
  { name: 'SS4',   data: font('SourceSerif4-60pt-SemiBold.ttf'), weight: 600, style: 'normal' },
  { name: 'SS4',   data: font('SourceSerif4-60pt-Regular.ttf'),  weight: 400, style: 'normal' },
  { name: 'Inter', data: font('Inter-SemiBold.ttf'),             weight: 600, style: 'normal' },
  { name: 'Inter', data: font('Inter-Regular.ttf'),              weight: 400, style: 'normal' },
];

/* ------------------------------------------------------- frontmatter parser */
/** Parser mínimo de YAML frontmatter. Cobre: string, string com aspas,
 *  boolean, lista inline [a, b] e lista em bloco (- a). Suficiente para posts. */
function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val === '') {
      const list = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        list.push(unquote(lines[++i].replace(/^\s*-\s+/, '').trim()));
      }
      out[key] = list.length ? list : '';
      continue;
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      out[key] = val.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean);
      continue;
    }
    if (val === 'true' || val === 'false') { out[key] = val === 'true'; continue; }
    out[key] = unquote(val);
  }
  return out;
}
const unquote = (s) => s.replace(/^['"]|['"]$/g, '');

function findPosts() {
  const found = [];
  for (const rel of CONTENT_DIRS) {
    const dir = path.join(ROOT, rel);
    if (!fs.existsSync(dir)) continue;
    walk(dir, found);
  }
  return found;
}
function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p, acc); continue; }
    if (!/\.mdx?$/.test(e.name)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    const fm = frontmatter(raw);
    if (!fm.title) continue;
    if (fm.draft === true) continue;
    // MESMA regra de slug do site (src/pages/blog/[...slug].astro):
    // basename do arquivo, sem extensao. Posts em pasta/index.md nao sao suportados
    // por essa regra — nem aqui nem no site.
    const slug = fm.slug || path.basename(p).replace(/\.mdx?$/, '');
    const tags = Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []);
    acc.push({ slug, title: String(fm.title), tag: tags[0] || '', src: p, mtime: fs.statSync(p).mtimeMs });
  }
}

/* ------------------------------------------------------------------- layout */
const el = (type, style, children) => ({ type, props: { style, children } });

function tree({ title, tag, size, P }) {
  const head = [el('div', { width: 64, height: 4, backgroundColor: GREEN, marginBottom: P.ruleGap })];
  if (tag) {
    head.push(el('div', {
      fontFamily: 'Inter', fontSize: P.tag, fontWeight: 600, letterSpacing: P.tag * 0.16,
      color: GREEN, marginBottom: P.tagGap,
    }, tag.toUpperCase()));
  }
  head.push(el('div', {
    fontFamily: 'SS4', fontWeight: 600, fontSize: size, lineHeight: 1.13,
    letterSpacing: size * -0.022, color: INK,
  }, title));

  return el('div', {
    width: P.W, height: P.H, backgroundColor: PAPER, padding: P.pad,
    display: 'flex', flexDirection: 'column', fontFamily: 'SS4',
  }, [
    el('div', { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }, head),
    el('div', {
      borderTop: `1px solid ${BORDER}`, paddingTop: P.footPad,
      display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    }, [
      el('div', { display: 'flex', flexDirection: 'row', fontFamily: 'SS4', fontWeight: 600, fontSize: P.wm, color: INK }, [
        el('span', {}, SITE_NAME), el('span', { color: GREEN }, '.'),
      ]),
      el('div', { fontFamily: 'Inter', fontWeight: 400, fontSize: P.url, color: GREY }, DOMAIN),
    ]),
  ]);
}

/** Conta linhas reais medindo o SVG que o satori devolve sem converter em path. */
async function countLines(title, size, P) {
  const svg = await satori(tree({ title, tag: '', size, P }), {
    width: P.W, height: P.H, fonts: FONTS, embedFont: false,
  });
  const ys = new Set();
  for (const m of svg.matchAll(/<text[^>]*\sy="([\d.]+)"/g)) ys.add(Math.round(Number(m[1])));
  return ys.size || 1;
}

/** Maior corpo que ainda cabe em P.maxLines. Busca binária, ~6 medições. */
async function fitSize(title, P) {
  let lo = P.tMin, hi = P.tMax, best = P.tMin;
  if ((await countLines(title, hi, P)) <= P.maxLines) return hi;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if ((await countLines(title, mid, P)) <= P.maxLines) { best = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

async function render(post, kind) {
  const P = PRESETS[kind];
  const size = await fitSize(post.title, P);
  const svg = await satori(tree({ title: post.title, tag: post.tag, size, P }), {
    width: P.W, height: P.H, fonts: FONTS, embedFont: true,
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: P.W } }).render().asPng();
  const out = path.join(OUT_DIR, `${post.slug}-${kind}.png`);
  fs.writeFileSync(out, png);
  return { out, size };
}

/* --------------------------------------------------------------------- main */
const force = process.argv.includes('--force');
fs.mkdirSync(OUT_DIR, { recursive: true });

const posts = findPosts();
if (!posts.length) {
  console.error('[covers] nenhum post encontrado. Ajuste CONTENT_DIRS em scripts/generate-covers.mjs');
  process.exit(1);
}

let made = 0, skipped = 0;
for (const post of posts) {
  for (const kind of ['og', 'cover']) {
    const out = path.join(OUT_DIR, `${post.slug}-${kind}.png`);
    if (!force && fs.existsSync(out) && fs.statSync(out).mtimeMs > post.mtime) { skipped++; continue; }
    const r = await render(post, kind);
    console.log(`[covers] ${path.basename(r.out)}  ${PRESETS[kind].W}x${PRESETS[kind].H}  título ${r.size}px`);
    made++;
  }
}

// fallback do site (home, about, 404)
const def = path.join(OUT_DIR, 'default-og.png');
if (force || !fs.existsSync(def)) {
  const P = PRESETS.og;
  const svg = await satori(tree({ title: 'Think — and live — a little better.', tag: '', size: 62, P }),
    { width: P.W, height: P.H, fonts: FONTS, embedFont: true });
  fs.writeFileSync(def, new Resvg(svg, { fitTo: { mode: 'width', value: P.W } }).render().asPng());
  console.log('[covers] default-og.png  1200x630');
  made++;
}

console.log(`[covers] ${made} gerada(s), ${skipped} já atualizada(s).`);

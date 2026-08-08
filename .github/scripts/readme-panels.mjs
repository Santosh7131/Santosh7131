/**
 * Renders the static README panels as self-contained SVGs in one design
 * system, in matching dark and light variants.
 *
 * Every string in DATA comes from Santosh's resume/LinkedIn or his own
 * answers — nothing here is inferred. Edit DATA and re-run to update:
 *   node .github/scripts/readme-panels.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { iconTile } from './skill-icons.mjs';

const DATA = {
  // Name / role / education now live in profile-card.mjs, which renders the single
  // identity panel (hero + live stats + language bar). Kept in one place on purpose.
  // One card per project. Sourced from `public: true` notes in the shared brain
  // (Obsidian Vault / 30-projects). Anything not cleared there stays out of here.
  projects: [
    {
      slug: 'aura',
      eyebrow: 'FEATURED PROJECT',
      title: 'AURA Preprocessor',
      // Corrected 2026-08-09 against the actual repo (Santosh7131/Aura-Preprocessor,
      // "AutoDataPreprocessor"): a Flask web app + CLI on pandas/scikit-learn/Groq.
      // The earlier card claimed FastAPI + React/TypeScript + Llama-3.3-70b, none of
      // which the repo contains — every line here traces to its README.
      lead: 'LLM-guided data preprocessing, with a human in the loop.',
      bullets: [
        'A Groq LLM reads a raw CSV/Excel dataset and proposes cleaning strategies',
        'You choose which fixes to apply — interactive, not blind automation',
        'Outputs a cleaned dataset and suggests suitable ML models',
      ],
      // Santosh 2026-08-07: the Wells Fargo Ideathon was a small event and he does not
      // want it featured. Leave `award` empty; the panel collapses without it.
      award: '',
      tech: ['Python', 'Flask', 'pandas', 'scikit-learn', 'Groq'],
      cta: 'explore the repo  →',
    },
    {
      slug: 'drive',
      eyebrow: 'PROJECT',
      title: 'AI Learns To Drive',
      lead: 'A neural network teaches itself to race — no hand-coded driving rules.',
      bullets: [
        'Trained with PPO in PyTorch; the driver is a small Transformer reading distance sensors',
        'Re-implemented in TypeScript so the simulation and the network run client-side, no server',
        'Wipe the brain and watch a fresh network learn to drive, live, in the browser',
      ],
      award: '',
      tech: ['Python', 'PyTorch', 'TypeScript', 'React', 'Three.js', 'WebGPU'],
      cta: 'try the live demo  →',
    },
    {
      slug: 'portfolio',
      eyebrow: 'PROJECT',
      title: 'Portfolio',
      // Wording agreed 2026-08-07 in the personal-website note. Deliberately omits
      // the easter egg — that note says it is only worth anything as a discovery.
      lead: 'A scroll-driven portfolio, built as its own work sample.',
      bullets: [
        'Full-height scenes where scrolling scrubs an authored timeline',
        'Every animation gated on a reduced-motion preference, with an on-page toggle',
        'Two scenes added in August so it introduces the person, not just the craft',
      ],
      award: '',
      tech: ['React 19', 'TypeScript', 'Vite', 'GSAP', 'Lenis'],
      cta: 'visit the site  →'
    },
  ],
  stack: [
    { label: 'languages', items: ['Python', 'JavaScript', 'TypeScript', 'C++', 'Java', 'SQL'] },
    { label: 'frameworks', items: ['React', 'Node.js', 'Express', 'FastAPI', 'pandas', 'scikit-learn'] },
    { label: 'tools', items: ['Azure OCR', 'Groq API', 'PostgreSQL', 'MongoDB', 'Docker', 'Git', 'Vercel'] },
  ],
};

const THEMES = {
  dark: {
    key: 'dark',
    bg: '#0d1117', panel: '#161b22', border: '#30363d',
    text: '#e6edf3', muted: '#8b949e', accent: '#58a6ff',
    chipBg: '#161b22', track: '#21262d', gold: '#e3b341',
  },
  light: {
    key: 'light',
    bg: '#ffffff', panel: '#f6f8fa', border: '#d0d7de',
    text: '#1f2328', muted: '#656d76', accent: '#0969da',
    chipBg: '#f6f8fa', track: '#eaeef2', gold: '#9a6700',
  },
};

const W = 900;
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace";

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** rough advance width for the system sans stack */
const textW = (s, size) => s.length * size * 0.545;

const shell = (h, t, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${h - 1}" rx="14" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
${body}
</svg>
`;

/** chips laid out left→right with wrapping; returns {svg, height} */
function chipRow(items, t, x0, y0, maxW, opts = {}) {
  const fs = opts.fs ?? 12.5;
  const padX = 11, h = 26, gap = 8, lineGap = 9;
  let x = x0, y = y0, out = '';
  for (const it of items) {
    const w = Math.round(textW(it, fs)) + padX * 2;
    if (x + w > x0 + maxW) { x = x0; y += h + lineGap; }
    out += `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${t.chipBg}" stroke="${t.border}" stroke-width="1"/>
      <text x="${x + padX}" y="${y + 17.5}" font-family="${MONO}" font-size="${fs}" fill="${t.muted}">${esc(it)}</text>
    </g>`;
    x += w + gap;
  }
  return { svg: out, height: y + h - y0 };
}

// ── featured project ─────────────────────────────────────────────────────
function projectCard(a, t) {
  const B0 = 158; // first bullet baseline
  const bullets = a.bullets.map((b, i) => `
  <g>
    <circle cx="50" cy="${B0 - 4 + i * 27}" r="3" fill="${t.accent}"/>
    <text x="66" y="${B0 + i * 27}" font-family="${FONT}" font-size="14" fill="${t.muted}">${esc(b)}</text>
  </g>`).join('');

  // positions flow downward, so an absent award collapses cleanly
  let y = B0 + a.bullets.length * 27;
  let award = '';
  if (a.award) {
    award = `
  <text x="44" y="${y + 6}" font-family="${FONT}" font-size="13.5" fill="${t.gold}">★  ${esc(a.award)}</text>`;
    y += 26;
  }
  const chipsY = y - 6;
  const chips = chipRow(a.tech, t, 44, chipsY, W - 88);
  const H = chipsY + chips.height + 58;

  const body = `
  <text x="44" y="58" font-family="${FONT}" font-size="15" font-weight="600" fill="${t.muted}" letter-spacing="1.2">${esc(a.eyebrow)}</text>
  <text x="44" y="98" font-family="${FONT}" font-size="30" font-weight="700" fill="${t.text}">${esc(a.title)}</text>
  <text x="44" y="126" font-family="${FONT}" font-size="15" fill="${t.text}">${esc(a.lead)}</text>
${bullets}${award}
${chips.svg}
  <text x="44" y="${H - 22}" font-family="${MONO}" font-size="13" fill="${a.inactive ? t.muted : t.accent}">${esc(a.cta)}</text>`;
  return { h: H, svg: shell(H, t, body, `${a.eyebrow.toLowerCase()}: ${a.title} — ${a.lead}`) };
}

// ── tech stack ───────────────────────────────────────────────────────────
const TILE = 54, TGAP = 12;

/** tiles laid out left→right with wrapping; returns {svg, height} */
function iconRow(items, t, x0, y0, maxW) {
  let x = x0, y = y0, out = '';
  for (const it of items) {
    if (x + TILE > x0 + maxW) { x = x0; y += TILE + TGAP; }
    out += iconTile(it, t, x, y, TILE, MONO);
    x += TILE + TGAP;
  }
  return { svg: out, height: y + TILE - y0 };
}

/**
 * One continuous grid, no category headings — chosen 2026-08-09.
 * DATA.stack keeps its three groups only to fix the reading order
 * (languages, then frameworks, then tools); the labels aren't drawn.
 */
function stack(t) {
  const all = DATA.stack.flatMap((r) => r.items);
  const tiles = iconRow(all, t, 44, 46, W - 88);
  const H = 46 + tiles.height + 46;
  const label = `Tech stack: ${all.join(', ')}`;
  return { h: H, svg: shell(H, t, tiles.svg, label) };
}

// ── write ────────────────────────────────────────────────────────────────
mkdirSync('assets', { recursive: true });
const panels = { stack };
for (const [name, fn] of Object.entries(panels)) {
  for (const t of Object.values(THEMES)) {
    const { svg, h } = fn(t);
    const f = `assets/${name}-${t.key}.svg`;
    writeFileSync(f, svg, 'utf8');
    if (t.key === 'dark') console.log(`${f.padEnd(30)} ${W}x${h}`);
  }
}
for (const proj of DATA.projects) {
  for (const t of Object.values(THEMES)) {
    const { svg, h } = projectCard(proj, t);
    const f = `assets/project-${proj.slug}-${t.key}.svg`;
    writeFileSync(f, svg, 'utf8');
    if (t.key === 'dark') console.log(`${f.padEnd(30)} ${W}x${h}`);
  }
}

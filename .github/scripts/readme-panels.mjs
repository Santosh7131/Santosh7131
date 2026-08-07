/**
 * Renders the static README panels as self-contained SVGs in one design
 * system, in matching dark and light variants.
 *
 * Every string in DATA comes from Santosh's resume/LinkedIn or his own
 * answers — nothing here is inferred. Edit DATA and re-run to update:
 *   node .github/scripts/readme-panels.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const DATA = {
  name: 'Santosh Kumaar',
  role: 'Full Stack  ×  Machine Learning',
  meta: 'B.Tech CSE @ SRM  ·  BS Computer Science @ IIT Madras  ·  Chennai, India',
  summary:
    'I build intelligent, scalable systems — MERN applications with ML pipelines behind them.',
  // One card per project. Sourced from `public: true` notes in the shared brain
  // (Obsidian Vault / 30-projects). Anything not cleared there stays out of here.
  projects: [
    {
      slug: 'aura',
      eyebrow: 'FEATURED PROJECT',
      title: 'AURA Preprocessor',
      chip: 'FLAGSHIP',
      lead: 'AI-powered data preprocessing platform.',
      bullets: [
        'Groq Llama-3.3-70b recommends cleaning strategies',
        '15+ ML preprocessing modules built on pandas and scikit-learn',
        'FastAPI backend, React + TypeScript front-end, real-time progress UI',
      ],
      // Santosh 2026-08-07: the Wells Fargo Ideathon was a small event and he does not
      // want it featured. Leave `award` empty; the panel collapses without it.
      award: '',
      tech: ['FastAPI', 'React', 'TypeScript', 'pandas', 'scikit-learn', 'Groq'],
      cta: 'explore the repo  →',
    },
    {
      slug: 'drive',
      eyebrow: 'PROJECT',
      title: 'AI Learns To Drive',
      chip: 'LIVE DEMO',
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
  ],
  portfolio: { title: 'Portfolio v2', note: 'in progress — this space gets the link when it ships', pct: 40 },
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

// ── hero ─────────────────────────────────────────────────────────────────
function hero(t) {
  const H = 232;
  // faint contribution-grid motif, top right
  let grid = '';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 12; c++) {
      const on = (r * 7 + c * 5) % 4;
      grid += `<rect x="${624 + c * 21}" y="${34 + r * 21}" width="15" height="15" rx="3" fill="${t.accent}" opacity="${on === 0 ? 0.5 : on === 1 ? 0.28 : 0.1}"/>`;
    }
  }
  const body = `
  <g>${grid}</g>
  <text x="44" y="72" font-family="${MONO}" font-size="14" fill="${t.muted}">hi, i'm</text>
  <text x="42" y="128" font-family="${FONT}" font-size="54" font-weight="700" fill="${t.text}" letter-spacing="-1">${esc(DATA.name)}</text>
  <rect x="44" y="146" width="180" height="4" rx="2" fill="${t.accent}"/>
  <text x="44" y="182" font-family="${MONO}" font-size="18" fill="${t.accent}">${esc(DATA.role)}</text>
  <text x="44" y="208" font-family="${FONT}" font-size="13" fill="${t.muted}">${esc(DATA.meta)}</text>`;
  return { h: H, svg: shell(H, t, body, `${DATA.name} — ${DATA.role}`) };
}

// ── featured project ─────────────────────────────────────────────────────
function projectCard(a, t) {
  const chipW = Math.round(textW(a.chip, 11)) + 22;
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
  <g>
    <rect x="${52 + Math.round(textW(a.title, 30))}" y="76" width="${chipW}" height="24" rx="7" fill="${t.accent}" opacity="0.16"/>
    <text x="${63 + Math.round(textW(a.title, 30))}" y="92.5" font-family="${MONO}" font-size="11" font-weight="600" fill="${t.accent}" letter-spacing="0.8">${esc(a.chip)}</text>
  </g>
  <text x="44" y="126" font-family="${FONT}" font-size="15" fill="${t.text}">${esc(a.lead)}</text>
${bullets}${award}
${chips.svg}
  <text x="44" y="${H - 22}" font-family="${MONO}" font-size="13" fill="${t.accent}">${esc(a.cta)}</text>`;
  return { h: H, svg: shell(H, t, body, `${a.eyebrow.toLowerCase()}: ${a.title} — ${a.lead}`) };
}

// ── portfolio placeholder ────────────────────────────────────────────────
function portfolio(t) {
  const H = 132;
  const p = DATA.portfolio;
  const barW = W - 88;
  const body = `
  <text x="44" y="52" font-family="${FONT}" font-size="20" font-weight="600" fill="${t.text}">${esc(p.title)}</text>
  <text x="${54 + Math.round(textW(p.title, 20))}" y="51" font-family="${MONO}" font-size="12.5" fill="${t.muted}">${esc(p.note)}</text>
  <rect x="44" y="76" width="${barW}" height="10" rx="5" fill="${t.track}"/>
  <rect x="44" y="76" width="${Math.round((barW * p.pct) / 100)}" height="10" rx="5" fill="${t.accent}"/>
  <text x="44" y="112" font-family="${MONO}" font-size="12" fill="${t.muted}">building…</text>`;
  return { h: H, svg: shell(H, t, body, `${p.title} — ${p.note}`) };
}

// ── tech stack ───────────────────────────────────────────────────────────
function stack(t) {
  let y = 54, body = '';
  for (const row of DATA.stack) {
    body += `
  <text x="44" y="${y}" font-family="${MONO}" font-size="12" fill="${t.muted}" letter-spacing="0.6">${esc(row.label)}</text>`;
    const chips = chipRow(row.items, t, 44, y + 14, W - 88);
    body += chips.svg;
    y += 14 + chips.height + 30;
  }
  const H = y - 10;
  return { h: H, svg: shell(H, t, body, 'Tech stack: languages, frameworks and tools') };
}

// ── clickable contact badges (theme-agnostic: solid fills) ───────────────
function badge(label, bg, fg) {
  const fs = 12.5, h = 34;
  const w = Math.round(textW(label, fs)) + 40;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  <rect width="${w}" height="${h}" rx="8" fill="${bg}"/>
  <text x="${w / 2}" y="${h / 2 + 4.5}" text-anchor="middle" font-family="${FONT}" font-size="${fs}" font-weight="600" fill="${fg}" letter-spacing="0.3">${esc(label)}</text>
</svg>
`;
}

// ── write ────────────────────────────────────────────────────────────────
mkdirSync('assets', { recursive: true });
const panels = { hero, portfolio, stack };
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
const badges = [
  ['badge-email.svg', 'Email', '#d64545', '#ffffff'],
  ['badge-linkedin.svg', 'LinkedIn', '#0a66c2', '#ffffff'],
  ['badge-portfolio.svg', 'Portfolio — soon', '#6e5494', '#ffffff'],
];
for (const [f, label, bg, fg] of badges) {
  writeFileSync(`assets/${f}`, badge(label, bg, fg), 'utf8');
  console.log(`assets/${f}`);
}

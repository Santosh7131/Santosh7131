/**
 * Renders a dashboard-style profile card as a self-contained SVG.
 * Data comes from the GitHub GraphQL API; the avatar is inlined as a
 * data: URI so the SVG works when GitHub serves it through camo (external
 * network requests inside README images are blocked).
 *
 * Usage: GITHUB_TOKEN=... USERNAME=... node .github/scripts/profile-card.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const TOKEN = process.env.GITHUB_TOKEN;
const USER = process.env.USERNAME;
if (!TOKEN || !USER) {
  console.error('GITHUB_TOKEN and USERNAME are required');
  process.exit(1);
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    login
    name
    avatarUrl(size: 160)
    location
    followers { totalCount }
    contributionsCollection {
      contributionCalendar { totalContributions }
      totalCommitContributions
      totalPullRequestContributions
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
});
if (!res.ok) {
  console.error('GraphQL HTTP', res.status, await res.text());
  process.exit(1);
}
const json = await res.json();
if (json.errors) {
  console.error('GraphQL errors:', JSON.stringify(json.errors));
  process.exit(1);
}
const u = json.data.user;

// ---- aggregate ----------------------------------------------------------
const repos = u.repositories.nodes || [];
const stars = repos.reduce((n, r) => n + r.stargazerCount, 0);
const contributions = u.contributionsCollection.contributionCalendar.totalContributions;

// Notebook files embed their own rendered output (base64 images, data dumps),
// so their byte count reflects stored output rather than code written. Left in,
// one notebook repo swamps the whole mix. Empty this list to include them.
const EXCLUDE_LANGS = new Set(['Jupyter Notebook']);

const byLang = new Map();
for (const r of repos) {
  for (const e of r.languages.edges || []) {
    if (EXCLUDE_LANGS.has(e.node.name)) continue;
    const cur = byLang.get(e.node.name) || { size: 0, color: e.node.color };
    cur.size += e.size;
    byLang.set(e.node.name, cur);
  }
}
const totalBytes = [...byLang.values()].reduce((n, v) => n + v.size, 0) || 1;
const ranked = [...byLang.entries()]
  .sort((a, b) => b[1].size - a[1].size)
  .map(([name, v]) => ({ name, pct: (v.size / totalBytes) * 100, color: v.color || '#8b949e' }));
const langs = ranked.slice(0, 5);
const otherPct = ranked.slice(5).reduce((n, l) => n + l.pct, 0);

// avatar -> data URI
const avatarRes = await fetch(u.avatarUrl);
const avatarType = avatarRes.headers.get('content-type') || 'image/png';
const avatarB64 = Buffer.from(await avatarRes.arrayBuffer()).toString('base64');
const avatarData = `data:${avatarType};base64,${avatarB64}`;

// ---- helpers ------------------------------------------------------------
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => n.toLocaleString('en-US');
const round = (n, d = 1) => Number(n.toFixed(d));

// Static identity strings. Kept here (not in readme-panels.mjs) because this panel
// merges the hero and the stats into one block — there is no second name section.
const ID = {
  name: 'Santosh Kumaar',
  // Settled 2026-08-07 in about-me: this is how he is presented publicly,
  // and it should hold for every public artefact.
  role: 'Machine Learning Engineer',
  meta: 'B.Tech CSE @ SRM  ·  BS Computer Science @ IIT Madras  ·  Chennai, India',
  // Drawn inside the panel, so these are copyable text rather than links — an SVG
  // served as an image cannot carry a working hyperlink. Only contacts Santosh has
  // cleared for public use belong here.
  contact: 'rsantoshkumaar2005@gmail.com   ·   linkedin.com/in/santosh7131',
};

const THEMES = {
  dark: {
    file: 'identity-dark.svg',
    bg: '#0d1117', panel: '#161b22', border: '#30363d',
    text: '#e6edf3', muted: '#8b949e', accent: '#58a6ff', track: '#21262d',
  },
  light: {
    file: 'identity-light.svg',
    bg: '#ffffff', panel: '#f6f8fa', border: '#d0d7de',
    text: '#1f2328', muted: '#656d76', accent: '#0969da', track: '#eaeef2',
  },
};

const W = 900, H = 438;
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function card(t) {
  const stats = [
    { label: 'contributions (1y)', value: fmt(contributions) },
    { label: 'public repos', value: fmt(u.repositories.totalCount) },
    { label: 'stars earned', value: fmt(stars) },
    { label: 'followers', value: fmt(u.followers.totalCount) },
  ];

  // stat tiles
  const tileW = 196, gap = 12, x0 = 32, tileY = 252, tileH = 66;
  const tiles = stats.map((s, i) => {
    const x = x0 + i * (tileW + gap);
    return `
    <g>
      <rect x="${x}" y="${tileY}" width="${tileW}" height="${tileH}" rx="10" fill="${t.panel}" stroke="${t.border}" stroke-width="1"/>
      <text x="${x + 16}" y="${tileY + 25}" font-family="${FONT}" font-size="11" fill="${t.muted}" letter-spacing="0.4">${esc(s.label)}</text>
      <text x="${x + 16}" y="${tileY + 52}" font-family="${FONT}" font-size="23" font-weight="600" fill="${t.text}">${esc(s.value)}</text>
    </g>`;
  }).join('');

  // language bar — segments are clipped to a rounded track so both ends curve
  const barX = 32, barY = 364, barW = W - 64, barH = 10;
  const drawn = otherPct > 0.05 ? [...langs, { name: 'other', pct: otherPct, color: t.muted }] : langs;
  let cx = barX;
  const segs = drawn.map((l) => {
    const w = Math.max((l.pct / 100) * barW, 2);
    const seg = `<rect x="${round(cx, 2)}" y="${barY}" width="${round(w, 2)}" height="${barH}" fill="${l.color}"/>`;
    cx += w;
    return seg;
  }).join('');

  // legend
  let lx = barX;
  const legend = langs.map((l) => {
    const label = `${l.name} ${round(l.pct)}%`;
    const g = `
    <g>
      <circle cx="${lx + 5}" cy="${barY + 40}" r="5" fill="${l.color}"/>
      <text x="${lx + 17}" y="${barY + 44}" font-family="${FONT}" font-size="12.5" fill="${t.muted}">${esc(label)}</text>
    </g>`;
    lx += 30 + label.length * 6.9;
    return g;
  }).join('');

  // faint contribution-grid motif, top right — carried over from the hero panel
  let grid = '';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 12; c++) {
      const on = (r * 7 + c * 5) % 4;
      grid += `<rect x="${624 + c * 21}" y="${34 + r * 21}" width="15" height="15" rx="3" fill="${t.accent}" opacity="${on === 0 ? 0.5 : on === 1 ? 0.28 : 0.1}"/>`;
    }
  }

  // only show counts that are actually non-zero — a printed "0" reads as a gap
  const cc = u.contributionsCollection;
  const activity =
    [
      [cc.totalCommitContributions, 'commit'],
      [cc.totalPullRequestContributions, 'pull request'],
    ]
      .filter(([n]) => n > 0)
      .map(([n, w]) => `${fmt(n)} ${w}${n === 1 ? '' : 's'}`)
      .join('  ·  ') + '  (past year)';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ID.name)} — ${esc(ID.role)}. ${esc(ID.meta)}. Contact: ${esc(ID.contact)}. ${esc(activity)}.">
  <title>${esc(ID.name)} — ${esc(ID.role)}</title>
  <defs>
    <clipPath id="barClip"><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="5"/></clipPath>
  </defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
  <g>${grid}</g>

  <text x="44" y="72" font-family="${MONO}" font-size="14" fill="${t.muted}">hi, i'm</text>
  <text x="42" y="128" font-family="${FONT}" font-size="54" font-weight="700" fill="${t.text}" letter-spacing="-1">${esc(ID.name)}</text>
  <rect x="44" y="146" width="180" height="4" rx="2" fill="${t.accent}"/>
  <text x="44" y="182" font-family="${MONO}" font-size="18" fill="${t.accent}">${esc(ID.role)}</text>
  <text x="44" y="208" font-family="${FONT}" font-size="13" fill="${t.muted}">${esc(ID.meta)}</text>
  <text x="44" y="230" font-family="${FONT}" font-size="13" fill="${t.muted}">${esc(ID.contact)}</text>
${tiles}
  <text x="${barX}" y="${barY - 14}" font-family="${FONT}" font-size="11" fill="${t.muted}" letter-spacing="0.4">language mix</text>
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="5" fill="${t.track}"/>
  <g clip-path="url(#barClip)">
${segs}
  </g>
${legend}
</svg>
`;
}

mkdirSync('assets', { recursive: true });
for (const t of Object.values(THEMES)) {
  writeFileSync(`assets/${t.file}`, card(t), 'utf8');
  console.log('wrote assets/' + t.file);
}
console.log(`data: ${contributions} contributions, ${u.repositories.totalCount} repos, ${stars} stars, ${u.followers.totalCount} followers`);
console.log('languages:', langs.map((l) => `${l.name} ${round(l.pct)}%`).join(', '));

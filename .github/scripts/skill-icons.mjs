/**
 * Inlines vendored skill-icons (.github/icons) into a generated panel.
 *
 * The icons are committed to this repo rather than fetched from skillicons.dev,
 * because every image on this profile is self-hosted on purpose. See
 * .github/icons/LICENSE-skill-icons.md.
 *
 * Upstream tiles are 256x256 with a rounded-square background:
 *   - `-Dark`  variants sit on #242938
 *   - `-Light` variants sit on #F4F2ED
 *   - single-variant tiles carry the brand colour and work on either theme
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICON_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');

/**
 * Which upstream slug backs each stack entry. `null` means upstream has no icon
 * for it — those render as a typographic tile instead, so nothing is dropped.
 * `themed: false` means one brand-coloured file serves both themes.
 */
export const ICON_MAP = {
  'Python':        { slug: 'Python',       themed: true  },
  'JavaScript':    { slug: 'JavaScript',   themed: false },
  'TypeScript':    { slug: 'TypeScript',   themed: false },
  'C++':           { slug: 'CPP',          themed: false },
  'Java':          { slug: 'Java',         themed: true  },
  'SQL':           { slug: null },
  'React':         { slug: 'React',        themed: true  },
  'Node.js':       { slug: 'NodeJS',       themed: true  },
  'Express':       { slug: 'ExpressJS',    themed: true  },
  'FastAPI':       { slug: 'FastAPI',      themed: false },
  'pandas':        { slug: null },
  // upstream ships ScikitLearn-Dark only; the dark tile reads as brand colour
  'scikit-learn':  { slug: 'ScikitLearn',  themed: true, only: 'Dark' },
  'Azure OCR':     { slug: 'Azure',        themed: true  },
  'Groq API':      { slug: null },
  'PostgreSQL':    { slug: 'PostgreSQL',   themed: true  },
  'MongoDB':       { slug: 'MongoDB',      themed: false },
  'Docker':        { slug: 'Docker',       themed: false },
  'Git':           { slug: 'Git',          themed: false },
  'Vercel':        { slug: 'Vercel',       themed: true  },
};

const cache = new Map();

function loadIcon(file) {
  if (cache.has(file)) return cache.get(file);
  const p = join(ICON_DIR, `${file}.svg`);
  if (!existsSync(p)) throw new Error(`missing vendored icon: ${file}.svg — see .github/icons/`);
  const raw = readFileSync(p, 'utf8');
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  cache.set(file, inner);
  return inner;
}

/**
 * Upstream ids (`paint0_linear_2_47`) repeat across files. Inlining several into
 * one document would make them collide and cross-wire the gradients, so every id
 * and every url(#…) reference is namespaced per tile.
 */
function namespaceIds(svg, ns) {
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    const safe = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    svg = svg
      .replace(new RegExp(`\\bid="${safe}"`, 'g'), `id="${ns}_${id}"`)
      .replace(new RegExp(`url\\(#${safe}\\)`, 'g'), `url(#${ns}_${id})`)
      .replace(new RegExp(`xlink:href="#${safe}"`, 'g'), `xlink:href="#${ns}_${id}"`);
  }
  return svg;
}

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** a tile for something upstream has no icon for — same geometry, his own type */
function wordTile(label, t, x, y, size, mono) {
  const r = size * (60 / 256);
  // shrink to fit: the tile is square, so long words need a smaller face
  const fs = Math.min(size * 0.26, (size - 10) / (label.length * 0.58));
  return `
    <g>
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r.toFixed(1)}"
            fill="${t.chipBg}" stroke="${t.border}" stroke-width="1"/>
      <text x="${x + size / 2}" y="${y + size / 2 + fs * 0.36}" text-anchor="middle"
            font-family="${mono}" font-size="${fs.toFixed(1)}" fill="${t.muted}">${esc(label)}</text>
    </g>`;
}

/** one tile, inlined at (x, y) and scaled from the 256-unit source box */
export function iconTile(name, t, x, y, size, mono) {
  const spec = ICON_MAP[name];
  if (!spec) throw new Error(`no icon mapping for "${name}" — add it to ICON_MAP`);
  if (!spec.slug) return wordTile(name, t, x, y, size, mono);

  const variant = spec.themed ? (spec.only ?? (t.key === 'dark' ? 'Dark' : 'Light')) : null;
  const file = variant ? `${spec.slug}-${variant}` : spec.slug;
  const ns = `${spec.slug}${variant ?? ''}`.replace(/[^A-Za-z0-9]/g, '');
  const inner = namespaceIds(loadIcon(file), ns);

  return `
    <svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 256 256">${inner}</svg>`;
}

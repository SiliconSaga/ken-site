// Pixel-diff baseline vs candidate screenshots produced by shoot.mjs. Emits
// before/after/diff PNGs for changed routes, an HTML report, a ready-to-post
// sticky comment (comment.md), and summary.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [, , baseDir, candDir, pubDir, previewUrl] = process.argv;
if (!baseDir || !candDir || !pubDir || !previewUrl) {
  console.error('usage: diff.mjs <baselineDir> <candidateDir> <publishDir> <previewUrl>');
  process.exit(2);
}
const VIEWPORTS = ['mobile', 'desktop'];
const PXTHRESH = 0.1;   // pixelmatch per-pixel color sensitivity
const MINPIX = 50;      // ignore sub-visual noise below this many changed pixels

const baseRoutes = JSON.parse(readFileSync(join(baseDir, 'routes.json'), 'utf8'));
const candRoutes = JSON.parse(readFileSync(join(candDir, 'routes.json'), 'utf8'));
const san = (r) => (r === '/' ? 'home' : r.replace(/^\/|\/$/g, '').replace(/\//g, '__'));
const common = candRoutes.filter((r) => baseRoutes.includes(r));
const added = candRoutes.filter((r) => !baseRoutes.includes(r));
const removed = baseRoutes.filter((r) => !candRoutes.includes(r));

function pad(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  out.data.fill(0xff); // white
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

mkdirSync(pubDir, { recursive: true });
const changed = [];
for (const r of common) {
  let routeChanged = false;
  for (const vp of VIEWPORTS) {
    const bp = join(baseDir, `${san(r)}__${vp}.png`);
    const cp = join(candDir, `${san(r)}__${vp}.png`);
    if (!existsSync(bp) || !existsSync(cp)) continue;
    const a = PNG.sync.read(readFileSync(bp));
    const b = PNG.sync.read(readFileSync(cp));
    const w = Math.max(a.width, b.width);
    const h = Math.max(a.height, b.height);
    const A = pad(a, w, h);
    const B = pad(b, w, h);
    const diff = new PNG({ width: w, height: h });
    const n = pixelmatch(A.data, B.data, diff.data, w, h, { threshold: PXTHRESH });
    if (n > MINPIX) {
      routeChanged = true;
      const sub = join(pubDir, san(r));
      mkdirSync(sub, { recursive: true });
      writeFileSync(join(sub, `before__${vp}.png`), PNG.sync.write(A));
      writeFileSync(join(sub, `after__${vp}.png`), PNG.sync.write(B));
      writeFileSync(join(sub, `diff__${vp}.png`), PNG.sync.write(diff));
    }
  }
  if (routeChanged) changed.push(r);
}
for (const r of added) {
  const sub = join(pubDir, san(r));
  mkdirSync(sub, { recursive: true });
  for (const vp of VIEWPORTS) {
    const cp = join(candDir, `${san(r)}__${vp}.png`);
    if (existsSync(cp)) copyFileSync(cp, join(sub, `after__${vp}.png`));
  }
}

writeFileSync(join(pubDir, 'summary.json'), JSON.stringify({ changed, added, removed }, null, 2));

// --- HTML report ---
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let html = `<!doctype html><meta charset=utf8><title>Visual diff PR</title>`
  + `<style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:2rem auto;padding:0 1rem}`
  + `img{max-width:100%;border:1px solid #ccc}h2{margin-top:2.5rem}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem}`
  + `.tag{font:12px monospace;background:#eee;padding:.1rem .4rem;border-radius:3px}</style>`;
html += `<h1>Visual diff</h1><p>${changed.length} changed &middot; ${added.length} new &middot; ${removed.length} removed`
  + ` &middot; ${common.length} routes compared.</p>`;
for (const r of changed) {
  html += `<h2><span class=tag>${esc(r)}</span></h2>`;
  for (const vp of VIEWPORTS) {
    if (!existsSync(join(pubDir, san(r), `diff__${vp}.png`))) continue;
    html += `<h3>${vp}</h3><div class=grid>`
      + `<figure><figcaption>before</figcaption><img src="${san(r)}/before__${vp}.png"></figure>`
      + `<figure><figcaption>after</figcaption><img src="${san(r)}/after__${vp}.png"></figure>`
      + `<figure><figcaption>diff</figcaption><img src="${san(r)}/diff__${vp}.png"></figure></div>`;
  }
}
if (added.length) html += `<h2>New pages</h2><ul>${added.map((r) => `<li><span class=tag>${esc(r)}</span> `
  + `<a href="${san(r)}/after__desktop.png">screenshot</a></li>`).join('')}</ul>`;
if (removed.length) html += `<h2>Removed pages</h2><ul>${removed.map((r) => `<li><span class=tag>${esc(r)}</span></li>`).join('')}</ul>`;
writeFileSync(join(pubDir, 'index.html'), html);

// --- sticky comment ---
let md = `<!-- pr-visual-diff -->\n### 🖼️ Visual diff\n\n`;
if (!changed.length && !added.length && !removed.length) {
  md += `No visual changes detected across ${common.length} routes.\n`;
} else {
  if (changed.length) {
    md += `**Changed:** ${changed.map((r) => `\`${r}\``).join(', ')}\n\n`;
    for (const r of changed) {
      md += `#### \`${r}\`\n\n![diff mobile](${previewUrl}${san(r)}/diff__mobile.png)\n\n`
        + `[mobile before](${previewUrl}${san(r)}/before__mobile.png) &middot; `
        + `[after](${previewUrl}${san(r)}/after__mobile.png) &middot; `
        + `[desktop diff](${previewUrl}${san(r)}/diff__desktop.png)\n\n`;
    }
  }
  if (added.length) md += `**New pages:** ${added.map((r) => `\`${r}\``).join(', ')}\n\n`;
  if (removed.length) md += `**Removed pages:** ${removed.map((r) => `\`${r}\``).join(', ')}\n\n`;
}
md += `\n[Full report](${previewUrl}index.html) &middot; [Preview site](${previewUrl.replace(/_diff\/$/, '')})\n`;
writeFileSync(join(pubDir, 'comment.md'), md);

console.log(`diff: ${changed.length} changed, ${added.length} new, ${removed.length} removed`);

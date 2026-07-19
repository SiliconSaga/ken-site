// Pixel-diff baseline vs candidate screenshots produced by shoot.mjs. Emits
// before/after/diff PNGs for changed routes, an HTML report, a ready-to-post
// sticky comment (comment.md), and summary.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { san } from './slug.mjs';

const [, , baseDir, candDir, pubDir, previewUrl] = process.argv;
if (!baseDir || !candDir || !pubDir || !previewUrl) {
  console.error('usage: diff.mjs <baselineDir> <candidateDir> <publishDir> <previewUrl>');
  process.exit(2);
}
const VIEWPORTS = ['mobile', 'desktop'];
const PXTHRESH = 0.1;   // pixelmatch per-pixel color sensitivity
const MINPIX = 50;      // ignore sub-visual noise below this many changed pixels
const CROP_MARGIN = 48; // px of context kept around the changed region

const baseRoutes = JSON.parse(readFileSync(join(baseDir, 'routes.json'), 'utf8'));
const candRoutes = JSON.parse(readFileSync(join(candDir, 'routes.json'), 'utf8'));
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

// Bounding box of pixels that differ between two same-size images (RGB, small
// tolerance). Returns null if nothing meaningfully differs.
function changedBox(a, b, w, h) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (Math.abs(a.data[i] - b.data[i]) > 10 ||
          Math.abs(a.data[i + 1] - b.data[i + 1]) > 10 ||
          Math.abs(a.data[i + 2] - b.data[i + 2]) > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

// Crop a PNG to the box + margin (clamped). Full image back if box is null.
function cropTo(png, box, margin, w, h) {
  if (!box) return png;
  const x0 = Math.max(0, box.minX - margin);
  const y0 = Math.max(0, box.minY - margin);
  const x1 = Math.min(w, box.maxX + margin + 1);
  const y1 = Math.min(h, box.maxY + margin + 1);
  const out = new PNG({ width: x1 - x0, height: y1 - y0 });
  PNG.bitblt(png, out, x0, y0, x1 - x0, y1 - y0, 0, 0);
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
      // Crop before/after/diff to a tight box around the change (+ margin) so a
      // one-line edit doesn't post a full-page-tall screenshot.
      const box = changedBox(A, B, w, h);
      writeFileSync(join(sub, `before__${vp}.png`), PNG.sync.write(cropTo(A, box, CROP_MARGIN, w, h)));
      writeFileSync(join(sub, `after__${vp}.png`), PNG.sync.write(cropTo(B, box, CROP_MARGIN, w, h)));
      writeFileSync(join(sub, `diff__${vp}.png`), PNG.sync.write(cropTo(diff, box, CROP_MARGIN, w, h)));
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
      md += `#### \`${r}\`\n\n`;
      // Only reference viewport images that were actually emitted (a route can
      // change in one viewport but not the other).
      for (const vp of VIEWPORTS) {
        if (!existsSync(join(pubDir, san(r), `diff__${vp}.png`))) continue;
        md += `**${vp}** — ![diff](${previewUrl}${san(r)}/diff__${vp}.png)\n\n`
          + `[before](${previewUrl}${san(r)}/before__${vp}.png) &middot; `
          + `[after](${previewUrl}${san(r)}/after__${vp}.png)\n\n`;
      }
    }
  }
  if (added.length) md += `**New pages:** ${added.map((r) => `\`${r}\``).join(', ')}\n\n`;
  if (removed.length) md += `**Removed pages:** ${removed.map((r) => `\`${r}\``).join(', ')}\n\n`;
}
md += `\n[Full report](${previewUrl}index.html) &middot; [Preview site](${previewUrl.replace(/_diff\/$/, '')})\n`;
writeFileSync(join(pubDir, 'comment.md'), md);

console.log(`diff: ${changed.length} changed, ${added.length} new, ${removed.length} removed`);

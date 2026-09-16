import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import initSqlJs from 'sql.js';
import * as D from '../shared/domain.js';
import {populatedPriceFields} from '../shared/price-comparison.js';

fs.mkdirSync('offline-built', {recursive: true});
await build({
  entryPoints: ['offline/app.jsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['chrome100', 'edge100'],
  outfile: 'offline-built/app.js',
  define: {'process.env.NODE_ENV': '"production"'},
  legalComments: 'none'
});

const css = fs.readFileSync('offline-built/app.css', 'utf8');
const js = fs.readFileSync('offline-built/app.js', 'utf8');

const html = seedScript => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Vũ Gia · So sánh sản phẩm</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body><div id="root">Đang mở phần mềm…</div>${seedScript}<script>${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;

// Load sqlite database to extract products and brands
const SQL = await initSqlJs();
const db = new SQL.Database(fs.readFileSync('data/vugia.sqlite'));
const get = c => {
  const stmt = db.prepare('SELECT body FROM records WHERE collection=?');
  stmt.bind([c]);
  const out = [];
  while (stmt.step()) out.push(JSON.parse(stmt.getAsObject().body));
  stmt.free();
  return out;
};

const products = get('products').map(p =>
  Object.fromEntries(
    [...D.fields.map(f => f.key), 'id', 'priceHistory', 'updatedAt', 'imageSource', 'quoteReview', 'extra']
      .filter(k => p[k] !== undefined)
      .map(k => [k, p[k]])
  )
);
const brands = get('brands').map(({name}) => ({name}));

// Direct embed in index.html for zero-dependency standalone use
const lightSeed = JSON.stringify({products, brands, images: {}}).replace(/</g, '\\u003c');
fs.writeFileSync('index.html', html(`<script>window.VUGIA_SEED=${lightSeed};</script>`));

// Also generate data/seed-data.json
fs.writeFileSync('data/seed-products.json', JSON.stringify({products, brands}, null, 2));

if (process.argv.includes('--with-data')) {
  const images = {};
  for (const p of products) {
    for (const src of [p.image, ...String(p.images || '').split('\n'), p.packaging].filter(Boolean)) {
      if (src.startsWith('/api/assets/')) {
        const file = path.resolve('data/assets', src.slice('/api/assets/'.length));
        if (!file.startsWith(path.resolve('data/assets') + path.sep)) continue;
        if (!fs.existsSync(file)) continue;
        const ext = path.extname(file).slice(1).toLowerCase();
        const mime = {jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', gif: 'gif'}[ext];
        if (!mime) continue;
        images[src] = 'data:image/' + mime + ';base64,' + fs.readFileSync(file).toString('base64');
      }
    }
  }
  const fullSeed = JSON.stringify({products, brands, images}).replace(/</g, '\\u003c');
  fs.writeFileSync('data/offline-seed.js', 'window.VUGIA_SEED=' + fullSeed + ';');
  fs.mkdirSync('BAN-OFFLINE', {recursive: true});
  fs.writeFileSync('BAN-OFFLINE/index.html', html(`<script>window.VUGIA_SEED=${fullSeed};</script>`));
}

db.close();
console.log(`Built index.html with ${products.length} embedded products and ${brands.length} brands.`);

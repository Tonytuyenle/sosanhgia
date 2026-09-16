import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import initSqlJs from 'sql.js';
import * as D from '../shared/domain.js';
import {populatedPriceFields} from '../shared/price-comparison.js';
fs.mkdirSync('offline-built',{recursive:true});
await build({entryPoints:['offline/app.jsx'],bundle:true,minify:true,format:'iife',target:['chrome100','edge100'],outfile:'offline-built/app.js',define:{'process.env.NODE_ENV':'"production"'},legalComments:'none'});
const css=fs.readFileSync('offline-built/app.css','utf8'),js=fs.readFileSync('offline-built/app.js','utf8');
const html=seed=>`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Vũ Gia · So sánh sản phẩm</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>${css}</style></head><body><div id="root">Đang mở phần mềm…</div>${seed}<script>${js.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
fs.writeFileSync('index.html',html('<script src="data/offline-seed.js"></script>'));
if(process.argv.includes('--with-data')){
 const SQL=await initSqlJs(),db=new SQL.Database(fs.readFileSync('data/vugia.sqlite'));
 const get=c=>{const stmt=db.prepare('SELECT body FROM records WHERE collection=?');stmt.bind([c]);const out=[];while(stmt.step())out.push(JSON.parse(stmt.getAsObject().body));stmt.free();return out;};
 const products=get('products').map(p=>Object.fromEntries([...D.fields.map(f=>f.key),'id','priceHistory','updatedAt','imageSource','quoteReview','extra'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))),brands=get('brands').map(({name})=>({name})),images={};
 for(const p of products)for(const src of [p.image,...String(p.images||'').split('\n'),p.packaging].filter(Boolean))if(src.startsWith('/api/assets/')){
  const file=path.resolve('data/assets',src.slice('/api/assets/'.length));if(!file.startsWith(path.resolve('data/assets')+path.sep))throw Error('Invalid asset path');if(!fs.existsSync(file))throw Error('Missing image: '+src);
  const ext=path.extname(file).slice(1).toLowerCase(),mime={jpg:'jpeg',jpeg:'jpeg',png:'png',webp:'webp',gif:'gif'}[ext];if(!mime)continue;images[src]='data:image/'+mime+';base64,'+fs.readFileSync(file).toString('base64');
 }
 const seed=JSON.stringify({products,brands,images}).replace(/</g,'\\u003c');
 fs.writeFileSync('data/offline-seed.js','window.VUGIA_SEED='+seed+';');
 fs.mkdirSync('BAN-OFFLINE',{recursive:true});fs.writeFileSync('BAN-OFFLINE/index.html',html('<script>window.VUGIA_SEED='+seed+';</script>'));
 const priced=products.filter(p=>populatedPriceFields([p]).some(f=>f.type==='money'));
 const report={products:products.length,priced:priced.length,noPrice:products.filter(p=>!priced.includes(p)).map(p=>({brand:p.brand,code:p.code,name:p.name})),images:Object.keys(images).length,priceFields:populatedPriceFields(products).map(f=>f.key),hare:products.find(p=>p.code==='HR-CD1208')};
 fs.writeFileSync('tmp/price-audit.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({products:products.length,priced:priced.length,noPrice:report.noPrice.length,images:report.images,portableBytes:fs.statSync('BAN-OFFLINE/index.html').size}));db.close();
}
console.log('Built direct-open index.html');

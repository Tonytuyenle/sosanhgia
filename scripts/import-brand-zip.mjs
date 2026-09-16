import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as db from '../server/db.js';
import * as D from '../shared/domain.js';
import {brandKey} from '../shared/brands.js';
const base='tmp/brands-20260916',m=JSON.parse(fs.readFileSync(base+'/prepared.json','utf8'));
assert.equal(m.products.length,307);
for(const r of m.products)assert.deepEqual(D.validate(r.input),[],r.input.code);
for(const s of m.sources)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(base,'assets',s.asset))).digest('hex'),s.sha256);
if(process.argv.includes('--check')){console.log('307 records validated; 7 source hashes verified.');process.exit(0);}
let running=false;try{running=(await fetch('http://127.0.0.1:4173/api/status',{signal:AbortSignal.timeout(1200)})).ok;}catch{}
assert.ok(!running,'Stop the application before SQLite maintenance');assert.ok(!process.env.DATABASE_URL);
const at=new Date().toISOString(),actor='Nhập bảng giá ZIP theo yêu cầu người dùng',batch='brands-20260916';
const backup=path.join(db.dataDir,'backups','before-brands-'+at.replace(/[:.]/g,'-')+'.sqlite');fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(path.join(db.dataDir,'vugia.sqlite'),backup);
const assets=path.join(db.dataDir,'assets',batch);fs.mkdirSync(assets,{recursive:true});for(const file of fs.readdirSync(base+'/assets'))fs.copyFileSync(path.join(base,'assets',file),path.join(assets,file));
await db.init();const before=await db.all('products');
const result=await db.transaction(async()=>{
 let added=0,updated=0;const ids=[];
 for(const row of m.products){
  const input=row.input,found=before.filter(p=>brandKey(p.brand)===brandKey(input.brand)&&p.code===input.code);assert.ok(found.length<=1);
  const old=found[0];if(old&&!old.sourceDocuments?.some(s=>s.file===row.source.file))assert.equal(old.name,input.name,'Existing code belongs to a different product');
  const sha=m.sources.find(s=>s.file===row.source.file).sha256;
  const quoteReview=row.warnings.filter(w=>!w.startsWith('Mã nhà cung cấp dùng chung')&&!w.startsWith('Nguồn không có mã')&&!w.startsWith('Combo có nhiều mã'));
  const p={...old,...input,id:old?.id||crypto.randomUUID(),demo:false,updatedAt:at,updatedBy:actor,raw:{...(old?.raw||{}),...input},warnings:row.warnings,quoteReview,sourceDocuments:[...(old?.sourceDocuments||[]).filter(s=>s.file!==row.source.file),{...row.source,sha256:sha}],priceHistory:[...(old?.priceHistory||[])]};
  const changes=D.fields.filter(f=>f.type==='money'&&D.has(input[f.key])&&old?.[f.key]!==input[f.key]).map(f=>({field:f.key,before:old?.[f.key]??null,after:input[f.key]}));
  if(changes.length)p.priceHistory.push({at,by:actor,source:input.source,changes});
  p.normalized=D.normalizeProduct(input).data;assert.deepEqual(D.validate(p),[],p.code);
  await db.put('products',p);ids.push(p.id);
  await db.put('audit',{id:crypto.randomUUID(),at,user:actor,userId:'maintenance:brand-zip',action:old?'Cập nhật bảng giá hãng':'Thêm sản phẩm từ bảng giá hãng',subject:p.brand+' '+p.code,before:old||null,after:p});
  const key=brandKey(p.brand);if(!await db.get('brands',key))await db.put('brands',{id:key,name:p.brand,createdAt:at});
  if(old)updated++;else added++;
 }
 const all=await db.all('products');
 for(const id of ids){const p=all.find(p=>p.id===id),existing=await db.get('matches',id);if(!existing||existing.status==='AI đề xuất')await db.put('matches',{id,ids:D.candidates(p,all).map(c=>c.id),status:'AI đề xuất',at});}
 await db.put('imports',{id:crypto.randomUUID(),file:'BÁO GIÁ.zip',at,by:actor,added,updated,skipped:0,mode:'Báo giá 11 hãng — tách loại giá và biến thể',sources:m.sources,warnings:m.products.filter(r=>r.warnings.length).map(r=>({brand:r.input.brand,code:r.input.code,warnings:r.warnings}))});
 return {added,updated,reviewProducts:m.products.filter(r=>r.warnings.some(w=>!w.startsWith('Mã nhà cung cấp dùng chung')&&!w.startsWith('Nguồn không có mã')&&!w.startsWith('Combo có nhiều mã'))).length};
});
const after=await db.all('products');
for(const r of m.products){const p=after.find(p=>p.brand===r.input.brand&&p.code===r.input.code);for(const [k,v] of Object.entries(r.input))assert.deepEqual(p[k],v,p.code+' '+k);}
for(const p of before.filter(p=>['Lock&King','Takin'].includes(p.brand)))assert.deepEqual(after.find(q=>q.id===p.id),p,'Existing L&K/Takin record must remain intact');
const counts={};for(const r of m.products)counts[r.input.brand]=(counts[r.input.brand]||0)+1;
const report={...result,at,backup,totalProducts:after.length,counts};fs.writeFileSync(base+'/import-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

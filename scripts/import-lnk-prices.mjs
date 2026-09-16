import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as db from '../server/db.js';
import * as D from '../shared/domain.js';

// Maintenance import: stop the local application first so its in-memory SQLite
// instance cannot overwrite this transaction. Never change account records.
let running=false;
try{const r=await fetch('http://127.0.0.1:4173/api/status',{signal:AbortSignal.timeout(1500)});running=r.ok;}catch{}
if(running)throw Error('Dừng máy chủ Vũ Gia trước khi nhập bảo trì.');
if(process.env.DATABASE_URL)throw Error('Quy trình này chỉ dành cho SQLite cục bộ.');
const manifest=JSON.parse(fs.readFileSync('tmp/pdfs/lnk/import-ready.json','utf8'));
const source=fs.readFileSync(manifest.sourceFile);
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),manifest.sourceSha256);
assert.equal(manifest.products.length,43);
assert.equal(new Set(manifest.products.map(p=>p.code)).size,43);
assert.equal(manifest.products.reduce((sum,p)=>sum+p.npp,0),23181000);
for(const p of manifest.products){assert.equal(D.validate(p).length,0,JSON.stringify(D.validate(p)));assert.equal(p.npp,Number(p._pdf.npp.replace(/[^0-9]/g,'')));}
const timestamp=new Date().toISOString(),stamp=timestamp.replace(/[:.]/g,'-');
const backups=path.join(db.dataDir,'backups');fs.mkdirSync(backups,{recursive:true});
const backup=path.join(backups,'before-lnk-'+stamp+'.sqlite');fs.copyFileSync(path.join(db.dataDir,'vugia.sqlite'),backup);
const assetFolder=path.join(db.dataDir,'assets','lnk-20260905');fs.mkdirSync(assetFolder,{recursive:true});
for(const filename of fs.readdirSync('tmp/pdfs/lnk/assets'))fs.copyFileSync(path.join('tmp/pdfs/lnk/assets',filename),path.join(assetFolder,filename));
fs.writeFileSync(path.join(assetFolder,'gia-lnk.pdf'),source);
await db.init();
const actor='Nhập PDF theo yêu cầu người dùng';
const result=await db.transaction(async()=>{
 const existing=await db.all('products');let added=0,updated=0;
 const ids=[];
 for(const entry of manifest.products){
  const {_pdf,...input}=entry;
  const matches=existing.filter(p=>D.own(p)&&D.norm(p.code)===D.norm(input.code));
  assert.ok(matches.length<=1,'Trùng mã hiện có: '+input.code);
  const old=matches[0]||null;
  const id=old?.id||crypto.randomUUID();
  const normalized=D.normalizeProduct(input);
  const after={...old,...input,id,demo:false,updatedAt:timestamp,updatedBy:actor,raw:{...(old?.raw||{}),...input},normalized:normalized.data,warnings:normalized.warnings,normalizationConfirmed:null,sourceDocument:{file:'giá lnk.pdf',sha256:manifest.sourceSha256,quotation:manifest.quotation,date:manifest.quotationDate,..._pdf},priceHistory:[...(old?.priceHistory||[]),...(old?.npp!==input.npp?[{at:timestamp,by:actor,source:input.source,changes:[{field:'npp',before:old?.npp??null,after:input.npp}]}]:[])]};
  await db.put('products',after);
  await db.put('audit',{id:crypto.randomUUID(),at:timestamp,user:actor,userId:'maintenance:pdf-import',action:old?'Cập nhật giá NPP từ PDF':'Thêm sản phẩm và giá NPP từ PDF',subject:input.code,before:old,after});
  ids.push(id);if(old)updated++;else added++;
 }
 const products=await db.all('products');
 for(const p of products.filter(p=>!D.own(p))){const previous=await db.get('matches',p.id);if(!previous||previous.status==='AI đề xuất')await db.put('matches',{id:p.id,ids:D.candidates(p,products).map(c=>c.id),status:'AI đề xuất',at:timestamp});}
 const importId=crypto.randomUUID();
 await db.put('imports',{id:importId,file:'giá lnk.pdf',at:timestamp,by:actor,added,updated,skipped:0,mode:'PDF — Giá NPP Offline',sourceSha256:manifest.sourceSha256,quotation:manifest.quotation,quotationDate:manifest.quotationDate,raw:manifest.products.map(p=>p._pdf)});
 return {added,updated,count:ids.length,ids,importId,backup};
});
const saved=await db.all('products');
for(const p of manifest.products){const q=saved.find(q=>q.code===p.code&&D.own(q));assert.equal(q.npp,p.npp);assert.equal(q.image,p.image);assert.equal(q.surveyDate,'2026-09-05');assert.ok(fs.existsSync(path.join(db.dataDir,'assets',q.image.slice('/api/assets/'.length))));}
fs.writeFileSync('tmp/pdfs/lnk/import-result.json',JSON.stringify({...result,at:timestamp,sourceSha256:manifest.sourceSha256},null,2));
console.log(JSON.stringify({added:result.added,updated:result.updated,count:result.count,images:43,priceSum:23181000,backup:result.backup}));

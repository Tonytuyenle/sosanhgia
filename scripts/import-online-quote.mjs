import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as db from '../server/db.js';
import * as D from '../shared/domain.js';
let running=false;try{running=(await fetch('http://127.0.0.1:4173/api/status',{signal:AbortSignal.timeout(1500)})).ok;}catch{}
if(running)throw Error('Dừng ứng dụng trước khi nhập vào SQLite.');
if(process.env.DATABASE_URL)throw Error('Chỉ hỗ trợ quy trình bảo trì SQLite cục bộ.');
const manifest=JSON.parse(fs.readFileSync('tmp/pdfs/online-20260914/import-ready.json','utf8'));
const bytes=fs.readFileSync(manifest.sourceFile);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sourceSha256);
assert.equal(manifest.products.length,56);
assert.equal(manifest.products.filter(p=>p.input.brand==='Lock&King').length,43);
assert.equal(manifest.products.filter(p=>p.input.brand==='Takin').length,13);
for(const row of manifest.products)assert.deepEqual(D.validate(row.input),[],row.input.code);
const at=new Date().toISOString(),actor='Nhập PDF Online theo yêu cầu người dùng';
const backup=path.join(db.dataDir,'backups','before-online-'+at.replace(/[:.]/g,'-')+'.sqlite');
fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(path.join(db.dataDir,'vugia.sqlite'),backup);
const assets=path.join(db.dataDir,'assets','online-20260914');fs.mkdirSync(assets,{recursive:true});
fs.writeFileSync(path.join(assets,'bang-gia-online.pdf'),bytes);
for(const name of fs.readdirSync('tmp/pdfs/online-20260914/assets'))fs.copyFileSync(path.join('tmp/pdfs/online-20260914/assets',name),path.join(assets,name));
await db.init();
const result=await db.transaction(async()=>{
 const before=await db.all('products');let added=0,updated=0;const records=[];
 for(const row of manifest.products){
  const input=row.input;
  const found=before.filter(p=>D.norm(p.brand)===D.norm(input.brand)&&D.norm(p.code)===D.norm(input.code));
  assert.ok(found.length<=1,'Nhiều sản phẩm trùng mã '+input.code);
  const old=found[0]||null,id=old?.id||crypto.randomUUID();
  const newSource=`${row.source.file} — báo giá kênh Online — ngày 05/09/2026 — trang ${row.source.page}, STT ${row.source.row}`;
  const note='Giá Facebook và giá sàn TMĐT là mức giá trong báo giá nhà cung cấp, chưa phải khảo sát giá online thấp nhất. Lợi nhuận NPP theo báo giá chưa trừ phí bán hàng.';
  const p={...old,...input,id,demo:false,updatedAt:at,updatedBy:actor,source:[old?.source,newSource].filter(Boolean).join('\n'),sourceDocuments:[...(old?.sourceDocuments||[]),...(old?.sourceDocument?[old.sourceDocument]:[]),{...row.source,sha256:manifest.sourceSha256}],onlineQuote:{...row.source,sha256:manifest.sourceSha256,warnings:row.warnings},extra:[old?.extra,note,...row.warnings].filter(Boolean).join('\n'),raw:{...(old?.raw||{}),...input},priceHistory:[...(old?.priceHistory||[])]};
  if(!old){p.surveyDate='2026-09-05';p.priceSource=input.onlinePriceSource;p.channel='Online, Facebook, Livestream và sàn TMĐT';}
  const changes=['nppOnline','facebookPrice','marketplacePrice','quotedNppProfit','quotedNppMargin'].filter(k=>old?.[k]!==input[k]).map(k=>({field:k,before:old?.[k]??null,after:input[k]}));
  if(changes.length)p.priceHistory.push({at,by:actor,source:newSource,changes});
  const normalized=D.normalizeProduct(Object.fromEntries(D.fields.filter(f=>p[f.key]!==undefined).map(f=>[f.key,p[f.key]])));
  p.normalized=normalized.data;p.warnings=[...normalized.warnings,...row.warnings];
  assert.deepEqual(D.validate(p),[],p.code);
  if(old)assert.equal(p.npp,old.npp,'Giá Offline phải được giữ nguyên');
  await db.put('products',p);
  await db.put('audit',{id:crypto.randomUUID(),at,user:actor,userId:'maintenance:pdf-online-import',action:old?'Cập nhật bảng giá Online':'Thêm sản phẩm và bảng giá Online',subject:input.code,before:old,after:p});
  records.push({id,code:p.code,brand:p.brand,npp:p.npp??null,nppOnline:p.nppOnline});if(old)updated++;else added++;
 }
 const products=await db.all('products');
 for(const rival of products.filter(p=>!D.own(p))){const m=await db.get('matches',rival.id);if(!m||m.status==='AI đề xuất')await db.put('matches',{id:rival.id,ids:D.candidates(rival,products).map(m=>m.id),status:'AI đề xuất',at});}
 await db.put('imports',{id:crypto.randomUUID(),file:path.basename(manifest.sourceFile),at,by:actor,added,updated,skipped:0,mode:'PDF — NPP Online / Facebook / Sàn TMĐT',sourceSha256:manifest.sourceSha256,raw:manifest.products.map(p=>p.source),warnings:manifest.products.filter(p=>p.warnings.length).map(p=>({code:p.input.code,warnings:p.warnings}))});
 return {added,updated,records};
});
const after=await db.all('products');
for(const row of manifest.products){const p=after.find(p=>p.code===row.input.code&&p.brand===row.input.brand);for(const k of ['nppOnline','facebookPrice','marketplacePrice','quotedNppProfit','quotedNppMargin'])assert.equal(p[k],row.input[k],p.code+' '+k);if(p.image?.startsWith('/api/assets/'))assert.ok(fs.existsSync(path.join(db.dataDir,'assets',p.image.slice('/api/assets/'.length))));}
fs.writeFileSync('tmp/pdfs/online-20260914/import-result.json',JSON.stringify({...result,at,backup},null,2));
console.log(JSON.stringify({added:result.added,updated:result.updated,lockKing:after.filter(p=>p.brand==='Lock&King').length,takin:after.filter(p=>p.brand==='Takin').length,offlinePreserved:true,warnings:manifest.products.filter(p=>p.warnings.length).map(p=>p.input.code),backup}));

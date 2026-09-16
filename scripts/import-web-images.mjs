import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as db from '../server/db.js';
const base='tmp/image-update', ready=JSON.parse(fs.readFileSync(base+'/ready.json','utf8'));
let running=false;try{running=(await fetch('http://127.0.0.1:4173/api/status',{signal:AbortSignal.timeout(1200)})).ok;}catch{}
assert.ok(!running,'Stop application before SQLite maintenance');assert.ok(!process.env.DATABASE_URL);
const at=new Date().toISOString(), actor='Cập nhật ảnh website hãng theo yêu cầu người dùng';
const backup=path.join(db.dataDir,'backups','before-web-images-'+at.replace(/[:.]/g,'-')+'.sqlite');
fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(path.join(db.dataDir,'vugia.sqlite'),backup);
await db.init();const before=await db.all('products');assert.equal(new Set(ready.map(r=>r.id)).size,ready.length);
const dest=path.join(db.dataDir,'assets','web-images-20260916');fs.mkdirSync(dest,{recursive:true});
for(const r of ready){const p=before.find(p=>p.id===r.id);assert.ok(p&&!p.image);assert.equal(p.brand,r.brand);assert.equal(p.code,r.code);assert.ok(r.size[0]>=120&&r.size[1]>=120);assert.ok(/^https:\/\//.test(r.page));fs.copyFileSync(path.join(base,'assets',r.asset),path.join(dest,r.asset));}
await db.transaction(async()=>{
 for(const r of ready){
  const old=before.find(p=>p.id===r.id),p={...old,image:'/api/assets/web-images-20260916/'+r.asset,imageSource:{page:r.page,url:r.url,checkedAt:at,model:r.model,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dest,r.asset))).digest('hex')},extra:[old.extra,'Ảnh sản phẩm từ website hãng: '+r.page].filter(Boolean).join('\n'),updatedAt:at,updatedBy:actor};
  await db.put('products',p);await db.put('audit',{id:crypto.randomUUID(),at,user:actor,userId:'maintenance:web-images',action:'Bổ sung ảnh từ website hãng',subject:p.brand+' '+p.code,before:old,after:p});
 }
 const after=await db.all('products');assert.equal(after.length,before.length);
 for(const old of before){const next=after.find(p=>p.id===old.id);for(const k of Object.keys(old))if(!['image','imageSource','extra','updatedAt','updatedBy'].includes(k))assert.deepEqual(next[k],old[k],old.code+' '+k);if(old.image)assert.equal(next.image,old.image);}
});
const after=await db.all('products');const result={updated:ready.length,remaining:after.filter(p=>!p.image).length,total:after.length,backup,at};
fs.writeFileSync(base+'/import-result.json',JSON.stringify(result,null,2));
const pending=JSON.parse(fs.readFileSync(base+'/pending.json','utf8'));
const reason=p=>['FN-PL228','FN-PL226','KL-0311DT'].includes(p.code)?'Mã hàng và tên trong bảng giá mâu thuẫn; cần xác nhận đúng mẫu.':p.code==='MR8001H'?'Bảng giá ghi MR8001H; website ghi MR800IH, cần xác nhận hai mã là cùng sản phẩm.':/^(COMBO|CB)/.test(p.code)?'Chưa tìm được ảnh chính thức đúng cả bộ combo.':'Chưa tìm được ảnh công khai trên website hãng khớp chính xác mã và biến thể.';
fs.writeFileSync('KET-QUA-CAP-NHAT-ANH-20260916.md',`# Kết quả bổ sung ảnh sản phẩm\n\nĐã bổ sung ${ready.length}/54 ảnh còn thiếu, giữ nguyên giá và các ảnh đã có. Còn ${result.remaining} sản phẩm cần bổ sung. Ảnh được lưu trong phần mềm, nguồn lưu ở ghi chú từng sản phẩm.\n\n## Đã cập nhật\n\n| Hãng | Mã | Nguồn |\n|---|---|---|\n`+ready.map(r=>`| ${r.brand} | ${r.code} | [Trang hãng](${r.page}) |`).join('\n')+'\n\n## Cần bổ sung hoặc xác nhận\n\n| Hãng | Mã | Lý do |\n|---|---|---|\n'+pending.map(p=>`| ${p.brand} | ${p.code} | ${reason(p)} |`).join('\n')+'\n');
console.log(JSON.stringify(result));

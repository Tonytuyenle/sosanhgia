import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
import * as db from './db.js';
import * as D from '../shared/domain.js';
import {initialBrands,brandKey,listBrands,sheetName} from '../shared/brands.js';
export async function initializeBrands(){
 if(await db.get('settings','brandRegistryV1'))return;
 await db.transaction(async()=>{for(const name of initialBrands){const id=brandKey(name);if(!await db.get('brands',id))await db.put('brands',{id,name});}await db.put('settings',{id:'brandRegistryV1',initialized:true});});
}
export function registerBrandRoutes(app){
 const route=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
 app.get('/api/brands',route(async(req,res)=>res.json(listBrands(await db.all('brands'),await db.all('products')))));
 app.post('/api/brands',route(async(req,res)=>{
  if(!['admin','leader'].includes(req.user.role))return res.status(403).json({error:'Chỉ quản trị viên hoặc Ban lãnh đạo được thêm hãng.'});
  const names=Array.isArray(req.body.names)?req.body.names:String(req.body.names||'').split(/[\n,;]+/);
  if(!names.length||names.length>1000||names.some(n=>typeof n!=='string'||n.trim().length>120||/[\u0000-\u001f]/.test(n.trim())))return res.status(400).json({error:'Nhập tối đa 1.000 hãng mỗi lần, mỗi tên tối đa 120 ký tự.'});
  const cleaned=[...new Map(names.map(n=>n.trim().replace(/\s+/g,' ')).filter(Boolean).map(n=>[brandKey(n),n])).values()];
  if(!cleaned.length)return res.status(400).json({error:'Nhập ít nhất một tên hãng.'});
  const result=await db.transaction(async()=>{const existing=listBrands(await db.all('brands'),await db.all('products'));const keys=new Set(existing.map(b=>b.key));let added=0;
   for(const name of cleaned){const id=brandKey(name);if(keys.has(id))continue;await db.put('brands',{id,name,createdAt:new Date().toISOString(),createdBy:req.user.name});keys.add(id);added++;}
   await db.put('audit',{id:crypto.randomUUID(),at:new Date().toISOString(),user:req.user.name,userId:req.user.id,action:'Thêm danh mục hãng',subject:added+' hãng',before:null,after:{names:cleaned,added}});
   return {added,skipped:cleaned.length-added};
  });res.json(result);
 }));
 app.get('/api/brands.xlsx',route(async(req,res)=>{
  const products=await db.all('products');let brands=listBrands(await db.all('brands'),products);
  if(req.query.brand)brands=brands.filter(b=>b.key===brandKey(req.query.brand));
  if(!brands.length)return res.status(404).json({error:'Không tìm thấy hãng.'});
  const visible=D.fields.filter(f=>D.canFinance(req.user.role)||!D.privateKeys.includes(f.key));
  const wb=XLSX.utils.book_new(),used=new Set();
  for(const brand of brands){const rows=products.filter(p=>brandKey(p.brand)===brand.key);const sheet=XLSX.utils.aoa_to_sheet([visible.map(f=>f.label),...rows.map(p=>visible.map(f=>p[f.key]??''))]);sheet['!cols']=visible.map(f=>({wch:f.key==='name'||f.key==='source'?45:24}));sheet['!autofilter']={ref:XLSX.utils.encode_range({r:0,c:0},{r:Math.max(0,rows.length),c:visible.length-1})};XLSX.utils.book_append_sheet(wb,sheet,sheetName(brand.name,used));}
  res.set('Cache-Control','no-store');res.set('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.set('Content-Disposition','attachment; filename="Vu-Gia-Moi-Hang-Mot-Sheet.xlsx"');res.send(Buffer.from(XLSX.write(wb,{type:'buffer',bookType:'xlsx'})));
 }));
}

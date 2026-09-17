import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import * as D from '../shared/domain.js';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const ctx=await browser.newContext();const page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const saved=()=>page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('vugia-offline-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return new Promise((resolve,reject)=>{const r=db.transaction('data').objectStore('data').get('state');r.onsuccess=()=>{resolve(r.result);db.close();};r.onerror=()=>reject(r.error);});});
async function find(code){await page.getByRole('button',{name:'Sản phẩm đối thủ',exact:true}).click();await page.getByLabel('Tìm sản phẩm',{exact:true}).fill(code);}
try{
 await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'load'});await page.locator('.app').waitFor();
 const fixture=await page.evaluate(()=>{for(const p of window.VUGIA_SEED.products){if(!p.source?.includes('BẢNG GIÁ'))continue;const field=['npp','distributorPrice','wholesalePrice','minimum','retailPrice','listPrice'].find(k=>p[k]!==null&&p[k]!==undefined&&p[k]!==''&&Number.isFinite(Number(p[k])));if(field)return {product:p,field};}});
 assert.ok(fixture,'Need seeded quote fixture to exercise former overwrite');const sample=fixture.product,field=fixture.field,newPrice=Number(sample[field])+123;
 await find(sample.code);await page.locator('.product-card').first().locator('.product-title').click();
 await page.getByRole('button',{name:'Chỉnh sửa',exact:true}).click();
 const editor=page.locator('.modal.editor');await editor.getByRole('button',{name:'Giá và chi phí',exact:true}).click();
 await editor.getByLabel(D.labels[field],{exact:true}).fill(String(newPrice));
 await editor.getByRole('button',{name:'Lưu sản phẩm',exact:true}).click();await editor.waitFor({state:'hidden'});
 await page.reload({waitUntil:'load'});await page.locator('.app').waitFor();
 const edited=(await saved()).products.find(p=>p.id===sample.id);assert.equal(edited[field],newPrice);assert.ok(edited.priceHistory.length>(sample.priceHistory||[]).length);
 await find(sample.code);await page.locator('.product-card').first().locator('.product-title').click();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Xóa sản phẩm',exact:true}).click();await page.locator('.modal-backdrop').waitFor({state:'hidden'});
 await page.reload({waitUntil:'load'});await page.locator('.app').waitFor();assert.ok(!(await saved()).products.some(p=>p.id===sample.id));
 await page.locator('.sidebar nav button').filter({hasText:'Quản trị & Sao lưu'}).click();
 const syncButton=page.locator('.attention button.primary');page.once('dialog',d=>d.dismiss());await syncButton.click();assert.ok(!(await saved()).products.some(p=>p.id===sample.id));
 page.once('dialog',d=>d.accept());await syncButton.click();
 await page.waitForFunction(async id=>{const db=await new Promise(resolve=>{const r=indexedDB.open('vugia-offline-v1',1);r.onsuccess=()=>resolve(r.result);});return new Promise(resolve=>{const r=db.transaction('data').objectStore('data').get('state');r.onsuccess=()=>{resolve(r.result.products.some(p=>p.id===id));db.close();};});},sample.id);
 assert.equal((await saved()).products.find(p=>p.id===sample.id)[field],sample[field]);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({priceEditReload:'passed',deleteReload:'passed',manualSyncCancel:'passed',manualSyncConfirm:'passed',errors}));
}finally{await ctx.close();await browser.close();}

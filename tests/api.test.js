import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
const port=49173,base=`http://127.0.0.1:${port}`,folder=path.resolve('test-results','api-'+Date.now());
fs.mkdirSync(folder,{recursive:true});
let child;
async function start(){child=spawn(process.execPath,['server/index.js'],{cwd:process.cwd(),env:{...process.env,DATABASE_URL:'',PORT:String(port),DATA_DIR:folder},windowsHide:true,stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Máy chủ kiểm thử không khởi động')),15000);child.stdout.on('data',b=>{if(b.toString().includes('Vũ Gia V2')){clearTimeout(t);resolve()}});child.on('exit',code=>{clearTimeout(t);reject(Error('Máy chủ dừng: '+code))});child.stderr.on('data',()=>{});});}
async function stop(){if(child&&child.exitCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;}}
async function request(url,body,cookie='',method='POST'){const res=await fetch(base+'/api'+url,{method:body===undefined?'GET':method,headers:{...(body instanceof FormData?{}:{'Content-Type':'application/json'}),Cookie:cookie},...(body!==undefined?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
test('Nghiệm thu API: lưu thực, Excel, phân quyền, kiểm duyệt và khôi phục',async t=>{
 await start();t.after(stop);
 const password='Test-only-'+crypto.randomBytes(12).toString('hex');
 assert.equal((await request('/data')).status,401);
 const setup=await request('/setup',{name:'Quản trị kiểm thử',email:'test@vugia.example',password});assert.equal(setup.status,200);const admin=setup.cookie;
 assert.equal((await request('/setup',{name:'X',email:'x@vugia.example',password})).status,409);
 assert.equal((await request('/demo',{},admin)).status,200);
 let data=(await request('/data',undefined,admin)).data;assert.equal(data.products.length,11);assert.equal(data.products.find(p=>p.id==='demo-gap').gap,'confirmed');assert.ok(data.products.some(p=>p.score.score!==null));assert.ok(data.products.every(p=>p.matching.length<=3));
 for(const role of ['sales','marketing','purchasing'])assert.equal((await request('/users',{name:role,email:role+'@vugia.example',password,role,active:true},admin)).status,200);
 const sales=(await request('/login',{email:'sales@vugia.example',password})).cookie;
 const marketing=(await request('/login',{email:'marketing@vugia.example',password})).cookie;
 const purchasing=(await request('/login',{email:'purchasing@vugia.example',password})).cookie;
 assert.equal((await request('/products/demo-lk-0',{cost:1},sales,'PUT')).status,403);
 assert.equal((await request('/weights',{},sales,'PUT')).status,403);
 assert.equal((await request('/users',undefined,sales)).status,403);
 assert.equal((await request('/products/demo-lk-0',{online:720000},sales,'PUT')).status,200);
 assert.equal((await request('/products/demo-lk-0',{description:'Nội dung kiểm thử'},marketing,'PUT')).status,200);
 assert.equal((await request('/products/demo-lk-0',{cost:450000},purchasing,'PUT')).status,200);
 assert.equal((await request('/proposals/demo-lk-0',{status:'Đã duyệt nhập'},purchasing)).status,403);
 assert.equal((await request('/opportunities/demo-gap',{status:'Đang nghiên cứu',targetCost:1500000,suggestedPrice:3000000},admin,'PUT')).status,200);
 const salesData=(await request('/data',undefined,sales)).data;
 assert.equal(salesData.products[0].cost,undefined);assert.equal(salesData.products[0].raw,undefined);assert.equal(salesData.opportunities[0].targetCost,undefined);
 assert.ok(salesData.products.flatMap(p=>p.priceHistory||[]).flatMap(h=>h.changes).every(c=>c.field!=='cost'));
 assert.equal((await request('/matches/demo-rival-0',{ids:['demo-lk-0','demo-lk-1','demo-lk-2','demo-lk-3']},admin)).status,400);
 assert.equal((await request('/matches/demo-rival-0',{ids:['demo-lk-1']},sales)).status,200);
 data=(await request('/data',undefined,admin)).data;assert.deepEqual(data.products.find(p=>p.id==='demo-rival-0').matching.map(m=>m.id),['demo-lk-1']);
 assert.equal((await request('/matches/demo-rival-0',{ids:[]},sales)).status,200);
 data=(await request('/data',undefined,admin)).data;assert.equal(data.products.find(p=>p.id==='demo-rival-0').matching.length,0);
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Mã sản phẩm','Tên sản phẩm','Thương hiệu','Nhóm ngành hàng','Dung tích (lít hoặc ml)'],['EX-1','Bình kiểm thử Excel','Lock&King','Bình giữ nhiệt','500 ml'],['EX-2','Bình tham chiếu Excel','Hãng E','Bình giữ nhiệt','0.5 l']]),'Sản phẩm');
 const form=new FormData();form.append('file',new Blob([XLSX.write(wb,{type:'buffer',bookType:'xlsx'})]),'test.xlsx');
 const preview=await request('/import/preview',form,admin);assert.equal(preview.status,200);assert.equal(preview.data.count,2);const importBody={id:preview.data.id,mapping:preview.data.mapping};
 const validation=await request('/import/validate',importBody,admin);assert.equal(validation.status,200);assert.ok(validation.data.rows.every(r=>r.errors.length===0));
 const commit=await request('/import/commit',{...importBody,mode:'skip',confirm:true},admin);assert.equal(commit.status,200);assert.equal(commit.data.added,2);
 const form2=new FormData();form2.append('file',new Blob([XLSX.write(wb,{type:'buffer',bookType:'xlsx'})]),'test.xlsx');const preview2=await request('/import/preview',form2,admin);const v2=await request('/import/validate',{id:preview2.data.id,mapping:preview2.data.mapping},admin);assert.ok(v2.data.rows.every(r=>r.duplicate));
 const template=await fetch(base+'/api/template',{headers:{Cookie:admin}});assert.equal(template.status,200);assert.ok(XLSX.read(await template.arrayBuffer()).SheetNames.includes('Sản phẩm'));
 const exported=await fetch(base+'/api/report.xlsx',{headers:{Cookie:sales}});assert.equal(exported.status,200);const exportedBook=XLSX.read(await exported.arrayBuffer());const exportedRows=XLSX.utils.sheet_to_json(exportedBook.Sheets['Sản phẩm']);assert.equal(exportedRows.length,13);assert.equal(exportedRows[0]['Giá nhập'],undefined);
 const initial=(await request('/brands',undefined,admin)).data;
 for(const name of ['Lock&King','Takin','Jiwon','Morico','Hare','Hatzz','Engler','Seka','WMF','Goldsun','Yoke'])assert.ok(initial.some(b=>b.name===name));
 assert.equal((await request('/brands',{names:'Forbidden'},sales)).status,403);
 const brandNames=Array.from({length:100},(_,i)=>'Hãng kiểm thử '+i).concat(['A/B','A:B','X'.repeat(80)]);
 assert.equal((await request('/brands',{names:brandNames.join('\n')},admin)).data.added,103);
 assert.equal((await request('/brands',{names:'jiwon,JIWON'},admin)).data.added,0);
 const allBrands=(await request('/brands',undefined,admin)).data;
 const brandExport=await fetch(base+'/api/brands.xlsx',{headers:{Cookie:sales}});assert.equal(brandExport.status,200);
 const brandBook=XLSX.read(await brandExport.arrayBuffer());assert.equal(brandBook.SheetNames.length,allBrands.length);
 assert.equal(new Set(brandBook.SheetNames.map(n=>n.toLowerCase())).size,allBrands.length);
 assert.ok(brandBook.SheetNames.every(n=>n.length<=31));
 const lockRows=XLSX.utils.sheet_to_json(brandBook.Sheets['Lock&King']);assert.ok(lockRows.length>0);assert.ok(lockRows.every(r=>r['Thương hiệu']==='Lock&King'&&r['Giá nhập']===undefined));
 assert.equal(XLSX.utils.sheet_to_json(brandBook.Sheets['Jiwon']).length,0);
 const single=await fetch(base+'/api/brands.xlsx?brand=Takin',{headers:{Cookie:admin}});assert.deepEqual(XLSX.read(await single.arrayBuffer()).SheetNames,['Takin']);
 const weights={demand:35,price:15,profit:0,quality:15,difference:10,onlinePotential:10,gtPotential:10,service:5};assert.equal((await request('/weights',weights,admin,'PUT')).status,200);
 assert.ok((await request('/audit',undefined,admin)).data.length>10);
 assert.equal((await request('/products/demo-gap',{},admin,'DELETE')).status,400);
 await stop();await start();data=(await request('/data',undefined,admin)).data;assert.equal(data.products.length,13);assert.equal(data.weights.demand,35);assert.equal(data.imports.length,1);
 if(process.env.UI_TEST==='1'){
  const {chromium}=await import('playwright');const executablePath=process.env.BROWSER_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';const browser=await chromium.launch({executablePath,headless:true});try{const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.getByLabel('Email',{exact:true}).fill('test@vugia.example');await page.getByLabel('Mật khẩu',{exact:true}).fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.getByRole('heading',{name:'Tổng quan',exact:true}).waitFor();await page.getByText('11', {exact:true}).count();await page.waitForTimeout(500);await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true});
  for(const name of ['Sản phẩm Lock&King','Sản phẩm đối thủ','Nhập dữ liệu Excel','Ghép cặp sản phẩm','So sánh sản phẩm','Giá & lợi nhuận','Điểm cạnh tranh','Cơ hội sản phẩm mới','Đề xuất nhập hàng','Báo cáo & xuất dữ liệu','Quản trị hệ thống']){await page.locator('nav').getByRole('button',{name,exact:false}).click();await page.getByRole('heading',{name,exact:true}).waitFor();}
  await page.locator('nav').getByRole('button',{name:'Sản phẩm Lock&King',exact:true}).click();await page.screenshot({path:'test-results/catalog-desktop.png',fullPage:true});await page.getByRole('button',{name:'Bình thủy điện Lock&King 3 l',exact:true}).click();await page.getByRole('dialog').waitFor();assert.ok(await page.getByRole('dialog').getByRole('heading',{name:'Bình thủy điện Lock&King 3 l',exact:true}).isVisible());await page.getByRole('button',{name:'So sánh ngay',exact:true}).click();await page.getByRole('heading',{name:'So sánh sản phẩm',exact:true}).waitFor();
  await page.locator('.picker-items').getByRole('button',{name:'DT-101 · Bình thủy điện tham khảo 3 l',exact:false}).click();assert.equal(await page.locator('.comparison-table thead th').count(),3);
  for(const code of ['LK-302','LK-303','LK-304'])await page.locator('.picker-items').getByRole('button',{name:new RegExp(code)}).click();assert.equal(await page.locator('.comparison-table thead th').count(),6);
  await page.locator('.picker-items').getByRole('button',{name:/LK-305/}).click();assert.equal(await page.locator('.comparison-table thead th').count(),6);
  await page.screenshot({path:'test-results/comparison-desktop.png',fullPage:true});
  await page.locator('nav').getByRole('button',{name:'Báo cáo & xuất dữ liệu',exact:true}).click();await page.pdf({path:'test-results/Bao-cao-kiem-thu.pdf',format:'A4',landscape:true,printBackground:true});
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Mở menu',exact:true}).click();await page.locator('nav').getByRole('button',{name:'Sản phẩm Lock&King',exact:true}).click();await page.waitForTimeout(300);await page.screenshot({path:'test-results/catalog-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 }
});

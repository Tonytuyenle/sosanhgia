import test from 'node:test';
import assert from 'node:assert/strict';
import {listBrands,sheetName} from '../shared/brands.js';
test('Danh mục 100 hãng tách đúng sản phẩm và không lặp chữ hoa/thường',()=>{const saved=Array.from({length:100},(_,i)=>({id:String(i),name:'Hãng '+i}));const p=[{brand:'HÃNG 1'},{brand:'Hãng 1'},{brand:'Lock & King'}];const b=listBrands(saved,p);assert.equal(b.length,101);assert.equal(b[0].key,'lockking');assert.equal(b.find(b=>b.name==='Hãng 1').count,2);assert.equal(b.find(b=>b.name==='Hãng 2').count,0);});
test('Tên sheet Excel dài, trùng, ký tự cấm được xử lý riêng biệt',()=>{const used=new Set();const names=['A/B','A:B','a b','History',"'WMF'",'X'.repeat(80),'X'.repeat(80)];const result=names.map(n=>sheetName(n,used));assert.equal(new Set(result.map(n=>n.toLowerCase())).size,names.length);assert.ok(result.every(n=>n.length<=31&&!/[:\\/?*\[\]]/.test(n)));assert.ok(result.includes('WMF'));});

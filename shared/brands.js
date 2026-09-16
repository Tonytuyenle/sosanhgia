import {norm,own} from './domain.js';
export const initialBrands=['Lock&King','Takin','Jiwon','Morico','Hare','Hatzz','Engler','Seka','WMF','Goldsun','Yoke'];
export const brandKey=name=>own({brand:name})?'lockking':norm(name);
export function listBrands(saved,products){
 const map=new Map();
 for(const b of saved){const key=brandKey(b.name);if(!map.has(key))map.set(key,{...b,key,count:0});}
 for(const p of products){const key=brandKey(p.brand);if(!key)continue;if(!map.has(key))map.set(key,{id:key,key,name:p.brand,count:0});map.get(key).count++;}
 return [...map.values()].sort((a,b)=>a.key==='lockking'?-1:b.key==='lockking'?1:a.name.localeCompare(b.name,'vi',{sensitivity:'base',numeric:true}));
}
export function sheetName(name,used){
 let base=String(name).replace(/[\u0000-\u001f\u007f:\\/?*\[\]]/g,' ').replace(/^'+|'+$/g,'').trim().slice(0,31)||'Thương hiệu';
 if(base.toLowerCase()==='history')base='History hãng';
 let candidate=base,index=2;
 while(used.has(candidate.toLowerCase())){const suffix=' ('+index+++')';candidate=base.slice(0,31-suffix.length)+suffix;}
 used.add(candidate.toLowerCase());return candidate;
}

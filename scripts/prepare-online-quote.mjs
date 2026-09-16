import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
// Visually transcribed from all six rendered pages. Monetary entries below are
// thousands of VND; conversion to VND happens once when creating the manifest.
const prices=[
['LK-2202A',265,467,491,202,43.3,1],
['LK-2433',395,750,810,355,47.3,1],
['LK-2606A',320,590,620,270,45.8,1],
['LK-2633',450,850,918,400,47.1,1],
['LK-2808',351,630,662,279,44.3,1],
['LK-2808SA KHÔNG NẮP',350,650,683,300,46.2,2],
['LK-3003',375,750,788,375,50.0,2],
['LK-3212',645,1290,1394,645,50.0,2],
['LK-30NC1',414,750,788,336,44.8,2],
['LK-32NC1',470,830,872,360,43.4,2],
['LK-336A',540,990,1040,450,45.5,2],
['LK-3018A',170,295,310,125,42.4,2],
['LK-3020A',185,315,331,130,41.3,2],
['LK-3024',230,395,415,165,41.8,2],
['LK-3116',325,630,662,305,48.4,2],
['LK-3118',340,650,683,310,47.7,2],
['LK-3120',390,740,777,350,47.3,2],
['LK-3124',460,880,924,420,47.7,2],
['LK-3338',1100,2090,2195,990,47.4,2],
['LK-3386A',550,990,1040,440,44.4,3],
['LK-3568A',960,1690,1775,730,43.2,3],
['LK-3122',470,820,886,350,42.7,3],
['LK-3126',535,990,1070,455,46.0,3],
['LK-1038',300,525,552,225,42.9,3],
['LK-92',835,1590,1670,755,47.5,3],
['LK-586',430,745,783,315,42.3,3],
['LK-588',585,1050,1103,465,44.3,3],
['LK-668',460,920,966,460,50.0,3],
['LK-688',850,1690,1775,840,49.7,3],
['LK-1003',197,354,372,157,44.4,3],
['LK-1030',1020,1890,1985,870,46.0,3],
['LK-1033',372,670,704,298,44.5,3],
['LK-1050',780,1495,1570,715,47.8,4],
['LK-1068',310,599,629,289,48.2,4],
['LK-4160',1000,1880,1974,880,46.8,4],
['LK-4161',800,1490,1565,690,46.3,4],
['LK-4208A',510,950,998,440,46.3,4],
['LK-4209',510,950,998,440,46.3,4],
['LK-5301',600,1190,1250,590,49.6,4],
['LK-6015',260,490,515,230,46.9,4],
['LK-6201',685,1290,1355,605,46.9,4],
['LK-7812',660,1190,1250,530,44.5,4],
['LK-9014',1130,2190,2300,1060,48.4,4],
['TK-2201',265,467,491,202,43.3,4],
['TK-2662',320,590,620,270,45.8,4],
['TK-2882C',351,630,662,279,44.3,5],
['TK-3030C',375,750,788,375,50.0,5],
['TK-036A',515,891,936,375,42.2,5],
['TK-0324',245,441,464,196,44.4,5],
['TK-0348A',580,1044,1097,464,44.4,5],
['TK-0369',535,969,1018,434,44.8,5],
['TK-0488',810,1469,1543,659,44.9,5],
['TK-468',452,900,945,448,49.8,5],
['TK-469',615,1050,1103,435,41.4,5],
['TK-1002',158,270,284,112,41.5,5],
['TK-1003',194,330,347,136,41.2,5]
];
const takin=[
['TK-2201','chảo cạn Titan vàng 22*5,5cm (2,2 mm) TK-2201','Chảo','22*5,5 cm'],
['TK-2662','26*6.5CM Chảo cạn titan-TK-2662 (2.2mm)','Chảo','26*6.5 cm'],
['TK-2882C','Chảo cạn Titan vàng 28*7cm (2,3 mm)','Chảo','28*7 cm'],
['TK-3030C','Chảo cạn Titan vàng 30*7cm (2,3 mm)','Chảo','30*7 cm'],
['TK-036A','Bộ nồi Takin 3 món 5 đáy inox cao cấp','Nồi & bộ nồi'],
['TK-0324','Nồi táo inox cao cấp size24','Nồi & bộ nồi'],
['TK-0348A','Bộ nồi Táo Takin 3 món inox cao cấp','Nồi & bộ nồi'],
['TK-0369','Bộ nồi Takin 3 món 5 đáy inox cao cấp','Nồi & bộ nồi'],
['TK-0488','Bộ nồi Takin 4 món 5 đáy inox cao cấp','Nồi & bộ nồi'],
['TK-468','Sưởi gốm thấp','Đồ điện'],
['TK-469','Sưởi gốm thân cao','Đồ điện'],
['TK-1002','Bộ đèn sưởi 2 bóng Takin','Đồ điện'],
['TK-1003','Bộ đèn sưởi 3 bóng Takin','Đồ điện']
];
const previous=JSON.parse(fs.readFileSync('tmp/pdfs/lnk/import-ready.json','utf8')).products;
assert.equal(prices.length,56);assert.equal(new Set(prices.map(r=>r[0])).size,56);
const sourceFile='C:\\Users\\ADMIN\\Downloads\\Bao_Gia_Kenh_ONLINE_ALL_2026-09-14.pdf';
const file='Bao_Gia_Kenh_ONLINE_ALL_2026-09-14.pdf';
const products=prices.map(([code,npp,facebook,market,profit,margin,page],i)=>{
 const old=previous.find(p=>p.code===code),t=takin.find(t=>t[0]===code);
 assert.ok(old||t,code);
 const input={code,brand:old?'Lock&King':'Takin',name:old?.name||t[1],category:old?.category||t[2],model:old?.model||code,nppOnline:npp*1000,facebookPrice:facebook*1000,marketplacePrice:market*1000,quotedNppProfit:profit*1000,quotedNppMargin:margin,onlineQuoteDate:'2026-09-05',onlinePriceSource:'/api/assets/online-20260914/bang-gia-online.pdf'};
 if(t){if(t[3])input.dimensions=t[3];if(/inox/i.test(t[1]))input.material='Inox';if(!['TK-036A','TK-0369'].includes(code))input.image='/api/assets/online-20260914/'+code+'.png';}
 const warnings=[];
 if(Math.abs(facebook-npp-profit)>.001)warnings.push('Lợi nhuận NPP in trong PDF là '+profit*1000+' đ; chênh lệch Giá Facebook − NPP Online là '+(facebook-npp)*1000+' đ. Giữ nguyên số liệu nguồn, cần xác minh.');
 if(Math.abs((facebook-npp)/facebook*100-margin)>.15)warnings.push('Tỷ lệ biên NPP nguồn khác tỷ lệ tính từ giá; cần xác minh.');
 return {input,source:{file,page,row:i+1,quotation:'BG-VG-2026/09-001',date:'2026-09-05',method:'Đối chiếu trực quan bảng giá PDF dạng ảnh',raw:{code,nppOnline:npp*1000,facebookPrice:facebook*1000,marketplacePrice:market*1000,quotedNppProfit:profit*1000,quotedNppMargin:margin}},warnings};
});
const manifest={sourceFile,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(sourceFile)).digest('hex'),products};
fs.writeFileSync('tmp/pdfs/online-20260914/import-ready.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({count:products.length,lockKing:43,takin:13,sums:Object.fromEntries(['nppOnline','facebookPrice','marketplacePrice'].map(k=>[k,products.reduce((s,p)=>s+p.input[k],0)])),warnings:products.filter(p=>p.warnings.length).map(p=>({code:p.input.code,warnings:p.warnings}))}));

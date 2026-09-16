import fs from 'node:fs';
const file='src/main.tsx';let s=fs.readFileSync(file,'utf8');
const start=s.indexOf('<div className="card-prices">');const end=s.indexOf('<div className="card-bottom">',start);
if(start<0||end<0)throw Error('Price card not found');
s=s.slice(0,start)+`<div className="card-prices">{D.catalogPriceKeys.filter(k=>D.has(p[k])).map(k=><div key={k}><small>{D.labels[k]}</small><strong>{money(p[k])}</strong></div>)}{!D.catalogPriceKeys.some(k=>D.has(p[k]))&&<span className="muted">Chưa có giá xác định</span>}</div>{p.quoteReview?.length>0&&<button className="text-button warn-text" onClick={()=>setDetail(p.id)}>Báo giá có {p.quoteReview.length} mục cần xác minh</button>}`+s.slice(end);
s=s.replace('<th>NPP Offline</th><th>NPP Online</th><th>Facebook</th><th>Sàn TMĐT</th>','<th>Giá theo báo giá</th>');
s=s.replace('<td>{money(p.npp)}</td><td>{money(p.nppOnline)}</td><td>{money(p.facebookPrice)}</td><td>{money(p.marketplacePrice)}</td>','<td>{D.catalogPriceKeys.filter(k=>D.has(p[k])).map(k=><div key={k}><small>{D.labels[k]}: </small>{money(p[k])}</div>)}{!D.catalogPriceKeys.some(k=>D.has(p[k]))&&"Chưa có giá xác định"}</td>');
s=s.replace("prices:['cost','npp','nppOnline','facebookPrice','marketplacePrice','online','listPrice']","prices:['cost',...D.catalogPriceKeys,'online']");
fs.writeFileSync(file,s);

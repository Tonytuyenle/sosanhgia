import fs from 'node:fs';
const file='src/main.tsx';let s=fs.readFileSync(file,'utf8');
s=s.replace("import BrandSheets from", "import {comparisonPriceGroups,comparisonPrices,populatedPriceFields} from '../shared/price-comparison.js';\nimport BrandSheets from");
s=s.replace("if(!D.has(val)||!D.has(base?.[key]))return 'cell-missing';","if(!D.has(val))return 'cell-missing';if(!D.has(base?.[key]))return 'cell-equal';");
s=s.replace('keys.filter(k=>D.canFinance(user.role)||!D.privateKeys.includes(k)).map(key=>',"(g==='prices'?populatedPriceFields(chosen).map(f=>f.key):keys).filter(k=>D.canFinance(user.role)||!D.privateKeys.includes(k)).map(key=>");
const needle='<tbody>{Object.entries(compareGroups)';
const insert=`<tbody>{show.prices&&<><tr className="group-row"><th colSpan={chosen.length+1}>Đối chiếu giá cùng loại</th></tr>{comparisonPriceGroups.filter(g=>chosen.some(p=>comparisonPrices(p,g).length)).map(g=><tr key={g.key}><th>{g.label}</th>{chosen.map(p=><td key={p.id} className={comparisonPrices(p,g).length?'cell-equal':'cell-missing'}>{comparisonPrices(p,g).length?comparisonPrices(p,g).map(v=><div key={v.key}><strong>{money(v.value)}</strong><br/><small>{v.label}</small></div>):'Chưa có giá loại này'}</td>)}</tr>)}</>}{Object.entries(compareGroups)`;
if(!s.includes(needle))throw Error('Comparison table not found');s=s.replace(needle,insert);fs.writeFileSync(file,s);

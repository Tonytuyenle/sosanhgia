import fs from 'node:fs';
const file='offline/app.jsx';let s=fs.readFileSync(file,'utf8');
s=s.replace('prices.filter(k=>D.has(p[k])).slice(0,4)','prices.filter(k=>D.has(p[k]))');
s=s.replace('<tbody>{D.fields.filter', '<tbody><PriceSummary selected={selected}/>{D.fields.filter');
fs.writeFileSync(file,s);

import {fields,has,labels} from './domain.js';
// Only group equivalent types. Online, retail, minimum and quantity tiers stay separate.
export const comparisonPriceGroups=[
 {key:'distribution',label:'Giá NPP / phân phối',keys:['npp','distributorPrice']},
 {key:'distributionOnline',label:'Giá NPP Online',keys:['nppOnline']},
 {key:'wholesale',label:'Giá buôn',keys:['wholesalePrice']},
 {key:'minimum',label:'Giá bán tối thiểu',keys:['minimum']},
 {key:'list',label:'Giá niêm yết',keys:['listPrice']},
 {key:'retail',label:'Giá bán lẻ',keys:['retailPrice']},
];
export function comparisonPrices(product,group){return group.keys.filter(k=>has(product[k])).map(key=>({key,label:labels[key],value:product[key]}));}
export function populatedPriceFields(products){return fields.filter(f=>f.group==='prices'&&products.some(p=>has(p[f.key])));}

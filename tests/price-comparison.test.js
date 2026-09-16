import test from 'node:test';
import assert from 'node:assert/strict';
import {comparisonPriceGroups,comparisonPrices,populatedPriceFields} from '../shared/price-comparison.js';
test('Hare and Lock&King distribution prices share a row with explicit source labels',()=>{
 const group=comparisonPriceGroups[0],hare={distributorPrice:690000,minimum:1190000,listPrice:1845000},lnk={npp:460000,nppOnline:460000};
 assert.deepEqual(comparisonPrices(hare,group).map(x=>x.value),[690000]);assert.deepEqual(comparisonPrices(lnk,group).map(x=>x.value),[460000]);
 assert.notEqual(comparisonPrices(hare,group)[0].label,comparisonPrices(lnk,group)[0].label);
 assert.deepEqual(hare,{distributorPrice:690000,minimum:1190000,listPrice:1845000});
});
test('Do not substitute online, wholesale, tier or minimum prices for distribution prices',()=>{
 assert.deepEqual(comparisonPrices({nppOnline:1,wholesalePrice:2,bulk100Price:3,minimum:4},comparisonPriceGroups[0]),[]);
 assert.equal(comparisonPrices({npp:0,distributorPrice:700},comparisonPriceGroups[0]).length,2);
});
test('All populated pricing columns stay visible, including dealer and channel fields',()=>{
 const keys=populatedPriceFields([{dealer:1,promo:2,shopeePrice:3,tiktokPrice:4,bulk50Price:0,minimum:null}]).map(f=>f.key);
 for(const k of ['dealer','promo','shopeePrice','tiktokPrice','bulk50Price'])assert.ok(keys.includes(k));assert.ok(!keys.includes('minimum'));
});

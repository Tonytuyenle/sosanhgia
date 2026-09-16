import json,pathlib,re,collections
B=pathlib.Path('tmp/brands-20260916');m=json.loads((B/'prepared.json').read_text(encoding='utf-8'));rows=m['products']
counts=collections.Counter(r['input']['brand'] for r in rows)
assert counts=={'Hare':36,'Yoake':11,'Fynal':22,'Kailer':71,'Bucook':1,'Buhaiber':1,'Kaisa Villa':6,'Engler':33,'Jiwon':28,'Haatz':60,'Morico':38},counts
assert len({(r['input']['brand'],r['input']['code']) for r in rows})==len(rows)==307
verified=0
for slug,mapping in [('ENGLER',{5:'distributorPrice',7:'listPrice',8:'marketplacePrice',9:'packingFee'}),('JIWON',{5:'bulk20Price',6:'bulk50Price',7:'bulk100Price',8:'listPrice',9:'websitePrice'}),('HAATZ',{6:'nppOnline',7:'listPrice',8:'retailPrice'})]:
 t=json.loads(next(B.glob('*'+slug+'-tables.json')).read_text(encoding='utf-8'))
 for r in rows:
  if slug not in r['source']['file']:continue
  page,line=map(int,re.search(r'Trang (\d+), dòng bảng (\d+)',r['source']['location']).groups());raw=next(x for x in t if x['page']==page)['rows'][line-1]
  for col,key in mapping.items():
   value=int(''.join(c for c in raw[col] if c.isdigit()))
   assert r['input'][key]==value,(r['input']['code'],key,r['input'][key],value)
   verified+=1
for r in rows:
 p=r['input']
 for k,v in p.items():
  if k.endswith('Price') or k in ['minimum','nppOnline']:
   assert isinstance(v,int) and v>=10000,(p['code'],k,v)
 if p.get('image'):assert (B/'assets'/p['image'].split('/')[-1]).exists()
assert next(r['input'] for r in rows if r['input']['code']=='KL-2419')['wholesalePrice']==290000
assert next(r['input'] for r in rows if r['input']['code']=='KL-5020')['listPrice']==615000
assert next(r['input'] for r in rows if r['input']['code']=='HAD3')['nppOnline']==80000
assert next(r['input'] for r in rows if r['input']['code']=='MPT806').get('retailPrice') is None
print(json.dumps({'products':len(rows),'brandCounts':dict(counts),'pdfPricesChecked':verified,'images':sum(bool(r['input'].get('image')) for r in rows)},ensure_ascii=False))

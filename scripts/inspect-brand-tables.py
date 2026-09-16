import pathlib,json,pdfplumber,logging,openpyxl
logging.getLogger('pdfminer').setLevel(logging.ERROR)
base=pathlib.Path('tmp/brands-20260916')
for p in base.glob('*.pdf'):
 if 'Morico' in p.name:continue
 tables=[]
 with pdfplumber.open(p) as doc:
  for i,page in enumerate(doc.pages):
   if not page.chars:continue
   for t in page.find_tables():
    tables.append({'page':i+1,'bbox':t.bbox,'rows':t.extract(),'cells':[r.cells for r in t.rows]})
 (base/(p.stem+'-tables.json')).write_text(json.dumps(tables,ensure_ascii=False),encoding='utf-8')
 print(p.name,[(t['page'],len(t['rows']),len(t['rows'][0])) for t in tables])
 print(json.dumps([t['rows'][:2] for t in tables[:2]],ensure_ascii=False))
for p in base.glob('*.xlsx'):
 w=openpyxl.load_workbook(p,data_only=True)
 print('\nFILE',p.name)
 for s in w:
  for i,row in enumerate(s.values,1):
   if not any(v is not None for v in row):continue
   print(i,json.dumps({openpyxl.utils.get_column_letter(j):v for j,v in enumerate(row,1) if v is not None and j!=({'HARE':5,'FYNAL':4}.get(next((b for b in ['HARE','FYNAL'] if b in p.name),''),-1))},ensure_ascii=False,default=str))

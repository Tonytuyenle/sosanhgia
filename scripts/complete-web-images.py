import pathlib,json,io
from PIL import Image
exec(pathlib.Path('scripts/collect-image-pages.py').read_text(encoding='utf-8').split('urls=set()')[0])
ready=json.loads((B/'ready.json').read_text(encoding='utf-8'));pending=json.loads((B/'pending.json').read_text(encoding='utf-8'))
extra=[('KL-3386','https://kailer.vn/may-hut-bui-kailer-da-nang','https://bizweb.dktcdn.net/thumb/medium/100/507/396/products/gin05877.jpg?v=1754556823493'),('KL-0279','https://kailer.vn/noi-chien-khong-dau-kailer-15l-kl-0279','https://bizweb.dktcdn.net/thumb/medium/100/507/396/products/d63ac755-8174-4acb-ab0a-20b3e2ebd9cf.jpg?v=1757149192873')]
cat=fetch('https://morico.vn/thiet-bi-dien-gia-dung/')
for l in cat.get('links',[]):
 if 'mcv510' in l['url'].lower():
  page=fetch(l['url']);imgs=[x for x in page.get('images',[]) if x['alt']!='og:image'];
  if 'MCV510' in page.get('title','').upper() and imgs:extra.append(('MCV510',page['url'],imgs[0]['url']));break
for code,page,url in extra:
 try:
  p=next(x for x in pending if x['code']==code);data=get(url);im=Image.open(io.BytesIO(data));im.load();assert min(im.size)>=120
  name=p['id']+'.'+{'JPEG':'jpg','PNG':'png','WEBP':'webp'}[im.format];(B/'assets'/name).write_bytes(data)
  ready.append({**p,'page':page,'title':p['name'],'url':url,'asset':name,'size':im.size});pending.remove(p);print('ADDED',code)
 except Exception as e:print('ERROR',code,str(e))
(B/'ready.json').write_text(json.dumps(ready,ensure_ascii=False,indent=2),encoding='utf-8');(B/'pending.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2),encoding='utf-8')
print('TOTAL',len(ready),'PENDING',len(pending))

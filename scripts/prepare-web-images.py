import pathlib,json,re,concurrent.futures,io
from PIL import Image,ImageOps,ImageDraw
exec(pathlib.Path('scripts/collect-image-pages.py').read_text(encoding='utf-8').split('urls=set()')[0])
pages=json.loads((B/'pages.json').read_text(encoding='utf-8'))
urls=['https://kailer.vn/noi-chien-khong-dau-kailer-15l-kl-0279','https://morico.vn/san-pham/noi-titanium-shield-duc-lien-khoi-size-24-co-vung-kinh-mpt806/']
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex: pages+=list(ex.map(fetch,urls))
(B/'all-pages.json').write_text(json.dumps(pages,ensure_ascii=False),encoding='utf-8')
norm=lambda s:re.sub('[^A-Z0-9]','',s.upper())
out=[];pending=[];(B/'assets').mkdir(exist_ok=True)
for p in missing:
 candidates=[]
 if p['code'] not in ['FN-PL228','FN-PL226','KL-0311DT'] and not p['code'].startswith(('COMBO','CB')):
  for page in pages:
   if not page.get('images') or p['brand'].lower() not in page['url']:continue
   code=norm(p['model']);title=norm(page.get('title',''))
   if len(code)>3 and code in title:candidates.append(page)
   if p['code'].startswith('F4-') and page.get('title')=='Vung Fynal '+('24cm' if p['code']=='F4-V6BFB87' else '26cm'):candidates.append(page)
 if len(candidates)!=1:
  pending.append(p);continue
 page=candidates[0];imgs=[x for x in page['images'] if x['alt']!='og:image'] or page['images']
 out.append({**p,'page':page['url'],'title':page['title'],'url':imgs[0]['url']})
def download(p):
 try:
  data=get(p['url']);im=Image.open(io.BytesIO(data));im.load();assert min(im.size)>=120
  ext={'JPEG':'jpg','PNG':'png','WEBP':'webp'}[im.format];name=p['id']+'.'+ext
  (B/'assets'/name).write_bytes(data);return {**p,'asset':name,'size':im.size}
 except Exception as e:print('ERROR',p['code'],str(e));return None
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex: results=list(ex.map(download,out))
good=[x for x in results if x];pending += [p for p,r in zip(out,results) if not r]
(B/'ready.json').write_text(json.dumps(good,ensure_ascii=False,indent=2),encoding='utf-8')
(B/'pending.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2),encoding='utf-8')
sheet=Image.new('RGB',(1000,((len(good)+4)//5)*180),'white');d=ImageDraw.Draw(sheet)
for i,p in enumerate(good):
 im=Image.open(B/'assets'/p['asset']).convert('RGB');im.thumbnail((190,150));x=i%5*200;y=i//5*180;sheet.paste(im,(x,y));d.text((x+4,y+152),p['brand']+' '+p['code'],fill='black')
sheet.save(B/'contact.jpg')
print('READY',len(good),[(p['brand'],p['code']) for p in good]);print('PENDING',[(p['brand'],p['code']) for p in pending])

import urllib.request,pathlib,json,concurrent.futures,urllib.parse,re
from bs4 import BeautifulSoup
B=pathlib.Path('tmp/image-update');B.mkdir(exist_ok=True)
urls=['https://morico.vn/san-pham-morico/','https://fynal.vn/','https://kailer.vn/','https://haatz.vn/']
def fetch(url):
 try:
  raw=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=35).read();s=BeautifulSoup(raw,'html.parser');name=urllib.parse.urlparse(url).netloc
  (B/(name+'.html')).write_text(str(s),encoding='utf-8')
  links=[{'url':urllib.parse.urljoin(url,a['href']),'text':a.get_text(' ',strip=True)} for a in s.select('a[href]')]
  images=[{'src':i.get('data-src') or i.get('src'),'alt':i.get('alt')} for i in s.select('img')]
  return {'url':url,'title':s.title.get_text() if s.title else '', 'links':list({v['url']:v for v in links}.values()),'images':images}
 except Exception as e:return {'url':url,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:r=list(ex.map(fetch,urls))
(B/'sites.json').write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
for s in r:
 print(s['url'],s.get('error',''),len(s.get('links',[])))
 for l in s.get('links',[]):
  if re.search(r'M[AMCFIPRSTJ]|PL1|PL2|HYP|0311|3386|0279|005|page|trang|sitemap|chao|yeon',l['url']+' '+l['text'],re.I):print(json.dumps(l,ensure_ascii=False))

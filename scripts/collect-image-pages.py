import urllib.request,urllib.parse,pathlib,json,concurrent.futures,re,hashlib
from bs4 import BeautifulSoup
B=pathlib.Path('tmp/image-update');sites=json.loads((B/'sites.json').read_text(encoding='utf-8'));missing=json.loads((B/'missing.json').read_text())
def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read()
def fetch(url):
 try:
  html=get(url);s=BeautifulSoup(html,'html.parser');h=s.find('h1');meta=s.find('meta',property='og:image')
  images=[]
  for i in s.select('.woocommerce-product-gallery img, .product-gallery img, .product-image img, .product-detail img'):
   src=i.get('data-large_image') or i.get('data-src') or i.get('src');
   if src:images.append({'url':urllib.parse.urljoin(url,src),'alt':i.get('alt','')})
  if meta:images.insert(0,{'url':urllib.parse.urljoin(url,meta.get('content','')),'alt':'og:image'})
  links=[{'url':urllib.parse.urljoin(url,a['href']),'text':a.get_text(' ',strip=True)} for a in s.select('a[href]')]
  dest=hashlib.sha256(url.encode()).hexdigest()[:14]+'.html';(B/dest).write_bytes(html)
  return {'url':url,'title':h.get_text(' ',strip=True) if h else s.title.get_text() if s.title else '', 'text':s.get_text(' ',strip=True),'images':images,'links':links,'html':dest}
 except Exception as e:return {'url':url,'error':str(e)}
urls=set()
for site in sites:
 for l in site.get('links',[]):
  u=l['url']
  if (u.startswith('https://morico.vn/san-pham/') or u.startswith('https://fynal.vn/san-pham/') or '/collections/' in u and u.startswith('https://kailer.vn/') or u=='https://haatz.vn/bo-noi-chao-inox' or 'kailer-kl-005' in u):urls.add(u)
urls.add('https://kailer.vn/may-hut-bui-kailer-da-nang');urls.add('https://takin.vn/san-pham/')
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:results=list(ex.map(fetch,sorted(urls)))
(B/'pages.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
for r in results:print(json.dumps({k:r.get(k) for k in ['url','title','error','images']},ensure_ascii=False))

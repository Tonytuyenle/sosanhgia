from PIL import Image
from pathlib import Path
p=Path('tmp/pdfs/online-20260914')
out=p/'assets';out.mkdir(exist_ok=True)
specs=[('TK-2201',4,848,899),('TK-2662',4,936,987),('TK-3030C',5,85,137),('TK-0324',5,254,307),('TK-0348A',5,334,387),('TK-0488',5,514,568),('TK-468',5,594,649),('TK-469',5,664,718),('TK-1002',5,732,787),('TK-1003',5,801,856)]
for code,page,y0,y1 in specs:
    Image.open(p/f'render-{page}.png').crop((390,y0,443,y1)).save(out/f'{code}.png')
a=Image.open(p/'render-4.png').crop((390,1027,443,1055))
b=Image.open(p/'render-5.png').crop((390,20,443,43))
combined=Image.new('RGB',(53,a.height+b.height),'white');combined.paste(a,(0,0));combined.paste(b,(0,a.height));combined.save(out/'TK-2882C.png')
print('Extracted 11 Takin thumbnails; 2 products have no image in the source.')

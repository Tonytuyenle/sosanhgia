import pathlib,pypdfium2 as pdfium
from PIL import Image,ImageDraw
b=pathlib.Path('tmp/brands-20260916');d=pdfium.PdfDocument(str(b/'BÁO GIÁ ENGLER.pdf'))
sheet=Image.new('RGB',(1500,9*270),'#dddddd');draw=ImageDraw.Draw(sheet)
for i in range(len(d)):
 im=d[i].render(scale=.35).to_pil();im.thumbnail((365,240));x=(i%4)*375;y=(i//4)*270
 sheet.paste(im,(x,y+22));draw.text((x+5,y+3),f'Page {i+1}',fill='black')
sheet.save(b/'engler-contact.jpg')

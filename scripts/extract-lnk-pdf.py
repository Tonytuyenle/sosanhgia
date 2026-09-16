import json, logging, re, pathlib, hashlib
import pdfplumber
from pypdf import PdfReader

logging.getLogger('pdfminer').setLevel(logging.ERROR)
source = pathlib.Path(r'C:\Users\ADMIN\Desktop\giá lnk.pdf')
out = pathlib.Path('tmp/pdfs/lnk')
assets = out / 'assets'
assets.mkdir(parents=True, exist_ok=True)
pdf = pdfplumber.open(source)
reader = PdfReader(source)
products = []
categories = {'CHẢO':'Chảo','NỒI & BỘ NỒI':'Nồi & bộ nồi','NỒI TĂNG ÁP':'Nồi tăng áp','ẤM & BÌNH':'Ấm & bình','ĐỒ ĐIỆN':'Đồ điện'}
for page_number, page in enumerate(pdf.pages, 1):
    for table in page.find_tables():
        values = table.extract()
        for cells, row in zip(table.rows, values):
            offset = next((i for i,v in enumerate(row[:2]) if str(v or '').isdigit()),None)
            if offset is None:
                continue
            row = row[offset:offset+5]
            assert len(row)==5
            ordinal = int(row[0])
            code = re.sub(r'\s+', ' ', row[1]).strip()
            body, raw_category = row[3].rsplit('Lock&King •', 1)
            name = re.sub(r'\s+', ' ', body).strip().replace('LK- 3338', 'LK-3338')
            price = int(re.sub(r'[^0-9]', '', row[4]))
            bbox = cells.cells[offset+2]
            images = [im for im in page.images if bbox[0] <= (im['x0']+im['x1'])/2 <= bbox[2] and bbox[1] <= (im['top']+im['bottom'])/2 <= bbox[3]]
            assert len(images) == 1, (ordinal, code, len(images))
            image = reader.pages[page_number-1].images['/'+images[0]['name']]
            suffix = pathlib.Path(image.name).suffix.lower()
            assert suffix in ['.png','.jpg','.jpeg','.jp2']
            filename = f'{ordinal:02d}-'+re.search(r'LK-[A-Z0-9]+',code).group(0)+suffix
            (assets/filename).write_bytes(image.data)
            product = {
                'code': code, 'model': re.search(r'LK-[A-Z0-9]+',code).group(0),
                'name': name, 'brand':'Lock&King', 'category':categories[raw_category.strip()],
                'npp':price, 'image':'/api/assets/lnk-20260905/'+filename,
                'surveyDate':'2026-09-05',
                'source':f'giá lnk.pdf — BG-VG-2026/09-001 — ngày 05/09/2026 — trang {page_number}, STT {ordinal} — người dùng cung cấp',
                'priceSource':'/api/assets/lnk-20260905/gia-lnk.pdf',
                'channel':'Phân phối offline: cửa hàng, đại lý truyền thống và showroom',
                'description': name,
                'extra':'Loại giá: Giá NPP Offline (VNĐ)\nBáo giá: BG-VG-2026/09-001\nNgày lập: 05/09/2026\nGhi chú giá: Đã bao gồm chiết khấu phân phối chính thức từ nhà sản xuất\nHiệu lực theo tài liệu: 30 ngày kể từ ngày lập hoặc theo chính sách phân phối hiện hành'
            }
            power = re.search(r'(?<![\d.])(\d+)\s*W\b',name,re.I)
            if power: product['power'] = power.group(1)+' W'
            capacity = re.search(r'(?<![\d.])(\d+(?:[.,]\d+)?)\s*L\b',name)
            if capacity: product['capacity'] = capacity.group(1)+' l'
            dimensions = re.search(r'\b(\d+(?:[.,]\d+)?\s*\*\s*\d+(?:[.,]\d+)?)\s*cm\b',name,re.I)
            diameter = re.search(r'\b(\d+(?:[.,]\d+)?)\s*cm\b',name,re.I)
            if dimensions: product['dimensions'] = dimensions.group(1)+' cm'
            elif diameter and not re.search(r'\d\+\d',name): product['dimensions'] = diameter.group(1)+' cm'
            if 'Inox' in name: product['material']='Inox'
            if 'KHÔNG NẮP' in name: product['accessories']='Không kèm nắp'
            elif 'kèm nắp' in name: product['accessories']='Nắp'
            elif 'xửng hấp' in name: product['accessories']='Xửng hấp'
            if '(4c/t)' in name: product['perCarton']=4
            if '(1t/4c)' in name: product['perCarton']=4
            if '(1t/2c)' in name: product['perCarton']=2
            product['_pdf']={'page':page_number,'row':ordinal,'code':row[1],'name':row[3],'npp':row[4],'imageObject':images[0]['name']}
            products.append(product)
assert len(products)==43
assert sorted(p['_pdf']['row'] for p in products)==list(range(1,44))
assert len({p['code'] for p in products})==43
assert all(p['npp']>0 for p in products)
manifest={'sourceFile':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'quotation':'BG-VG-2026/09-001','quotationDate':'2026-09-05','products':products}
(out/'import-ready.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'count':len(products),'priceSum':sum(p['npp'] for p in products),'min':min(p['npp'] for p in products),'max':max(p['npp'] for p in products),'images':len(list(assets.iterdir()))}))

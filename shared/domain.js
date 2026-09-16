export const roles = {admin:'Quản trị viên',leader:'Ban lãnh đạo',sales:'Phòng Kinh doanh',marketing:'Phòng Marketing',purchasing:'Bộ phận Mua hàng'};
export const groups = {
 basic:'Thông tin cơ bản', media:'Hình ảnh và nội dung', specs:'Thông số kỹ thuật', prices:'Giá và chi phí', market:'Dữ liệu thị trường', procurement:'Mua hàng', assessment:'Đánh giá có kiểm chứng'
};
const defs = {
 basic:[['code','Mã sản phẩm'],['name','Tên sản phẩm'],['model','Model'],['brand','Thương hiệu'],['supplier','Nhà cung cấp'],['category','Nhóm ngành hàng'],['type','Loại sản phẩm'],['purpose','Công dụng chính'],['origin','Xuất xứ'],['barcode','Mã vạch'],['status','Trạng thái kinh doanh'],['stock','Trạng thái còn hàng']],
 media:[['image','Ảnh đại diện','url'],['images','Ảnh chi tiết (mỗi dòng một URL)','textarea'],['packaging','Ảnh bao bì','url'],['video','Video sản phẩm','url'],['description','Mô tả','textarea'],['highlights','Điểm nổi bật','textarea'],['website','Website','url'],['facebook','Facebook','url'],['shopee','Shopee','url'],['tiktok','TikTok Shop','url'],['source','Nguồn lấy dữ liệu'],['advantages','Ưu điểm','textarea'],['limitations','Hạn chế','textarea']],
 specs:[['material','Chất liệu'],['capacity','Dung tích (lít hoặc ml)'],['dimensions','Kích thước (cm hoặc mm)'],['mass','Khối lượng (kg hoặc g)'],['power','Công suất (W hoặc kW)'],['voltage','Điện áp'],['color','Màu sắc'],['layers','Số lớp','number'],['technology','Công nghệ'],['features','Chức năng'],['safety','Tính năng an toàn'],['accessories','Phụ kiện'],['warranty','Bảo hành (tháng)','number'],['packing','Quy cách đóng thùng'],['perCarton','Số sản phẩm/thùng','number'],['style','Kiểu dáng đã xác nhận'],['extra','Thông số mở rộng (Tên: giá trị, mỗi dòng một trường)','textarea']],
 prices:[['cost','Giá nhập','money'],['npp','Giá NPP Offline','money'],['nppOnline','Giá NPP Online','money'],['marketplacePrice','Giá sàn TMĐT (báo giá)','money'],['quotedNppProfit','Lợi nhuận NPP theo báo giá (chưa trừ phí)','money'],['quotedNppMargin','Biên NPP theo báo giá (%)','percent'],['onlineQuoteDate','Ngày lập báo giá Online','date'],['onlinePriceSource','Nguồn báo giá Online','url'],['dealer','Giá đại lý','money'],['minimum','Giá bán tối thiểu','money'],['facebookPrice','Giá Facebook','money'],['websitePrice','Giá website','money'],['shopeePrice','Giá Shopee','money'],['tiktokPrice','Giá TikTok Shop','money'],['online','Giá online thấp nhất','money'],['listPrice','Giá niêm yết','money'],['promo','Giá khuyến mại','money'],['sale','Giá bán dùng tính toán','money'],['platform','Phí sàn (% doanh thu)','percent'],['ads','Quảng cáo (đ/sp)','money'],['shipping','Vận chuyển (đ/sp)','money'],['warrantyCost','Bảo hành dự kiến (đ/sp)','money'],['gift','Quà tặng (đ/sp)','money'],['tax','Thuế (% doanh thu)','percent'],['other','Chi phí khác (đ/sp)','money'],['returnCost','Chi phí mỗi đơn hoàn (đ)','money'],['discount','Chiết khấu (%)','percent'],['surveyDate','Ngày khảo sát giá','date'],['priceSource','Đường dẫn kiểm chứng giá','url']],
 market:[['quantity','Số lượng bán dự kiến','number'],['sold','Số lượt bán tham khảo','number'],['rating','Điểm đánh giá (0–5)','number'],['reviews','Số lượt đánh giá','number'],['popularity','Mức độ phổ biến'],['returns','Tỷ lệ hoàn hàng (%)','percent'],['warrantyRate','Tỷ lệ bảo hành (%)','percent'],['channel','Kênh bán chính'],['audience','Khách hàng mục tiêu'],['region','Khu vực bán tốt'],['season','Mùa bán hàng']],
 procurement:[['moq','MOQ','number'],['leadTime','Thời gian giao hàng (ngày)','number'],['sampleStatus','Trạng thái lấy mẫu'],['capitalDays','Vòng quay vốn (ngày)','number'],['inventoryRisk','Rủi ro tồn kho (0–100)','number']],
 assessment:[['demand','Phù hợp nhu cầu (0–100)','number'],['quality','Chất lượng, thông số (0–100)','number'],['difference','Tính năng khác biệt (0–100)','number'],['onlinePotential','Tiềm năng online (0–100)','number'],['gtPotential','Tiềm năng GT (0–100)','number'],['service','Hậu mãi (0–100)','number'],['assessmentSource','Nguồn và lý do đánh giá','textarea']]
};
defs.prices.push(['distributorPrice','Giá NPP / phân phối (báo giá)','money'],['wholesalePrice','Giá buôn (báo giá)','money'],['bulk20Price','Giá từ 20 cái','money'],['bulk50Price','Giá từ 50 cái','money'],['bulk100Price','Giá NPP / Live từ 100 cái','money'],['retailPrice','Giá bán lẻ (báo giá)','money'],['mallPrice','Giá Mall (báo giá)','money'],['packingFee','Phí đóng hàng (báo giá)','money'],['quoteDate','Ngày áp dụng báo giá','date']);
export const catalogPriceKeys=['npp','nppOnline','distributorPrice','wholesalePrice','bulk20Price','bulk50Price','bulk100Price','minimum','listPrice','retailPrice','mallPrice','websitePrice','facebookPrice','marketplacePrice'];
export const fields = Object.entries(defs).flatMap(([group,items])=>items.map(([key,label,type='text'])=>({key,label,type,group})));
export const labels = Object.fromEntries(fields.map(f=>[f.key,f.label]));
export const numeric = fields.filter(f=>['money','number','percent'].includes(f.type)).map(f=>f.key);
export const privateKeys = ['cost','returnCost','capitalDays','inventoryRisk'];
export const canFinance = role => ['leader','admin','purchasing'].includes(role);
export const editable = (role,key) => role==='admin'||role==='leader'||(role==='marketing'&&defs.media.some(f=>f[0]===key))||(role==='purchasing'&&['supplier','cost',...defs.procurement.map(f=>f[0])].includes(key))||(role==='sales'&&[...defs.prices.map(f=>f[0]).filter(k=>!privateKeys.includes(k)),...defs.market.map(f=>f[0])].includes(key));
export const has = x => x!==null && x!==undefined && x!=='' && !(typeof x==='number'&&!Number.isFinite(x));
export const norm = x => String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().trim().replace(/\s+/g,' ');
export const own = p => norm(p.brand).replace(/[^a-z0-9]/g,'')==='lockking';
export function unit(value,kind) {
 if(!has(value))return null;
 const s=norm(value).replace(/,/g,'.');
 const nums=(s.match(/\d+(?:\.\d+)?/g)||[]).map(Number); if(!nums.length)return null;
 let factor=1;
 if(kind==='capacity')factor=/ml/.test(s)?.001:1;
 if(kind==='mass')factor=/kg/.test(s)?1000:1;
 if(kind==='dimensions')factor=/cm/.test(s)?10:1;
 if(kind==='power')factor=/kw/.test(s)?1000:1;
 return kind==='dimensions'?nums.map(n=>n*factor).sort((a,b)=>a-b):nums[0]*factor;
}
export function normalizeProduct(p){
 const data={...p};const warnings=[];
 for(const f of fields)if(typeof data[f.key]==='string')data[f.key]=data[f.key].trim().replace(/[ \t]+/g,' ');
 if(data.code)data.code=data.code.toUpperCase().replace(/\s+/g,'-');
 if(own(data))data.brand='Lock&King';
 for(const [key,suffix] of [['capacity','l'],['mass','g'],['dimensions','mm'],['power','W']]) {
  if(!has(p[key]))continue;
  const v=unit(p[key],key);
  if(v!==null)data[key]=(Array.isArray(v)?v.join(' × '):v)+' '+suffix;
  if(!/[a-z]/i.test(String(p[key]))||v===null||(!Array.isArray(v)&&v<=0)||(key==='capacity'&&v>100)||(key==='power'&&v>20000))warnings.push(labels[key]+': kiểm tra đơn vị và giá trị');
 }
 return {data,warnings};
}
const synonym = s => norm(s).replace(/thep khong gi|stainless steel/g,'inox').replace(/nhua pp|polypropylene/g,'pp');
const equal = (a,b)=>has(a)&&has(b)&&synonym(a)===synonym(b);
const near = (a,b,kind)=>{a=unit(a,kind);b=unit(b,kind);if(a===null||b===null)return false;if(Array.isArray(a))return Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])/Math.max(v,b[i],1)<=.15);return Math.abs(a-b)/Math.max(a,b,1)<=.15;};
export function similarity(a,b){
 const criteria=[['Nhóm sản phẩm',20,equal(a.category,b.category)],['Công dụng',15,equal(a.purpose,b.purpose)],['Dung tích / kích thước',15,near(a.capacity,b.capacity,'capacity')||near(a.dimensions,b.dimensions,'dimensions')],['Công suất',10,near(a.power,b.power,'power')],['Chất liệu',10,equal(a.material,b.material)],['Tính năng chính',10,equal(a.features,b.features)],['Phân khúc giá',10,has(a.online)&&has(b.online)&&a.online>0&&b.online>0&&Math.abs(a.online-b.online)/Math.max(a.online,b.online)<=.25],['Bảo hành và phụ kiện',5,equal(a.warranty,b.warranty)&&equal(a.accessories,b.accessories)],['Kiểu dáng đã xác nhận',5,equal(a.style,b.style)]];
 const score=criteria.reduce((s,c)=>s+(c[2]?c[1]:0),0);
 return {score,criteria:criteria.map(([label,max,matched])=>({label,max,points:matched?max:0})),reason:criteria.filter(c=>c[2]).map(c=>c[0]).join(' · '),level:score>=85?'Rất tương đồng':score>=70?'Có thể so sánh':score>=50?'Tương đồng một phần, cần duyệt':'Không ghép tự động'};
}
export const matchingRequired=['category','purpose','material','features'];
export const completeForMatching = p=>matchingRequired.every(k=>has(p[k]))&&(has(p.capacity)||has(p.dimensions));
export function candidates(p,products){return products.filter(q=>own(q)&&(!p.id||q.id!==p.id)).map(q=>({id:q.id,...similarity(p,q)})).filter(q=>q.score>=50).sort((a,b)=>b.score-a.score).slice(0,3);}
export function findRivalMatches(p,products,limit=4){if(!p)return [];const rivals=products.filter(q=>!own(q)&&(!p.id||q.id!==p.id));const scored=rivals.map(q=>{const sim=similarity(p,q);const catBonus=(p.category&&q.category&&norm(p.category)===norm(q.category))?15:0;return {product:q,id:q.id,score:sim.score+catBonus,rawScore:sim.score,reason:sim.reason,level:sim.level,criteria:sim.criteria};}).filter(x=>x.score>=35).sort((a,b)=>b.score-a.score);const seenBrands=new Set();const diverse=[];for(const item of scored){if(!seenBrands.has(item.product.brand)&&diverse.length<limit){seenBrands.add(item.product.brand);diverse.push(item);}}for(const item of scored){if(diverse.length>=limit)break;if(!diverse.some(d=>d.id===item.id))diverse.push(item);}return diverse;}
export function gap(p,products){if(candidates(p,products).length)return null;const local=products.filter(own);return local.length&&local.every(completeForMatching)&&completeForMatching(p)?'confirmed':'incomplete';}
export const financeRequired=['cost','sale','platform','ads','shipping','warrantyCost','gift','tax','other','discount','returns','quantity'];
export function finance(p,target=20){
 const missing=financeRequired.filter(k=>!has(p[k]));if(Number(p.returns)>0&&!has(p.returnCost))missing.push('returnCost');
 if(missing.length)return {missing};
 const price=Number(p.sale)*(1-Number(p.discount)/100), rate=(Number(p.platform)+Number(p.tax))/100;
 const returns=Number(p.returns)/100, delivered=Number(p.quantity)*(1-returns);
 const returnAllocation=returns>=1?null:Number(p.returnCost||0)*returns/(1-returns);
 if(returnAllocation===null||rate>=1||price<=0)return {missing:[],error:'Giá bán phải dương; tỷ lệ hoàn hàng và tổng phí theo doanh thu phải nhỏ hơn 100%.'};
 const fixed=['ads','shipping','warrantyCost','gift','other'].reduce((s,k)=>s+Number(p[k]),0)+returnAllocation;
 const fees=fixed+price*rate,gross=price-Number(p.cost),net=gross-fees;
 return {missing:[],price,fees,gross,net,margin:gross/price*100,roi:p.cost>0?gross/p.cost*100:null,netMargin:net/price*100,breakEven:(Number(p.cost)+fixed)/(1-rate),targetPrice:1-rate-target/100>0?(Number(p.cost)+fixed)/(1-rate-target/100):null,revenue:price*delivered,totalCost:(Number(p.cost)+fees)*delivered,totalProfit:net*delivered,delivered};
}
export const defaultWeights={demand:15,price:15,profit:20,quality:15,difference:10,onlinePotential:10,gtPotential:10,service:5};
export const scoreLabels={demand:'Phù hợp nhu cầu',price:'Lợi thế giá',profit:'Lợi nhuận dự kiến',quality:'Chất lượng và thông số',difference:'Tính năng khác biệt',onlinePotential:'Tiềm năng online',gtPotential:'Tiềm năng GT',service:'Bảo hành và hậu mãi'};
export function competition(p,products,weights=defaultWeights){
 const f=finance(p);const peers=products.filter(q=>own(q)!==own(p)&&similarity(p,q).score>=50&&q.online>0);
 const values={};for(const k of ['demand','quality','difference','onlinePotential','gtPotential','service'])values[k]=has(p[k])&&has(p.assessmentSource)?Number(p[k]):null;
 values.price=p.online>0&&peers.length?Math.max(0,Math.min(100,50+(peers.reduce((s,q)=>s+q.online,0)/peers.length-p.online)/p.online*100)):null;
 values.profit=has(f.netMargin)?Math.max(0,Math.min(100,f.netMargin/.3)):null;
 const missing=Object.keys(weights).filter(k=>weights[k]>0&&!has(values[k]));const confidence=Object.keys(weights).reduce((s,k)=>s+(has(values[k])?weights[k]:0),0);
 const score=missing.length?null:Math.round(Object.keys(weights).reduce((s,k)=>s+(values[k]||0)*weights[k]/100,0));
 return {score,missing,confidence,values,level:score===null?'Chưa đủ dữ liệu':score>=85?'Rất cạnh tranh':score>=70?'Có khả năng cạnh tranh':score>=50?'Cần điều chỉnh':'Bất lợi'};
}
export function recommendation(p,products,weights){
 const s=competition(p,products,weights),f=finance(p);const missing=[...s.missing.map(k=>scoreLabels[k]),...(f.missing||[]).map(k=>labels[k]),...['capitalDays','inventoryRisk'].filter(k=>!has(p[k])).map(k=>labels[k])];
 if(missing.length||f.error)return {label:'Nên tiếp tục theo dõi',reason:'Chưa đủ dữ liệu: '+(missing.join(', ')||f.error),pending:true};
 if(f.net<=0||s.score<50||p.inventoryRisk>=80)return {label:'Chưa nên nhập',reason:'Lợi nhuận không dương, điểm dưới 50 hoặc rủi ro tồn kho cao.'};
 if(s.values.price<45||f.netMargin<10)return {label:'Nên đàm phán lại giá',reason:'Lợi thế giá thấp hoặc biên lợi nhuận ròng dưới 10%.'};
 if(p.quality<60)return {label:'Nên điều chỉnh thông số',reason:'Đánh giá chất lượng dưới 60/100.'};
 if(s.score>=85&&p.inventoryRisk<=30&&p.capitalDays<=60)return {label:'Nên ưu tiên nhập',reason:'Điểm từ 85, rủi ro ≤30 và vòng quay vốn ≤60 ngày.'};
 return {label:'Nên nhập thử số lượng nhỏ',reason:'Có lợi nhuận; cần kiểm chứng sức bán và vòng quay vốn trước khi mở rộng.'};
}
export const opportunityStates=['Mới phát hiện','Đang nghiên cứu','Đang tìm nhà cung cấp','Đang lấy mẫu','Đang kiểm định','Đã duyệt nhập','Tạm hoãn','Không nhập'];
export function validate(p){const errors=[];for(const k of ['code','name','brand','category'])if(!has(p[k]))errors.push({field:k,message:'Bắt buộc nhập'});for(const k of numeric)if(has(p[k])&&(!Number.isFinite(Number(p[k]))||Number(p[k])<0))errors.push({field:k,message:'Phải là số không âm'});for(const f of fields.filter(f=>f.type==='percent'))if(Number(p[f.key])>=100)errors.push({field:f.key,message:'Phải từ 0 đến dưới 100%'});for(const k of [...Object.keys(defaultWeights).filter(k=>!['price','profit'].includes(k)),'inventoryRisk'])if(Number(p[k])>100)errors.push({field:k,message:'Tối đa 100'});if(Number(p.rating)>5)errors.push({field:'rating',message:'Tối đa 5'});for(const f of fields.filter(f=>f.type==='url'))if(has(p[f.key])&&!validLink(p[f.key]))errors.push({field:f.key,message:'Đường dẫn phải bắt đầu bằng https:// hoặc http://'});return errors;}

export function validLink(value){return /^https?:\/\//i.test(value)||(/^\/api\/assets\/[A-Za-z0-9][A-Za-z0-9._\/-]*$/.test(value)&&!String(value).split('/').some(p=>p==='..'||p==='.'));}

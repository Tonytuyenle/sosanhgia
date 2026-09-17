// @ts-nocheck
import React,{useState,useEffect,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {Building2,LayoutDashboard,Package,Boxes,Upload,GitCompareArrows,ArrowLeftRight,ChartNoAxesCombined,Sparkles,ShoppingBag,FileDown,Users,Settings,Search,Plus,ChevronRight,ChevronDown,ArrowUpRight,ArrowDownRight,LogOut,Bell,Check,CheckCircle2,X,Menu,Maximize2,Download,Filter,SlidersHorizontal,ImageOff,Pencil,Trash2,Bookmark,ShieldCheck,Info,History,FileSpreadsheet,Eye,Link,AlertTriangle,RefreshCw,Printer,LockKeyhole,TrendingUp,Target,Wallet,BarChart3} from 'lucide-react';
import * as D from '../shared/domain.js';
import {enrichProductSpecs, batchEnrichCatalog} from '../shared/spec-intelligence.js';
import './styles.css';
import './readability.css';
import {comparisonPriceGroups,comparisonPrices,populatedPriceFields} from '../shared/price-comparison.js';
import BrandSheets from './BrandSheets';
import * as XLSX from 'xlsx';
import { sheetName } from '../shared/brands.js';

function saveFile(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function api(url,body?,method='POST'){const res=await fetch('/api'+url,{method:body===undefined?'GET':method,headers:body instanceof FormData?{}:{'Content-Type':'application/json'},...(body!==undefined?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});let data;try{data=await res.json();}catch{throw new Error('Không thể đọc phản hồi từ máy chủ');}if(!res.ok)throw new Error(data.error||'Không thể thực hiện');return data;}
const money=v=>D.has(v)?new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(v):'Chưa có dữ liệu';
const num=v=>D.has(v)?Number(v).toLocaleString('vi-VN',{maximumFractionDigits:1}):'—';
const date=v=>v?new Date(v).toLocaleString('vi-VN'):'—';
const IconButton=({icon:Icon,label,onClick,...props})=><button className="icon-button" aria-label={label} title={label} onClick={onClick} {...props}><Icon size={18}/></button>;
function Badge({children,tone=''}){return <span className={'badge '+tone}>{children}</span>}
function Empty({title='Chưa có dữ liệu',text='Thêm sản phẩm hoặc nhập file Excel để bắt đầu.',children=null}){return <div className="empty"><Package size={36}/><h3>{title}</h3><p>{text}</p>{children}</div>}
function Score({score}){return score?.score==null?<span className="muted small">Chưa đủ dữ liệu</span>:<span className={'score '+(score.score>=70?'good':score.score>=50?'warn':'bad')}>{score.score}<small>/100</small></span>}
function ProductImage({p,large=false}){const[broken,setBroken]=useState(false);useEffect(()=>setBroken(false),[p.image]);return <div className={'product-image '+(large?'large':'')}>{p.image&&!broken?<img src={p.image} alt={p.name} onError={()=>setBroken(true)}/>:<div className="no-image"><Package size={large?52:34}/><span>{p.demo?'SẢN PHẨM MINH HỌA':'Chưa có ảnh'}</span></div>}{D.own(p)&&<span className="brand-mark">Lock<span>&</span>King</span>}</div>}
function generateAiSalesPitch(p, peers = [], user) {
  if (!p) return '';
  const isOwn = D.own(p);
  const rival = peers[0];
  const specs = [
    p.capacity ? `Dung tích: ${p.capacity}` : null,
    p.power ? `Công suất: ${p.power}` : null,
    p.material ? `Chất liệu: ${p.material}` : null,
    p.warranty ? `Bảo hành: ${p.warranty} tháng` : null
  ].filter(Boolean).join(' | ');

  let pitch = `🔥 KỊCH BẢN TƯ VẤN & ĐÀM PHÁN ĐẠI LÝ — ${p.code} (${p.name})\n`;
  pitch += `📌 Phân khúc: ${p.category || 'Gia dụng/Thiết bị bếp'} · Thương hiệu: ${p.brand}\n`;
  pitch += `⚙️ Thông số kỹ thuật: ${specs || 'Đang cập nhật'}\n`;
  pitch += `💰 Giá niêm yết/online: ${money(p.online)}\n\n`;

  pitch += `🌟 1. ĐIỂM MẠNH VƯỢT TRỘI (USP):\n`;
  if (p.highlights || p.features) pitch += `• ${p.highlights || p.features}\n`;
  if (p.warranty) pitch += `• Chính sách bảo hành chính hãng ${p.warranty} tháng tạo sự an tâm tuyệt đối cho đại lý và người tiêu dùng.\n`;
  if (p.material) pitch += `• Chất liệu ${p.material} cao cấp, gia công tỉ mỉ theo tiêu chuẩn xuất khẩu.\n`;

  if (rival) {
    pitch += `\n⚔️ 2. ĐỐI ĐẦU TRỰC DIỆN VỚI ${rival.brand} (${rival.code}):\n`;
    pitch += `• Giá ${rival.brand}: ${money(rival.online)} vs Lock&King: ${money(p.online)}\n`;
    if (p.online && rival.online) {
      const diff = rival.online - p.online;
      if (diff > 0) {
        pitch += `• Lợi thế giá: Lock&King tối ưu hơn ${money(diff)} (${num(diff / rival.online * 100)}%), giúp đại lý dễ chốt khách thích hàng chất lượng giá hợp lý.\n`;
      } else {
        pitch += `• Định vị cao cấp hơn: Giá cao hơn tương xứng với công suất/chất liệu hoàn thiện vượt trội so với đối thủ.\n`;
      }
    }
  }

  pitch += `\n💼 3. LUẬN ĐIỂM CHỐT ĐẠI LÝ / CÔNG TRÌNH:\n`;
  pitch += `• "Sản phẩm ${p.code} của Lock&King mang lại tỷ suất lợi nhuận gộp hấp dẫn cho đại lý, bảo hành uy tín và nguồn hàng ổn định từ Vũ Gia."\n`;
  pitch += `• "Hỗ trợ catalogue, hình ảnh truyền thông và đổi mới kỹ thuật trong 30 ngày nếu phát sinh lỗi nhà sản xuất."\n`;

  if (p.financial?.breakEven) {
    pitch += `\n⚠️ 4. CẢNH BÁO GIÁ SÀN & LỢI NHUẬN:\n`;
    pitch += `• Giá hòa vốn: ${money(p.financial.breakEven)} | Chiết khấu an toàn: Không bán dưới mức hòa vốn.\n`;
  }

  return pitch;
}

const pages=[['dashboard','Tổng quan',LayoutDashboard],['brands','Danh mục theo hãng',Building2],['own','Sản phẩm Lock&King',Package],['rivals','Sản phẩm đối thủ',Boxes],['import','Nhập dữ liệu Excel',Upload],['matching','Ghép cặp sản phẩm',GitCompareArrows],['compare','So sánh sản phẩm',ArrowLeftRight],['missing','Sản phẩm Lock&King chưa có',Sparkles],['finance','Giá & lợi nhuận',ChartNoAxesCombined],['scoring','Điểm cạnh tranh',Target],['proposals','Đề xuất nhập hàng',ShoppingBag],['reports','Báo cáo & xuất dữ liệu',FileDown],['admin','Quản trị hệ thống',Settings]];

function Login({setup,onLogin}){const [error,setError]=useState(''),[busy,setBusy]=useState(false);async function submit(e){e.preventDefault();setBusy(true);try{onLogin(await api(setup?'/setup':'/login',Object.fromEntries(new FormData(e.target))));}catch(e){setError(e.message)}finally{setBusy(false)}}return <div className="login"><div className="login-brand"><div className="logo-mark">V</div><h1>VŨ GIA</h1><span>PRODUCT INTELLIGENCE · V2</span><h2>Dữ liệu rõ ràng.<br/>Quyết định vững vàng.</h2><p>So sánh sản phẩm, quản trị giá và đánh giá cơ hội kinh doanh trên cùng một hệ thống.</p><div className="login-features"><span><CheckCircle2/> Danh mục tập trung</span><span><CheckCircle2/> So sánh có kiểm chứng</span><span><CheckCircle2/> Phân quyền theo bộ phận</span></div></div><form onSubmit={submit} className="login-form"><Badge tone="blue">VŨ GIA · PHIÊN BẢN 2</Badge><h2>{setup?'Thiết lập hệ thống':'Chào mừng trở lại'}</h2><p>{setup?'Tạo tài khoản quản trị đầu tiên để bắt đầu.':'Đăng nhập để truy cập không gian làm việc.'}</p>{setup&&<label>Họ và tên<input name="name" required autoComplete="name" placeholder="Nhập họ và tên"/></label>}<label>Email<input name="email" type="email" required autoComplete="username" placeholder="ten@congty.vn"/></label><label>Mật khẩu<input name="password" type="password" minLength={setup?10:1} required autoComplete={setup?'new-password':'current-password'} placeholder={setup?'Tối thiểu 10 ký tự':'Nhập mật khẩu'}/></label>{error&&<div className="notice error">{error}</div>}<button className="primary wide" disabled={busy}>{busy?'Đang xử lý…':setup?'Tạo hệ thống':'Đăng nhập'}<ArrowUpRight size={18}/></button><p className="small"><LockKeyhole size={14}/> Phiên làm việc bảo mật · Tự hết hạn sau 8 giờ</p></form></div>}

function App(){
 const[user,setUser]=useState(null),[status,setStatus]=useState(null),[data,setData]=useState({products:[],matches:[],weights:D.defaultWeights,opportunities:[],proposals:[],follows:[],imports:[]}),[page,setPage]=useState('dashboard'),[query,setQuery]=useState(''),[toast,setToast]=useState(''),[detail,setDetail]=useState(null),[editing,setEditing]=useState(null),[selected,setSelected]=useState([]),[sidebar,setSidebar]=useState(false),[loading,setLoading]=useState(true),[fatal,setFatal]=useState('');
 async function load(){try{setData(await api('/data'));}catch(e){notify(e.message)}}
 useEffect(()=>{Promise.all([api('/status'),api('/me').catch(()=>null)]).then(([s,u])=>{setStatus(s);setUser(u)}).catch(e=>setFatal(e.message)).finally(()=>setLoading(false));},[]);
 useEffect(()=>{if(user)load()},[user]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t)},[toast]);
 function notify(message){setToast(message)}
 async function action(url,body,method='POST'){try{await api(url,body,method);await load();notify('Đã lưu thành công');return true}catch(e){notify(e.message);return false}}
  function handleSmartSelect(p){if(!p)return;if(D.own(p)){const rivals=D.findRivalMatches(p,data.products,3);if(rivals.length>0){const matchIds=[p.id,...rivals.map(r=>r.id)];setSelected(matchIds);setPage('compare');setDetail(null);notify(`⚡ Đã tự động đề xuất ${rivals.length} đối thủ (${rivals.map(r=>r.product.brand+' '+r.product.code).join(', ')}) và mở bảng so sánh!`);return;}}toggle(p.id);}
  function toggle(id,autoCompare=false){const target=data.products.find(p=>p.id===id);if(autoCompare&&target&&D.own(target)&&!selected.includes(id)&&selected.length===0){handleSmartSelect(target);return;}setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length<5?[...prev,id]:(notify('Chọn tối đa 5 sản phẩm'),prev))}
  function navigate(p){setPage(p);setSidebar(false);setQuery('')}
  const ctx={user,data,products:data.products,notify,action,load,setDetail,setEditing,selected,setSelected,toggle,handleSmartSelect,setPage:navigate,query};
 if(loading)return <div className="loading">Đang mở hệ thống Vũ Gia…</div>;
 if(fatal)return <Empty title="Không kết nối được máy chủ" text={fatal}><button onClick={()=>location.reload()}>Thử lại</button></Empty>;
 if(!user)return <Login setup={status?.setup} onLogin={setUser}/>;
 const current=pages.find(p=>p[0]===page);
 const activeDetail=data.products.find(p=>p.id===detail);
 const permitted=pages.filter(([id])=>id!=='admin'||['admin','leader'].includes(user.role)).filter(([id])=>id!=='import'||['admin','leader'].includes(user.role)).filter(([id])=>id!=='finance'||D.canFinance(user.role));
 return <div className="app"><aside className={'sidebar '+(sidebar?'open':'')}><div className="brand"><div className="logo-mark">V</div><div><strong>VŨ GIA</strong><span>PRODUCT INTELLIGENCE</span></div><Badge>V2</Badge></div><div className="workspace-label">KHÔNG GIAN LÀM VIỆC</div><nav>{permitted.map(([id,label,Icon],i)=><React.Fragment key={id}>{[4,8,10].includes(i)&&<div className="nav-divider"/>}<button className={page===id?'active':''} onClick={()=>navigate(id)}><Icon size={19}/><span>{label}</span>{id==='matching'&&data.matches.filter(m=>m.status==='AI đề xuất'&&m.ids.length).length>0&&<b>{data.matches.filter(m=>m.status==='AI đề xuất'&&m.ids.length).length}</b>}</button></React.Fragment>)}</nav><div className="sidebar-foot"><div className="system-note"><ShieldCheck size={18}/><span>Dữ liệu lưu tại máy chủ<br/><small>Quyền truy cập theo vai trò</small></span></div><button className="profile" onClick={()=>{if(confirm('Đăng xuất khỏi hệ thống?'))api('/logout',{}).then(()=>{setUser(null);setStatus({setup:false})})}}><div className="avatar">{user.name.slice(0,1).toUpperCase()}</div><span><strong>{user.name}</strong><small>{D.roles[user.role]}</small></span><LogOut size={17}/></button></div></aside>{sidebar&&<div className="sidebar-overlay" onClick={()=>setSidebar(false)}/>}
 <div className="workspace"><header className="topbar"><IconButton icon={Menu} label="Mở menu" onClick={()=>setSidebar(!sidebar)} className="icon-button mobile-menu"/><div className="breadcrumb">Không gian làm việc <ChevronRight size={14}/><strong>{current?.[1]}</strong></div><div className="topbar-actions"><span className="today">{new Date().toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}</span><IconButton icon={Maximize2} label="Toàn màn hình khi họp" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>notify('Trình duyệt không hỗ trợ toàn màn hình'))}}/><IconButton icon={RefreshCw} label="Làm mới dữ liệu" onClick={load}/><div className="avatar small-avatar">{user.name[0]}</div></div></header>
 <main><div className="page-heading"><div><div className="eyebrow">VŨ GIA / {page==='dashboard'?'TRUNG TÂM ĐIỀU HÀNH':'QUẢN TRỊ SẢN PHẨM'}</div><h1>{current?.[1]}</h1><p>{page==='dashboard'?'Bức tranh kinh doanh và những quyết định cần ưu tiên.':page==='own'?'Quản lý danh mục, theo dõi giá và sức cạnh tranh của Lock&King.':page==='rivals'?'Theo dõi thị trường và tìm sản phẩm tương đương.':'Dữ liệu có nguồn · Đánh giá có cơ sở · Quyết định có kiểm duyệt'}</p></div><div className="heading-actions">{['admin','leader'].includes(user.role)&&<><button onClick={()=>navigate('import')}><Upload size={16}/>Nhập Excel</button><button className="primary" onClick={()=>setEditing({})}><Plus size={17}/>Thêm sản phẩm</button></>}</div></div>
 {data.products.some(p=>p.demo)&&<div className="demo-banner"><Info size={16}/><span>Đang có dữ liệu minh họa. Các mức giá và điểm đánh giá không phải thông tin thị trường đã xác minh.</span></div>}
 {page==='dashboard'&&<Dashboard {...ctx}/>}
 {page==='brands'&&<BrandSheets {...ctx} renderCatalog={(items,name)=><Catalog key={name} {...ctx} products={items} kind={D.own({brand:name})?'own':'rivals'}/>}/>}
 {['own','rivals'].includes(page)&&<Catalog {...ctx} kind={page}/>}
 {page==='import'&&<ImportView {...ctx}/>}
 {page==='matching'&&<Matching {...ctx}/>}
 {page==='compare'&&<Comparison {...ctx}/>}
 {page==='finance'&&<FinanceView {...ctx}/>}
 {page==='scoring'&&<Scoring {...ctx}/>}
 {['missing','opportunities','gap'].includes(page)&&<MissingProductsView {...ctx}/>}
 {page==='proposals'&&<Proposals {...ctx}/>}
 {page==='reports'&&<Reports {...ctx}/>}
 {page==='admin'&&<Admin {...ctx}/>}
 <footer>VŨ GIA · So sánh sản phẩm V2 <span>Nguồn dữ liệu và thời điểm cập nhật được lưu theo từng sản phẩm.</span></footer>
 </main></div>
 {selected.length>0&&page!=='compare'&&<div className="compare-tray"><div><ArrowLeftRight size={20}/><strong>{selected.length}/5 sản phẩm đã chọn</strong></div><button onClick={()=>setSelected([])}>Bỏ chọn</button><button className="primary" onClick={()=>navigate('compare')}>So sánh ngay <ChevronRight size={16}/></button></div>}
 {activeDetail&&<ProductDetail {...ctx} p={activeDetail} close={()=>setDetail(null)}/>}
 {editing&&<ProductEditor {...ctx} product={editing} close={()=>setEditing(null)}/>}
 {toast&&<div className="toast" role="status"><Info size={18}/>{toast}<button onClick={()=>setToast('')} aria-label="Đóng thông báo"><X size={16}/></button></div>}
 <nav className="mobile-bottom-nav">
   <button className={page==='dashboard'?'active':''} onClick={()=>navigate('dashboard')}><LayoutDashboard size={20}/><span>Tổng quan</span></button>
   <button className={page==='brands'?'active':''} onClick={()=>navigate('brands')}><Building2 size={20}/><span>Hãng</span></button>
   <button className={page==='own'||page==='rivals'?'active':''} onClick={()=>navigate(page==='rivals'?'rivals':'own')}><Package size={20}/><span>Sản phẩm</span></button>
   <button className={page==='compare'?'active':''} onClick={()=>navigate('compare')}><ArrowLeftRight size={20}/><span>So sánh</span>{selected.length>0&&<span className="badge-dot"/>}</button>
   <button onClick={()=>setSidebar(true)}><Menu size={20}/><span>Menu</span>{data.matches.filter(m=>m.status==='AI đề xuất'&&m.ids.length).length>0&&<span className="badge-dot"/>}</button>
 </nav>
 </div>
}

function Stat({label,value,icon:Icon,tone='blue',note}){return <div className="stat"><div className="stat-top"><span>{label}</span><div className={'stat-icon '+tone}><Icon size={20}/></div></div><strong>{value}</strong><small>{note}</small></div>}
function Dashboard(c){const {products,data,user,setPage,setDetail,action}=c,own=products.filter(D.own),rivals=products.filter(p=>!D.own(p)),pending=data.matches.filter(m=>m.status==='AI đề xuất'&&m.ids?.length),gaps=rivals.filter(p=>p.gap==='confirmed'),profits=own.filter(p=>D.has(p.financial?.net)).sort((a,b)=>b.financial.net-a.financial.net).slice(0,10),top=own.filter(p=>!p.recommendation?.pending&&p.recommendation).sort((a,b)=>(b.score?.score||0)-(a.score?.score||0)).slice(0,10);const bars=own.filter(p=>p.online>0).slice(0,6);const brands=Object.entries(rivals.reduce((a,p)=>(a[p.brand]=(a[p.brand]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);const missingProducts=D.getMissingProducts(products);
 return <><div className="stats"><Stat label="Sản phẩm Lock&King" value={own.length} icon={Package} note="Danh mục của Vũ Gia"/><Stat label="Sản phẩm đối thủ" value={rivals.length} icon={Boxes} tone="violet" note={`${brands.length} thương hiệu đang theo dõi`}/><Stat label="Ghép cặp chờ duyệt" value={pending.length} icon={GitCompareArrows} tone="orange" note={`${data.matches.filter(m=>m.ids?.length).length} sản phẩm đã có ghép cặp`}/><Stat label="Sản phẩm L&K chưa có" value={missingProducts.length} icon={Sparkles} tone="green" note={`Từ ${brands.length} thương hiệu đối thủ`}/></div>
 {!products.length?<Empty title="Sẵn sàng xây dựng danh mục của bạn" text="Nhập Excel hoặc thêm sản phẩm đầu tiên. Có thể nạp dữ liệu minh họa để thử các chức năng."><div className="inline-actions"><button className="primary" onClick={()=>setPage('import')}>Nhập Excel</button>{user.role==='admin'&&<button onClick={()=>{if(confirm('Nạp 11 sản phẩm minh họa vào danh mục trống?'))action('/demo',{})}}>Nạp dữ liệu minh họa</button>}</div></Empty>:<>
 <div className="dashboard-grid"><section className="panel price-panel"><div className="panel-head"><div><h2>Vị thế giá trên thị trường</h2><p>Giá online của Lock&King và sản phẩm tương đương</p></div><button className="text-button" onClick={()=>setPage('compare')}>Chi tiết <ArrowUpRight size={16}/></button></div><div className="legend"><span><i className="blue-dot"/>Lock&King</span><span><i className="light-dot"/>Trung bình đối thủ tương đương</span></div><div className="bar-chart">{bars.map(p=>{const peers=rivals.filter(q=>D.similarity(p,q).score>=50&&q.online>0),avg=peers.length?peers.reduce((s,q)=>s+q.online,0)/peers.length:null;const max=Math.max(...bars.map(q=>q.online),...rivals.map(q=>q.online||0),1);return <div className="bar-row" key={p.id}><button className="bar-label" onClick={()=>setDetail(p.id)}>{p.category}<small>{p.code}</small></button><div className="bar-tracks"><div><span style={{width:Math.max(2,p.online/max*100)+'%'}}/><b>{money(p.online)}</b></div>{avg&&<div><span className="rival-bar" style={{width:Math.max(2,avg/max*100)+'%'}}/><b>{money(avg)}</b></div>}</div></div>})}</div></section>
 <section className="panel attention"><div className="panel-head"><h2>Cần bạn xử lý</h2><Badge tone="orange">Ưu tiên</Badge></div><button onClick={()=>setPage('matching')}><div className="attention-icon orange"><GitCompareArrows/></div><span><strong>{pending.length} kết quả ghép cặp</strong><small>Kiểm tra và xác nhận tương đương</small></span><ChevronRight size={18}/></button><button onClick={()=>setPage('missing')}><div className="attention-icon green"><Sparkles/></div><span><strong>{missingProducts.length} sản phẩm L&K chưa có</strong><small>Xem danh mục các hãng đối thủ</small></span><ChevronRight size={18}/></button><button onClick={()=>setPage('scoring')}><div className="attention-icon violet"><Target/></div><span><strong>{own.filter(p=>p.score?.score===null).length} sản phẩm thiếu dữ liệu</strong><small>Bổ sung trước khi chấm điểm</small></span><ChevronRight size={18}/></button><div className="advantage-summary"><div><strong className="good-text">{own.filter(p=>p.score?.score>=70).length}</strong><span>Có khả năng cạnh tranh</span></div><div><strong className="bad-text">{own.filter(p=>p.score?.score!=null&&p.score.score<50).length}</strong><span>Đang bất lợi</span></div></div></section></div>
 <div className="dashboard-grid lower"><section className="panel"><div className="panel-head"><div><h2>Sản phẩm cần ưu tiên đánh giá</h2><p>Xếp theo điểm cạnh tranh, tối đa 10 sản phẩm</p></div><button className="text-button" onClick={()=>setPage('proposals')}>Xem đề xuất <ChevronRight size={16}/></button></div>{top.length?<div className="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Điểm</th><th>Lợi nhuận / sp</th><th>Đề xuất</th></tr></thead><tbody>{top.map(p=><tr key={p.id}><td><button className="table-product" onClick={()=>setDetail(p.id)}><strong>{p.name}</strong><small>{p.code} · {p.category}</small></button></td><td><Score score={p.score}/></td><td className="good-text">{money(p.financial?.net)}</td><td><Badge tone="blue">{p.recommendation.label}</Badge></td></tr>)}</tbody></table></div>:<Empty title="Chưa có đề xuất đủ cơ sở" text="Cần dữ liệu giá nhập, chi phí và đánh giá có nguồn để xếp hạng."/>}</section><section className="panel"><div className="panel-head"><h2>Thương hiệu đang theo dõi</h2><Boxes size={20}/></div><div className="brand-list">{brands.slice(0,5).map(([brand,count],i)=><div key={brand}><div className="brand-initial">{brand.slice(-1)}</div><span><strong>{brand}</strong><small>{rivals.filter(p=>p.brand===brand&&p.matching?.length).length} sản phẩm cạnh tranh trực tiếp</small></span><b>{count}</b></div>)}</div><div className="panel-bottom">Số lượng sản phẩm có trong danh mục hiện tại</div></section></div>
 {D.canFinance(user.role)&&<div className="dashboard-grid"><section className="panel"><div className="panel-head"><h2>Top lợi nhuận dự kiến</h2><Wallet size={20}/></div><div className="profit-bars">{profits.map(p=><div key={p.id}><button onClick={()=>setDetail(p.id)}>{p.code}</button><div><span style={{width:Math.max(2,Math.abs(p.financial.net)/Math.max(...profits.map(q=>Math.abs(q.financial.net)),1)*100)+'%',background:p.financial.net<0?'#dc4c57':undefined}}/></div><strong>{money(p.financial.net)}</strong></div>)}{!profits.length&&<p className="muted">Chưa đủ dữ liệu lợi nhuận.</p>}</div></section><section className="panel"><div className="panel-head"><h2>Top cần điều chỉnh giá</h2><TrendingUp size={20}/></div><div className="brand-list">{own.filter(p=>p.recommendation?.label==='Nên đàm phán lại giá').slice(0,10).map(p=><button className="list-link" key={p.id} onClick={()=>setDetail(p.id)}>{p.name}<Badge tone="orange">Đàm phán giá</Badge></button>)}{!own.some(p=>p.recommendation?.label==='Nên đàm phán lại giá')&&<p className="muted">Chưa ghi nhận đề xuất điều chỉnh giá có đủ cơ sở.</p>}</div></section></div>}
 <div className="dashboard-grid"><Matrix products={own} title="Ma trận giá & tính năng" x="online" y="difference" xLabel="Giá online →" yLabel="Tính năng khác biệt (0–100)" setDetail={setDetail}/><Matrix products={own} title="Ma trận tiềm năng & rủi ro" x="inventoryRisk" y="demand" xLabel="Rủi ro tồn kho (0–100) →" yLabel="Tiềm năng nhu cầu (0–100)" setDetail={setDetail}/></div>
 </>}</>
}
function Matrix({products,title,x,y,xLabel,yLabel,setDetail}){const points=products.filter(p=>D.has(p[x])&&D.has(p[y])&&D.has(p.assessmentSource));const max=Math.max(1,...points.map(p=>p[x]));const clusters=Object.values(points.reduce((out,p)=>{const key=p[x]+':'+p[y];(out[key]??=[]).push(p);return out},{}));return <section className="panel"><div className="panel-head"><h2>{title}</h2><span className="small muted">{points.length} sản phẩm có dữ liệu</span></div><div className="scatter"><small>{yLabel}</small><div className="scatter-grid">{clusters.map((cluster,i)=>{const p=cluster[0];return <button key={i} style={{left:5+p[x]/max*88+'%',bottom:5+p[y]/100*80+'%'}} title={cluster.map(p=>p.code+': '+num(p[x])+' / '+num(p[y])).join('\n')} onClick={()=>setDetail(p.id)}><i/>{cluster.length>1?cluster.length+' sản phẩm':p.code}</button>})}{!points.length&&<span className="matrix-empty">Chưa đủ dữ liệu để hiển thị</span>}</div><small className="x-label">{xLabel}</small>{clusters.some(c=>c.length>1)&&<small>Các sản phẩm cùng tọa độ được gộp; trỏ chuột để xem mã.</small>}</div></section>}

function Catalog(c){const{products,kind,setEditing,setDetail,selected,toggle,data,handleSmartSelect}=c;const[search,setSearch]=useState(''),[category,setCategory]=useState(''),[brand,setBrand]=useState(''),[min,setMin]=useState(''),[max,setMax]=useState(''),[score,setScore]=useState(''),[profit,setProfit]=useState(''),[match,setMatch]=useState(''),[proposal,setProposal]=useState(''),[advanced,setAdvanced]=useState(false),[view,setView]=useState('grid');const base=products.filter(p=>D.own(p)===(kind==='own'));const list=base.filter(p=>D.norm([p.code,p.name,p.brand,p.category,p.purpose,p.capacity,p.power,p.material].join(' ')).includes(D.norm(search))&&(!category||p.category===category)&&(!brand||p.brand===brand)&&(!min||(D.has(p.online)&&p.online>=Number(min)))&&(!max||(D.has(p.online)&&p.online<=Number(max)))&&(!score||p.score?.score>=Number(score))&&(!profit||p.financial?.net>=Number(profit))&&(!match||(match==='gap'?p.gap==='confirmed':data.matches.find(m=>m.id===p.id)?.status===match))&&(!proposal||data.proposals.find(m=>m.productId===p.id)?.status===proposal));return <><section className="panel filter-panel"><div className="filter-main"><div className="search-field"><Search size={18}/><input aria-label="Tìm sản phẩm" placeholder="Tìm mã, tên, thương hiệu, dung tích, chất liệu…" value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Nhóm ngành hàng" value={category} onChange={e=>setCategory(e.target.value)}><option value="">Tất cả nhóm hàng</option>{[...new Set(base.map(p=>p.category))].map(v=><option key={v}>{v}</option>)}</select><select aria-label="Thương hiệu" value={brand} onChange={e=>setBrand(e.target.value)}><option value="">Tất cả thương hiệu</option>{[...new Set(base.map(p=>p.brand))].map(v=><option key={v}>{v}</option>)}</select><button onClick={()=>setAdvanced(!advanced)}><SlidersHorizontal size={17}/>Bộ lọc</button></div>{advanced&&<div className="advanced-filters"><label>Giá online từ<input type="number" min="0" value={min} onChange={e=>setMin(e.target.value)}/></label><label>Giá online đến<input type="number" min="0" value={max} onChange={e=>setMax(e.target.value)}/></label><label>Điểm tối thiểu<input type="number" min="0" max="100" value={score} onChange={e=>setScore(e.target.value)}/></label>{D.canFinance(c.user.role)&&<label>Lợi nhuận tối thiểu<input type="number" value={profit} onChange={e=>setProfit(e.target.value)}/></label>}<label>Ghép cặp<select value={match} onChange={e=>setMatch(e.target.value)}><option value="">Tất cả</option><option>AI đề xuất</option><option>Đã kiểm duyệt</option><option value="gap">Chưa có tương đương</option></select></label><label>Đề xuất nhập<select value={proposal} onChange={e=>setProposal(e.target.value)}><option value="">Tất cả</option><option>Chờ phê duyệt</option><option>Đã duyệt nhập</option><option>Từ chối</option></select></label></div>}</section><div className="results-line"><span><strong>{list.length}</strong> sản phẩm <span className="muted">trong danh mục</span></span><div className="segmented"><button className={view==='grid'?'selected':''} onClick={()=>setView('grid')}><LayoutDashboard size={16}/>Dạng thẻ</button><button className={view==='table'?'selected':''} onClick={()=>setView('table')}><Menu size={16}/>Dạng bảng</button></div></div>{!list.length?<Empty title="Không có sản phẩm phù hợp" text="Thử thay đổi bộ lọc hoặc thêm dữ liệu."/>:view==='grid'?<div className="product-grid">{list.map(p=><article className={'product-card '+(selected.includes(p.id)?'is-selected':'')} key={p.id}><div className="card-photo"><button className="photo-button" onClick={()=>setDetail(p.id)} aria-label={'Chi tiết '+p.name}><ProductImage p={p}/></button><input className="select-check" type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggle(p.id,true)} aria-label={'Chọn so sánh '+p.name}/><Badge tone={p.stock==='Còn hàng'?'green':''}>{p.stock||'Chưa rõ tồn kho'}</Badge></div><div className="card-body"><div className="card-meta"><span>{p.code}</span><span>{p.category}</span></div><button className="product-title" onClick={()=>setDetail(p.id)}>{p.name}</button><p className="card-specs">{[p.capacity,p.power,p.material].filter(Boolean).join(' · ')||'Chưa có thông số'}</p><div className="card-prices">{D.catalogPriceKeys.filter(k=>D.has(p[k])).map(k=><div key={k}><small>{D.labels[k]}</small><strong>{money(p[k])}</strong></div>)}{!D.catalogPriceKeys.some(k=>D.has(p[k]))&&<span className="muted">Chưa có giá xác định</span>}</div>{p.quoteReview?.length>0&&<button className="text-button warn-text" onClick={()=>setDetail(p.id)}>Báo giá có {p.quoteReview.length} mục cần xác minh</button>}<div className="card-bottom"><div><small>Điểm cạnh tranh</small><Score score={p.score}/></div><button onClick={()=>{setDetail(p.id)}} className="text-button">{D.own(p)?(D.findRivalMatches(p,products,4).length||products.filter(q=>!D.own(q)&&q.matching?.some(m=>m.id===p.id)).length):p.matching?.length||0} tương đương<ChevronRight size={14}/></button></div><div className="data-status"><span className={p.dataMissing?.length?'warn-text':'good-text'}>{p.dataMissing?.length?'Cần bổ sung thông số':'Đã có thông số chính'}</span><small>{p.demo?'Minh họa':p.brand}</small></div>{D.own(p)&&<button className="smart-match-button" title="Tự động đề xuất đối thủ & mở bảng so sánh" onClick={e=>{e.stopPropagation();(handleSmartSelect||toggle)(p)}}><Sparkles size={14}/> Tự động ghép đối thủ & So sánh</button>}</div></article>)}</div>:<div className="panel table-wrap"><table><thead><tr><th>Chọn</th><th>Sản phẩm</th><th>Thương hiệu</th><th>Giá theo báo giá</th><th>Điểm</th><th>Tồn kho</th></tr></thead><tbody>{list.map(p=><tr key={p.id}><td><input type="checkbox" aria-label={'Chọn '+p.name} checked={selected.includes(p.id)} onChange={()=>toggle(p.id,true)}/></td><td><button className="table-product" onClick={()=>setDetail(p.id)}><strong>{p.name}</strong><small>{p.code}</small></button></td><td>{p.brand}</td><td>{D.catalogPriceKeys.filter(k=>D.has(p[k])).map(k=><div key={k}><small>{D.labels[k]}: </small>{money(p[k])}</div>)}{!D.catalogPriceKeys.some(k=>D.has(p[k]))&&"Chưa có giá xác định"}</td><td><Score score={p.score}/></td><td>{p.stock||'Chưa có dữ liệu'}</td></tr>)}</tbody></table></div>}</>}

function ProductEditor({product,close,user,action,notify}){const[tab,setTab]=useState('basic'),[values,setValues]=useState({...product}),[saving,setSaving]=useState(false);const permitted=Object.entries(D.groups).filter(([key])=>D.fields.some(f=>f.group===key&&D.editable(user.role,f.key)));useEffect(()=>{if(!permitted.some(([key])=>key===tab))setTab(permitted[0]?.[0])},[]);const fs=D.fields.filter(f=>f.group===tab&&(D.canFinance(user.role)||!D.privateKeys.includes(f.key)));async function save(e){e.preventDefault();const payload={};D.fields.filter(f=>D.editable(user.role,f.key)).forEach(f=>{if(values[f.key]!==undefined)payload[f.key]=values[f.key]});setSaving(true);const ok=await action(product.id?'/products/'+product.id:'/products',payload,product.id?'PUT':'POST');setSaving(false);if(ok)close();}return <div className="modal-backdrop"><section className="modal editor" role="dialog" aria-modal="true" aria-label="Thông tin sản phẩm"><div className="modal-head"><div><h2>{product.id?'Chỉnh sửa sản phẩm':'Thêm sản phẩm mới'}</h2><p>Ô trống là chưa có dữ liệu. Chỉ nhập 0 khi đã xác nhận.</p></div><div className="inline-actions"><button type="button" className="primary compact" onClick={()=>{const enriched=enrichProductSpecs(values);setValues(enriched);notify?.('🔍 Đã tự động nhận diện và làm giàu thông số kỹ thuật từ Web!')}}><Sparkles size={14}/> Tự động điền thông số từ Web</button><IconButton icon={X} label="Đóng" onClick={close}/></div></div><div className="tabs">{permitted.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{label}</button>)}</div><form onSubmit={save}><div className="form-grid scroll-form">{fs.map(f=><label key={f.key} className={f.type==='textarea'?'span-2':''}>{f.label}{['code','name','brand','category'].includes(f.key)&&<span className="required"> *</span>}{f.type==='textarea'?<textarea rows={3} value={values[f.key]??''} disabled={!D.editable(user.role,f.key)} onChange={e=>setValues({...values,[f.key]:e.target.value})}/>:<input type={['number','money','percent'].includes(f.type)?'number':f.type==='url'&&!String(values[f.key]||'').startsWith('/api/assets/')?'url':f.type==='date'?'date':'text'} step="any" min={D.numeric.includes(f.key)?0:undefined} value={values[f.key]??''} disabled={!D.editable(user.role,f.key)} onChange={e=>setValues({...values,[f.key]:e.target.value})} placeholder={f.key==='brand'?'Lock&King hoặc tên thương hiệu':f.key==='capacity'?'Ví dụ: 3 l hoặc 3000 ml':f.key==='power'?'Ví dụ: 700 W':''}/>}</label>)}</div><div className="modal-foot"><span className="small muted">Người cập nhật: {user.name}</span><button type="button" onClick={close}>Hủy</button><button className="primary" disabled={saving}>{saving?'Đang lưu…':'Lưu sản phẩm'}</button></div></form></section></div>}

function ProductDetail(c){const{p,close,user,data,action,setEditing,setSelected,setPage,products,notify}=c;const[tab,setTab]=useState('details'),[advice,setAdvice]=useState('');const rivalMatches=D.own(p)?D.findRivalMatches(p,products,4):[];const peers=D.own(p)?(rivalMatches.length?rivalMatches.map(r=>r.product):products.filter(q=>!D.own(q)&&q.matching?.some(m=>m.id===p.id))):products.filter(q=>p.matching?.some(m=>m.id===q.id));const f=p.financial;useEffect(()=>{const fn=e=>{if(e.key==='Escape')close()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[]);return <div className="drawer-backdrop" onClick={close}><aside className="drawer" role="dialog" aria-modal="true" aria-label={'Chi tiết '+p.name} onClick={e=>e.stopPropagation()}><div className="drawer-top"><Badge tone="blue">{p.code}</Badge><div className="inline-actions"><IconButton icon={Bookmark} label="Theo dõi sản phẩm" onClick={()=>action('/follow/'+p.id,{})}/><IconButton icon={Pencil} label="Chỉnh sửa" onClick={()=>setEditing(p)}/><IconButton icon={X} label="Đóng chi tiết" onClick={close}/></div></div><ProductImage p={p} large/><div className="drawer-content"><div className="eyebrow">{p.brand} / {p.category}</div><h2>{p.name}</h2><div className="inline-actions"><Score score={p.score}/><Badge tone={p.stock==='Còn hàng'?'green':''}>{p.stock||'Chưa rõ tồn kho'}</Badge>{data.follows.some(f=>f.productId===p.id)&&<Badge tone="blue">Đang theo dõi</Badge>}</div><p className="muted small">Cập nhật {date(p.updatedAt)} · {p.updatedBy||'Chưa ghi nhận'}</p><div className="drawer-cta"><button className="primary" onClick={()=>{setSelected([p.id,...peers.slice(0,4).map(p=>p.id)]);setPage('compare');close()}}><ArrowLeftRight size={17}/>So sánh ngay</button>{!D.own(p)&&<button onClick={()=>{setPage('matching');close()}}>Chọn tương đương</button>}</div><div className="tabs"><button className={tab==='details'?'active':''} onClick={()=>setTab('details')}>Chi tiết</button><button className={tab==='aiSales'?'active':''} onClick={()=>setTab('aiSales')}>🤖 Trợ lý AI Bán hàng</button><button className={tab==='prices'?'active':''} onClick={()=>setTab('prices')}>Giá & lợi nhuận</button><button className={tab==='matches'?'active':''} onClick={()=>setTab('matches')}>Tương đương ({peers.length})</button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}>Lịch sử</button></div>
{tab==='aiSales'&&<section className="detail-section"><div className="ai-copilot-card"><div className="ai-copilot-head"><h4><Sparkles size={18}/> Kịch bản Bán hàng & Đàm phán Đại lý AI</h4><Badge tone="green">Tự động tạo theo dữ liệu</Badge></div><div className="ai-script-box">{generateAiSalesPitch(p,peers,user)}</div><div className="inline-actions" style={{marginTop:14}}><button className="primary" onClick={()=>{navigator.clipboard.writeText(generateAiSalesPitch(p,peers,user)).then(()=>notify('Đã sao chép kịch bản đàm phán AI!')).catch(()=>notify('Không thể sao chép tự động'))}}><Sparkles size={16}/> Sao chép Kịch bản (Gửi Zalo / Khách)</button></div></div></section>}
 {tab==='details'&&<>{D.own(p)&&rivalMatches.length>0&&<section className="detail-section rival-match-section"><div className="section-head"><h4><Sparkles size={18}/> Đối thủ tương đương trên thị trường ({rivalMatches.length})</h4><button className="primary compact" onClick={()=>{setSelected([p.id,...rivalMatches.slice(0,3).map(r=>r.id)]);setPage('compare');close()}}><Sparkles size={14}/> So sánh trực diện tất cả</button></div><div className="rival-suggestions-list">{rivalMatches.map(r=><div className="rival-match-item" key={r.id}><div><strong>{r.product.brand} · {r.product.code}</strong><p>{r.product.name}</p><span className="small muted">{[r.product.capacity,r.product.power,r.product.material].filter(Boolean).join(' · ')}</span></div><div className="rival-match-actions"><Badge tone={r.score>=70?'green':'orange'}>Tương đồng {r.score}%</Badge><button onClick={()=>{setSelected([p.id,r.id]);setPage('compare');close()}}>So sánh 1-1</button></div></div>)}</div></section>}{['basic','specs','media','market','procurement','assessment'].map(group=><section className="detail-section" key={group}><h3>{D.groups[group]}</h3><dl>{D.fields.filter(f=>f.group===group&&!['image','images','packaging'].includes(f.key)&&(D.canFinance(user.role)||!D.privateKeys.includes(f.key))).map(f=><div key={f.key}><dt>{f.label}</dt><dd>{D.has(p[f.key])?(f.type==='url'?<a href={p[f.key]} target="_blank" rel="noreferrer">Mở đường dẫn <ArrowUpRight size={12}/></a>:String(p[f.key])):<span className="muted">Chưa có dữ liệu</span>}</dd></div>)}</dl></section>)}{(p.images||p.packaging)&&<div className="image-gallery">{[...(p.images||'').split('\n'),p.packaging].filter(v=>/^https?:\/\//.test(v)).map((src,i)=><img key={i} src={src} alt={'Ảnh sản phẩm '+(i+1)} loading="lazy"/>)}</div>}<section className="detail-section"><h3>Chuẩn hóa dữ liệu</h3>{p.normalizationConfirmed?<Badge tone="green">Đã xác nhận bởi {p.normalizationConfirmed.by}</Badge>:<><p className="small muted">Giữ nguyên dữ liệu gốc. Xem giá trị chuẩn bên dưới trước khi xác nhận.</p><dl>{['code','capacity','power','mass','dimensions'].map(k=><div key={k}><dt>{D.labels[k]}</dt><dd>{p[k]||'—'} → {D.normalizeProduct(p).data[k]||'—'}</dd></div>)}</dl>{(p.warnings||[]).map(w=><p className="warn-text small" key={w}>{w}</p>)}{['admin','leader'].includes(user.role)&&<button onClick={()=>{if(confirm('Xác nhận áp dụng các giá trị chuẩn hóa? Dữ liệu gốc vẫn được lưu.'))action('/products/'+p.id+'/normalize',{})}}><Check size={16}/>Xác nhận chuẩn hóa</button>}</>}{p.raw&&<details><summary>Xem dữ liệu gốc</summary><dl>{D.fields.filter(f=>D.has(p.raw[f.key])).map(f=><div key={f.key}><dt>{f.label}</dt><dd>{String(p.raw[f.key])}</dd></div>)}</dl></details>}</section></>}
 {tab==='prices'&&<><section className="detail-section"><h3>Các mức giá và chi phí</h3><dl>{D.fields.filter(f=>f.group==='prices'&&(D.canFinance(user.role)||!D.privateKeys.includes(f.key))).map(f=><div key={f.key}><dt>{f.label}</dt><dd>{f.type==='money'?money(p[f.key]):p[f.key]??'Chưa có dữ liệu'}</dd></div>)}</dl></section>{f&&<section className="detail-section"><h3>Lợi nhuận dự kiến</h3>{f.missing?.length?<p className="notice">Cần bổ sung: {f.missing.map(k=>D.labels[k]).join(', ')}</p>:f.error?<p className="notice error">{f.error}</p>:<dl>{[['net','Lợi nhuận ròng / sp'],['breakEven','Giá hòa vốn'],['totalProfit','Tổng lợi nhuận dự kiến']].map(([k,l])=><div key={k}><dt>{l}</dt><dd>{money(f[k])}</dd></div>)}</dl>}<h3>{p.recommendation?.label}</h3><p>{p.recommendation?.reason}</p></section>}</>}
 {tab==='matches'&&<section className="detail-section">{peers.length?peers.map(q=><button key={q.id} className="peer-card" onClick={()=>c.setDetail(q.id)}><Package/><span><strong>{q.name}</strong><small>{D.similarity(p,q).reason}</small></span><Badge tone="blue">{D.similarity(p,q).score}/100</Badge></button>):<p className="notice">{p.gap==='confirmed'?'LOCK&KING HIỆN CHƯA CÓ SẢN PHẨM TƯƠNG ĐƯƠNG.':'Chưa đủ dữ liệu hoặc chưa có ghép cặp phù hợp.'}</p>}</section>}
 {tab==='history'&&<section className="detail-section"><h3>Lịch sử thay đổi giá</h3>{p.priceHistory?.length?p.priceHistory.slice().reverse().map((h,i)=><div className="history-entry" key={i}><strong>{date(h.at)} · {h.by}</strong>{h.changes.map((v,i)=><p key={i}>{D.labels[v.field]}: {v.before??'Chưa có'} → {v.after??'Chưa có'}</p>)}</div>):<p className="muted">Chưa có lịch sử được ghi nhận hoặc bạn không có quyền xem chi tiết.</p>}</section>}
 <div className="detail-section inline-actions"><button onClick={()=>{if(confirm('Gửi sản phẩm này vào danh sách chờ phê duyệt nhập hàng?'))action('/proposals/'+p.id,{status:'Chờ phê duyệt'})}}><ShoppingBag size={16}/>Đề xuất nhập</button><a className="button" href={'/api/report.xlsx?ids='+p.id}><FileDown size={16}/>Xuất báo cáo</a><button onClick={()=>setAdvice(`${p.name}\n${p.highlights||p.features||'Cần bổ sung điểm nổi bật.'}\n${[p.capacity,p.material,p.warranty?`Bảo hành ${p.warranty} tháng`:null].filter(Boolean).join(' · ')}\nGiá tham khảo: ${money(p.online)}.\nNguồn: ${p.source||'Cần xác minh'}.\n${p.limitations?'Lưu ý: '+p.limitations:''}`)}>Tạo nội dung tư vấn</button></div>{advice&&<div className="advice"><textarea value={advice} onChange={e=>setAdvice(e.target.value)} rows={7}/><button onClick={()=>navigator.clipboard.writeText(advice).then(()=>notify('Đã sao chép')).catch(()=>notify('Hãy chọn và sao chép nội dung trong ô'))}>Sao chép nội dung</button></div>}{['admin','leader'].includes(user.role)&&<button className="danger" onClick={async()=>{if(confirm('Xóa sản phẩm '+p.code+'? Thao tác này sẽ xóa cả ghép cặp liên quan.'))if(await action('/products/'+p.id,{confirm:true},'DELETE'))close()}}><Trash2 size={16}/>Xóa sản phẩm</button>}
 </div></aside></div>}

function ImportView({data,notify,load}){const[draft,setDraft]=useState(null),[mapping,setMapping]=useState([]),[validated,setValidated]=useState(null),[mode,setMode]=useState('skip'),[busy,setBusy]=useState(false);async function upload(file){if(!file)return;setBusy(true);try{const form=new FormData();form.append('file',file);const d=await api('/import/preview',form);setDraft(d);setMapping(d.mapping);setValidated(null);}catch(e){notify(e.message)}finally{setBusy(false)}}async function validate(){setBusy(true);try{setValidated((await api('/import/validate',{id:draft.id,mapping})).rows)}catch(e){notify(e.message)}finally{setBusy(false)}}async function commit(){if(!confirm(`Nhập ${draft.count} dòng? ${mode==='update'?'Dữ liệu trùng sẽ được cập nhật theo các cột đã ánh xạ.':mode==='new'?'Dòng trùng sẽ được tạo với mã mới.':'Dữ liệu trùng sẽ được bỏ qua.'}`))return;setBusy(true);try{const r=await api('/import/commit',{id:draft.id,mapping,mode,confirm:true});notify(`Đã thêm ${r.added}, cập nhật ${r.updated}, bỏ qua ${r.skipped} sản phẩm`);setDraft(null);setValidated(null);await load()}catch(e){notify(e.message)}finally{setBusy(false)}}function downloadErrors(){const rows=validated.filter(r=>r.errors.length).flatMap(r=>r.errors.map(e=>`"${r.row}","${D.labels[e.field]}","${e.message}"`));const url=URL.createObjectURL(new Blob(['\ufeffDòng,Cột,Nguyên nhân\r\n'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Loi-nhap-lieu.csv';a.click();URL.revokeObjectURL(url)}return <><div className="steps">{['Tải lên Excel','Ánh xạ & xem trước','Kiểm tra dữ liệu','Xác nhận nhập'].map((s,i)=><div key={s} className={(draft?validated?3:1:0)>=i?'active':''}><b>{i+1}</b>{s}</div>)}</div><section className="panel"><div className="panel-head"><div><h2>Nhập danh mục từ Excel</h2><p>Hỗ trợ .xlsx, .xls và .csv · Tối đa 10 MB / 2.000 dòng mỗi lần</p></div><a className="button" href="/api/template"><Download size={16}/>Tải Excel mẫu</a></div><label className="upload-zone"><div className="upload-icon"><FileSpreadsheet size={34}/></div><strong>{busy?'Đang xử lý dữ liệu…':'Chọn file Excel để nhập sản phẩm'}</strong><span>Dữ liệu sẽ được kiểm tra trước khi lưu vào danh mục.</span><input type="file" accept=".xlsx,.xls,.csv" aria-label="Chọn file Excel" disabled={busy} onChange={e=>upload(e.target.files[0])}/></label></section>{draft&&<><section className="panel"><div className="panel-head"><div><h2>Ghép cột dữ liệu</h2><p>{draft.count} dòng · Tự nhận diện theo tên cột, có thể điều chỉnh bên dưới</p></div><Badge tone="blue">Bản xem trước</Badge></div><div className="mapping-grid">{draft.headers.map((header,i)=><label key={i}>{header||`Cột ${i+1}`}<select value={mapping[i]} onChange={e=>{const m=[...mapping];m[i]=e.target.value;setMapping(m);setValidated(null)}}><option value="">Bỏ qua cột này</option>{D.fields.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></label>)}</div><div className="table-wrap preview-table"><table><thead><tr><th>Dòng</th>{draft.headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{draft.rows.map(row=><tr key={row.row}><td>{row.row}</td>{draft.headers.map((h,i)=><td key={i}>{String(row.values[i]??'')}</td>)}</tr>)}</tbody></table></div><div className="panel-bottom"><span>Hiển thị tối đa 20 dòng đầu. Kiểm tra sẽ chạy trên toàn bộ file.</span><button className="primary" onClick={validate} disabled={busy}><ShieldCheck size={16}/>Kiểm tra dữ liệu</button></div></section>{validated&&<section className="panel"><div className="panel-head"><h2>Kết quả kiểm tra</h2><div className="inline-actions"><Badge tone="green">{validated.filter(r=>!r.errors.length).length} hợp lệ</Badge><Badge tone="red">{validated.filter(r=>r.errors.length).length} dòng lỗi</Badge><Badge tone="orange">{validated.filter(r=>r.duplicate).length} dòng trùng</Badge></div></div><div className="table-wrap"><table><thead><tr><th>Dòng</th><th>Mã / Tên sản phẩm</th><th>Trùng dữ liệu</th><th>Cột lỗi & nguyên nhân</th><th>Kiểm tra đơn vị</th></tr></thead><tbody>{validated.map(r=><tr key={r.row}><td>{r.row}</td><td>{r.p.code}<br/><small>{r.p.name}</small></td><td>{r.duplicate?<Badge tone="orange">Trùng {r.duplicate.code}</Badge>:'—'}</td><td className="bad-text">{r.errors.map(e=>D.labels[e.field]+': '+e.message).join('; ')||<span className="good-text">Hợp lệ</span>}</td><td>{r.warnings.join('; ')||'—'}</td></tr>)}</tbody></table></div><div className="import-actions"><label>Dòng bị trùng<select value={mode} onChange={e=>setMode(e.target.value)}><option value="skip">Bỏ qua dữ liệu trùng</option><option value="update">Cập nhật dữ liệu cũ (cần xác nhận)</option><option value="new">Tạo sản phẩm mới với mã riêng</option></select></label>{validated.some(r=>r.errors.length)&&<button onClick={downloadErrors}>Tải danh sách lỗi</button>}<button className="primary" disabled={busy||validated.some(r=>r.errors.length)} onClick={commit}><Check size={16}/>Xác nhận nhập dữ liệu</button></div></section>}</>}<section className="panel"><div className="panel-head"><h2>Lịch sử nhập dữ liệu</h2><History size={20}/></div>{data.imports.length?<div className="table-wrap"><table><thead><tr><th>File</th><th>Thời gian</th><th>Người nhập</th><th>Thêm</th><th>Cập nhật</th><th>Bỏ qua</th></tr></thead><tbody>{data.imports.slice().reverse().map(i=><tr key={i.id}><td>{i.file}</td><td>{date(i.at)}</td><td>{i.by}</td><td>{i.added}</td><td>{i.updated}</td><td>{i.skipped}</td></tr>)}</tbody></table></div>:<Empty title="Chưa có lần nhập nào" text="Lịch sử được lưu sau khi xác nhận nhập thành công."/>}</section></>}

function Matching({products,data,action,setDetail,user}){const[filter,setFilter]=useState(''),[edits,setEdits]=useState({});const rivals=products.filter(p=>!D.own(p)),local=products.filter(D.own);const can=['admin','leader','sales'].includes(user.role);return <><div className="notice"><Info size={18}/><span><strong>AI đề xuất</strong> sử dụng thuật toán đối chiếu theo quy tắc, không phải mô hình nhận diện hình ảnh. Từ 50 điểm mới ghép tự động; mỗi đối thủ tối đa 3 sản phẩm.</span></div><div className="results-line"><strong>{rivals.length} sản phẩm đối thủ</strong><select aria-label="Lọc ghép cặp" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Tất cả trạng thái</option><option>AI đề xuất</option><option>Đã kiểm duyệt</option><option>Đã hủy</option></select></div>{!rivals.length?<Empty/>:rivals.filter(p=>!filter||data.matches.find(m=>m.id===p.id)?.status===filter).map(p=>{const match=data.matches.find(m=>m.id===p.id),ids=edits[p.id]??match?.ids??p.matching.map(m=>m.id);return <section className="panel match-panel" key={p.id}><div className="match-source"><ProductImage p={p}/><div><Badge tone="violet">{p.brand}</Badge><button className="product-title" onClick={()=>setDetail(p.id)}>{p.name}</button><p>{p.code} · {p.capacity||'Chưa rõ dung tích'} · {p.power||'Chưa rõ công suất'}</p><Badge tone={match?.status==='Đã kiểm duyệt'?'green':'orange'}>{match?.status||'AI đề xuất'}</Badge>{match?.by&&<p className="small muted">{match.by} · {date(match.at)}</p>}</div></div><div className="match-results">{p.matching.length?p.matching.map(m=>{const q=local.find(q=>q.id===m.id);if(!q)return null;return <div className="match-candidate" key={q.id}><div><button className="table-product" onClick={()=>setDetail(q.id)}><strong>{q.name}</strong><small>{q.code} · {m.level}</small></button><p>{m.reason}</p><details><summary>Chi tiết điểm ghép</summary><div className="criteria">{m.criteria.map(c=><span key={c.label}>{c.label}<b>{c.points}/{c.max}</b></span>)}</div></details></div><div className="match-score">{m.score}<small>/100</small></div></div>}):<div className={'notice '+(p.gap==='confirmed'?'opportunity-notice':'')}><AlertTriangle size={19}/>{p.gap==='confirmed'?'LOCK&KING HIỆN CHƯA CÓ SẢN PHẨM TƯƠNG ĐƯƠNG.':'Dữ liệu danh mục chưa đầy đủ nên chưa thể xác định sản phẩm tương đương.'}</div>}<div className="manual-match"><label>Chọn hoặc thay đổi sản phẩm tương đương (tối đa 3)</label><div className="match-checkboxes">{local.map(q=><label key={q.id}><input type="checkbox" checked={ids.includes(q.id)} disabled={!can||(!ids.includes(q.id)&&ids.length>=3)} onChange={()=>setEdits({...edits,[p.id]:ids.includes(q.id)?ids.filter(id=>id!==q.id):[...ids,q.id]})}/>{q.code} · {q.name}</label>)}</div>{can&&<div className="inline-actions"><button className="primary" disabled={!ids.length} onClick={()=>action('/matches/'+p.id,{ids})}><Check size={16}/>Xác nhận ghép cặp</button><button onClick={async()=>{if(confirm('Hủy toàn bộ ghép cặp của '+p.code+'?'))if(await action('/matches/'+p.id,{ids:[]}))setEdits({...edits,[p.id]:[]})}}>Hủy ghép cặp</button></div>}</div></div></section>})}</>}

const compareGroups={basic:['brand','code','purpose'],specs:['material','capacity','dimensions','mass','power','technology','features','accessories','warranty'],prices:['cost',...D.catalogPriceKeys,'online'],market:['rating','popularity','advantages','limitations']};
function Comparison(c){const{products,selected,toggle,user,setDetail,setSelected,notify}=c;const[show,setShow]=useState({basic:true,specs:true,prices:true,market:true,computed:true}),[search,setSearch]=useState('');const chosen=selected.map(id=>products.find(p=>p.id===id)).filter(Boolean).sort((a,b)=>Number(D.own(b))-Number(D.own(a)));function tone(key,p){const val=p[key],base=chosen[0];if(!D.has(val))return 'cell-missing';if(!D.has(base?.[key]))return 'cell-equal';if(!D.own(base))return 'cell-equal';const direction=['online','npp','nppOnline','facebookPrice','marketplacePrice'].includes(key)?-1:['warranty','rating'].includes(key)?1:0;if(!direction||p.id===base.id)return 'cell-equal';if(Number(base[key])===Number(val))return 'cell-equal';return (Number(base[key])-Number(val))*direction>0?'cell-good':'cell-bad'}return <><section className="panel"><div className="panel-head"><div><h2>Chọn từ 2 đến 5 sản phẩm</h2><p>Lock&King được đặt trước. Dung tích và công suất chỉ đối chiếu, không mặc định lớn hơn là tốt hơn.</p></div><Badge tone="blue">{chosen.length}/5 đã chọn</Badge></div><div className="comparison-picker"><div className="search-field"><Search size={18}/><input aria-label="Tìm sản phẩm so sánh" placeholder="Tìm sản phẩm để thêm vào bảng…" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="picker-items">{products.filter(p=>D.norm(p.name+' '+p.code).includes(D.norm(search))).map(p=><button key={p.id} className={selected.includes(p.id)?'picked':''} onClick={()=>toggle(p.id)}>{selected.includes(p.id)?<Check size={15}/>:<Plus size={15}/>} {p.code} · {p.name}</button>)}</div></div></section>{chosen.length<2?<Empty title="Chọn thêm sản phẩm để so sánh" text="Bảng sẽ hiển thị khi có ít nhất 2 sản phẩm."/>:<><div className="compare-tools"><div className="inline-actions">{Object.keys(show).map(g=><label key={g}><input type="checkbox" checked={show[g]} onChange={()=>setShow({...show,[g]:!show[g]})}/>{D.groups[g]||'Kết quả tính toán'}</label>)}</div><div className="inline-actions"><a className="button" href={'/api/report.xlsx?ids='+selected.join(',')}><Download size={16}/>Excel</a><button onClick={()=>window.print()}><Printer size={16}/>In / PDF</button></div></div>{chosen.length>=2&&<div className="ai-copilot-card"><div className="ai-copilot-head"><h4><Sparkles size={18}/> Trợ lý AI Đàm phán Đối đầu 1-1</h4><button className="primary" onClick={()=>{const lk=chosen.find(D.own)||chosen[0];const rivals=chosen.filter(p=>p.id!==lk.id);const script=generateAiSalesPitch(lk,rivals,user);navigator.clipboard.writeText(script).then(()=>notify?.('Đã sao chép kịch bản đàm phán đối đầu AI!')).catch(()=>notify?.('Không thể sao chép tự động'))}}><Sparkles size={15}/> Sao chép Kịch bản Đàm phán AI</button></div><p className="small" style={{margin:'4px 0 0',color:'#15803d'}}>Tổng hợp tự động điểm mạnh USP của <strong>{chosen[0].code}</strong> so với <strong>{chosen.slice(1).map(p=>p.brand+' '+p.code).join(', ')}</strong> phục vụ Sales đàm phán với đại lý.</p></div>}<div className="comparison-legend"><Badge tone="green">Xanh: Lock&King có lợi thế</Badge><Badge tone="red">Đỏ: Lock&King bất lợi</Badge><Badge tone="orange">Vàng: tương đương / xem xét</Badge><Badge>Xám: thiếu dữ liệu</Badge></div><div className="panel comparison-scroll"><table className="comparison-table"><thead><tr><th>Tiêu chí so sánh</th>{chosen.map(p=><th key={p.id} className={D.own(p)?'own-column':''}><ProductImage p={p}/><button className="product-title" onClick={()=>setDetail(p.id)}>{p.name}</button><Badge tone={D.own(p)?'blue':''}>{p.brand}</Badge></th>)}</tr></thead><tbody>{show.prices&&<><tr className="group-row"><th colSpan={chosen.length+1}>Đối chiếu giá cùng loại</th></tr>{comparisonPriceGroups.filter(g=>chosen.some(p=>comparisonPrices(p,g).length)).map(g=><tr key={g.key}><th>{g.label}</th>{chosen.map(p=><td key={p.id} className={comparisonPrices(p,g).length?'cell-equal':'cell-missing'}>{comparisonPrices(p,g).length?comparisonPrices(p,g).map(v=><div key={v.key}><strong>{money(v.value)}</strong><br/><small>{v.label}</small></div>):'Chưa có giá loại này'}</td>)}</tr>)}</>}{Object.entries(compareGroups).filter(([g])=>show[g]).map(([g,keys])=>React.createElement(React.Fragment,{key:g},<tr className="group-row"><th colSpan={chosen.length+1}>{D.groups[g]}</th></tr>,(g==='prices'?populatedPriceFields(chosen).map(f=>f.key):keys).filter(k=>D.canFinance(user.role)||!D.privateKeys.includes(k)).map(key=><tr key={key}><th>{D.labels[key]}</th>{chosen.map(p=><td className={tone(key,p)} key={p.id}>{D.fields.find(f=>f.key===key)?.type==='money'?money(p[key]):p[key]??'Chưa có dữ liệu'}</td>)}</tr>)))}</tbody>{show.computed&&<><tr className="group-row"><th colSpan={chosen.length+1}>Kết quả tính toán</th></tr><tr><th>Chênh lệch giá online<br/><small>Lock&King − đối thủ</small></th>{chosen.map((p,i)=><td key={p.id}>{i===0?'Mốc so sánh':D.own(chosen[0])&&p.online>0&&D.has(chosen[0].online)?<>{money(chosen[0].online-p.online)}<br/><small>{num((chosen[0].online-p.online)/p.online*100)}%</small></>:'Chưa đủ dữ liệu'}</td>)}</tr>{D.canFinance(user.role)&&[['fees','Chi phí bán hàng / sp'],['net','Lợi nhuận ròng / sp'],['breakEven','Giá hòa vốn']].map(([key,label])=><tr key={key}><th>{label}</th>{chosen.map(p=><td key={p.id}>{money(p.financial?.[key])}</td>)}</tr>)}<tr><th>Điểm cạnh tranh</th>{chosen.map(p=><td key={p.id}><Score score={p.score}/></td>)}</tr></>}</table></div><p className="small muted">Nguồn: {chosen.map(p=>p.source||'Chưa có nguồn').filter((v,i,a)=>a.indexOf(v)===i).join('; ')} · Người lập: {user.name} · {date(new Date())}</p><div className="print-only">Phê duyệt Ban lãnh đạo: ........................................</div></>}</>}

function FinanceView({products,user,action}){const[id,setId]=useState(products.find(D.own)?.id||''),[values,setValues]=useState({}),[target,setTarget]=useState(20);const p=products.find(p=>p.id===id);useEffect(()=>setValues({...p}),[id,products]);const f=D.finance(values,Number(target));const inputs=['cost','sale','platform','tax','ads','shipping','warrantyCost','gift','other','discount','returns','returnCost','quantity'];const scenarios=[['Thận trọng',.95,.7,1.2,1.3],['Cơ sở',1,1,1,1],['Tăng trưởng',1.03,1.3,.9,.8]];return !products.length?<Empty/>:<><section className="panel finance-selector"><label>Sản phẩm tính toán<select value={id} onChange={e=>setId(e.target.value)}><option value="">Chọn sản phẩm</option>{products.map(p=><option value={p.id} key={p.id}>{p.code} · {p.name}</option>)}</select></label><Badge tone="blue">Kịch bản chưa lưu cho đến khi xác nhận</Badge></section>{p&&<><div className="finance-layout"><section className="panel"><div className="panel-head"><h2>Giả định kinh doanh</h2><SlidersHorizontal size={20}/></div><div className="form-grid padded">{inputs.map(k=><label key={k}>{D.labels[k]}<input type="number" min="0" step="any" value={values[k]??''} onChange={e=>setValues({...values,[k]:e.target.value===''?null:Number(e.target.value)})}/></label>)}<label>Biên lợi nhuận ròng mục tiêu (%)<input type="number" min="0" max="99" value={target} onChange={e=>setTarget(e.target.value)}/></label></div><div className="panel-bottom"><span>Chi phí cố định: đồng trên một sản phẩm bán thành công.</span><button className="primary" onClick={()=>{if(confirm('Lưu các giả định giá và chi phí vào sản phẩm?'))action('/products/'+p.id,Object.fromEntries(inputs.filter(k=>D.editable(user.role,k)).map(k=>[k,values[k]])),'PUT')}}>Lưu giả định</button></div></section><section className="panel finance-result"><div className="panel-head"><h2>Kết quả dự kiến</h2><Wallet size={22}/></div>{f.missing?.length?<div className="padded"><div className="notice"><Info size={18}/><div>Chưa đủ dữ liệu. Cần bổ sung: {f.missing.map(k=>D.labels[k]).join(', ')}.</div></div><p className="muted">Nếu không phát sinh một khoản chi phí, hãy xác nhận bằng số 0.</p></div>:f.error?<div className="notice error">{f.error}</div>:<><div className="main-profit"><span>Lợi nhuận ròng / sản phẩm</span><strong className={f.net>=0?'good-text':'bad-text'}>{money(f.net)}</strong><Badge tone={f.net>=0?'green':'red'}>Biên ròng {num(f.netMargin)}%</Badge></div><dl className="finance-metrics">{[['Giá thực nhận sau chiết khấu',money(f.price)],['Lợi nhuận gộp',money(f.gross)],['Biên lợi nhuận gộp',num(f.margin)+'%'],['Tỷ suất lợi nhuận trên vốn',D.has(f.roi)?num(f.roi)+'%':'Không xác định (giá nhập bằng 0)'],['Tổng chi phí bán hàng / sp',money(f.fees)],['Giá hòa vốn',money(f.breakEven)],['Giá bán mục tiêu (sau chiết khấu)',money(f.targetPrice)],['Số bán thành công dự kiến',num(f.delivered)],['Doanh thu dự kiến',money(f.revenue)],['Tổng chi phí và giá vốn',money(f.totalCost)],['Tổng lợi nhuận ròng',money(f.totalProfit)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{f.targetPrice===null&&<p className="notice">Biên mục tiêu cộng tỷ lệ phí phải nhỏ hơn 100%.</p>}</>}</section></div><section className="panel"><div className="panel-head"><div><h2>Ba kịch bản kinh doanh</h2><p>Giả định tham khảo, không phải dự báo thị trường. Tính lại ngay từ dữ liệu phía trên.</p></div><ChartNoAxesCombined size={22}/></div><div className="scenario-grid">{scenarios.map(([name,priceFactor,quantityFactor,adsFactor,returnFactor])=>{const v={...values,sale:D.has(values.sale)?values.sale*priceFactor:null,quantity:D.has(values.quantity)?Math.round(values.quantity*quantityFactor):null,ads:D.has(values.ads)?values.ads*adsFactor:null,returns:D.has(values.returns)?Math.min(99,values.returns*returnFactor):null};const r=D.finance(v,target);return <div className={'scenario '+(name==='Cơ sở'?'base':'')} key={name}><Badge tone={name==='Cơ sở'?'blue':''}>{name}</Badge><h3>{money(r.totalProfit)}</h3><span>Lợi nhuận ròng toàn kỳ</span><dl><div><dt>Giá bán</dt><dd>{num(priceFactor*100)}% cơ sở</dd></div><div><dt>Số lượng</dt><dd>{num(quantityFactor*100)}% cơ sở</dd></div><div><dt>Quảng cáo</dt><dd>{num(adsFactor*100)}% cơ sở</dd></div><div><dt>Hoàn hàng</dt><dd>{num(v.returns)}%</dd></div><div><dt>Doanh thu</dt><dd>{money(r.revenue)}</dd></div></dl></div>})}</div></section><details className="panel formula-note"><summary>Công thức và cách xử lý hoàn hàng</summary><p>Giá thực nhận = Giá bán × (1 − chiết khấu). Lợi nhuận gộp = Giá thực nhận − Giá nhập.</p><p>Chi phí hoàn phân bổ = Chi phí mỗi đơn hoàn × Tỷ lệ hoàn / (1 − Tỷ lệ hoàn). Chi phí cố định gồm quảng cáo, vận chuyển, bảo hành, quà tặng, chi phí khác và chi phí hoàn phân bổ.</p><p>Lợi nhuận ròng = Giá thực nhận − Giá nhập − Chi phí cố định − Giá thực nhận × (Phí sàn + Thuế). Giá hòa vốn = (Giá nhập + Chi phí cố định) / (1 − Phí sàn − Thuế).</p><p>Giá mục tiêu = (Giá nhập + Chi phí cố định) / (1 − Phí sàn − Thuế − Biên ròng mục tiêu). Số bán thành công = Số lượng dự kiến × (1 − Tỷ lệ hoàn). Giả định hàng hoàn thu hồi được giá vốn; tổn thất hàng hoàn cần tính vào chi phí mỗi đơn hoàn.</p></details></>}</>}

function Scoring({products,data,user,action,setDetail}){const[weights,setWeights]=useState({...data.weights});useEffect(()=>setWeights({...data.weights}),[data.weights]);const total=Object.values(weights).reduce((s,n)=>s+Number(n),0);return <><section className="panel"><div className="panel-head"><div><h2>Trọng số cạnh tranh</h2><p>Điểm tổng = Σ (điểm tiêu chí / 100 × trọng số). Đánh giá định tính cần có nguồn và người cập nhật.</p></div><Badge tone={total===100?'green':'red'}>Tổng {total}/100</Badge></div><div className="weight-grid">{Object.entries(D.scoreLabels).map(([k,label])=><label key={k}>{label}<div><input type="number" min="0" max="100" value={weights[k]} disabled={!['admin','leader'].includes(user.role)} onChange={e=>setWeights({...weights,[k]:Number(e.target.value)})}/><span>điểm</span></div></label>)}</div>{['admin','leader'].includes(user.role)&&<div className="panel-bottom"><p>Thay đổi trọng số sẽ tính lại điểm của toàn bộ danh mục.</p><button className="primary" disabled={total!==100} onClick={()=>{if(confirm('Áp dụng trọng số mới cho toàn bộ danh mục?'))action('/weights',weights,'PUT')}}>Lưu trọng số</button></div>}</section><div className="notice"><Info size={18}/><span>Điểm giá: 50 + % lợi thế so với giá trung bình đối thủ tương đương, giới hạn 0–100. Điểm lợi nhuận: biên ròng 30% tương ứng 100 điểm. Các tiêu chí khác dùng đánh giá có nguồn. “Độ đầy đủ” là tỷ trọng tiêu chí có dữ liệu, không phải độ chính xác dự báo.</span></div><section className="panel table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Điểm cạnh tranh</th><th>Xếp loại</th><th>Độ đầy đủ</th><th>Dữ liệu cần bổ sung</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><button className="table-product" onClick={()=>setDetail(p.id)}><strong>{p.name}</strong><small>{p.code}</small></button></td><td><Score score={p.score}/></td><td>{p.score?.level}</td><td><div className="confidence"><span style={{width:(p.score?.confidence||0)+'%'}}/></div><small>{p.score?.confidence||0}%</small></td><td className="small">{p.score?.missing?.map(k=>D.scoreLabels[k]).join(', ')||'Đã có dữ liệu các tiêu chí'}</td></tr>)}</tbody></table>{!products.length&&<Empty/>}</section></>}

function MissingProductsView(c) {
  const { products, data, user, setDetail, setPage, setSelected, action, notify } = c;
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('byBrand');
  const [editing, setEditing] = useState(null);

  const allMissing = useMemo(() => D.getMissingProducts(products), [products]);

  const brandStats = useMemo(() => {
    const counts = {};
    for (const p of allMissing) {
      if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allMissing]);

  const categoryStats = useMemo(() => {
    const counts = {};
    for (const p of allMissing) {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allMissing]);

  const filtered = useMemo(() => {
    return allMissing.filter(p => {
      if (brandFilter && p.brand !== brandFilter) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (search) {
        const text = [p.name, p.code, p.brand, p.category, p.capacity, p.power, p.material, p.features].join(' ');
        if (!D.norm(text).includes(D.norm(search))) return false;
      }
      if (priceRange === 'under500' && (p.online || 0) >= 500000) return false;
      if (priceRange === '500to1000' && ((p.online || 0) < 500000 || (p.online || 0) > 1000000)) return false;
      if (priceRange === '1000to2000' && ((p.online || 0) < 1000000 || (p.online || 0) > 2000000)) return false;
      if (priceRange === 'over2000' && (p.online || 0) <= 2000000) return false;

      const opp = data.opportunities?.find(o => o.id === p.id);
      const currentStatus = opp?.status || 'Mới phát hiện';
      if (statusFilter && currentStatus !== statusFilter) return false;

      return true;
    });
  }, [allMissing, brandFilter, categoryFilter, search, priceRange, statusFilter, data.opportunities]);

  const canEdit = ['admin', 'leader', 'purchasing'].includes(user.role);

  async function handleQuickProposal(p) {
    if (!confirm(`Gửi sản phẩm ${p.brand} ${p.code} (${p.name}) vào danh sách đề xuất nhập hàng?`)) return;
    const ok = await action('/proposals/' + p.id, { status: 'Chờ phê duyệt' });
    if (ok) notify?.(`Đã gửi đề xuất nhập hàng cho ${p.code}!`);
  }

  async function saveOpportunity(e) {
    e.preventDefault();
    if (editing.status === 'Đã duyệt nhập' && !confirm('Phê duyệt nhập sản phẩm cơ hội này?')) return;
    const ok = await action('/opportunities/' + editing.productId, editing, 'PUT');
    if (ok) setEditing(null);
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    const allRows = [
      ['STT', 'Mã sản phẩm', 'Tên sản phẩm', 'Thương hiệu', 'Nhóm ngành hàng', 'Công suất', 'Dung tích / Kích thước', 'Chất liệu', 'Tính năng chính', 'Giá Online (đ)', 'Trạng thái R&D', 'Ghi chú'],
      ...filtered.map((p, i) => {
        const opp = data.opportunities?.find(o => o.id === p.id);
        return [
          i + 1,
          p.code || '',
          p.name || '',
          p.brand || '',
          p.category || '',
          p.power || '',
          p.capacity || p.dimensions || '',
          p.material || '',
          p.features || '',
          p.online || '',
          opp?.status || 'Mới phát hiện',
          opp?.notes || ''
        ];
      })
    ];
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 22 }, { wch: 30 }, { wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Tong-Hop-Chua-Co');

    const used = new Set(['Tong-Hop-Chua-Co']);
    const brandsInFiltered = [...new Set(filtered.map(p => p.brand))];
    for (const b of brandsInFiltered) {
      const bItems = filtered.filter(p => p.brand === b);
      const bSheet = XLSX.utils.aoa_to_sheet([
        ['STT', 'Mã sản phẩm', 'Tên sản phẩm', 'Nhóm ngành hàng', 'Công suất', 'Dung tích / Kích thước', 'Chất liệu', 'Giá Online (đ)', 'Trạng thái'],
        ...bItems.map((p, idx) => [
          idx + 1,
          p.code || '',
          p.name || '',
          p.category || '',
          p.power || '',
          p.capacity || p.dimensions || '',
          p.material || '',
          p.online || '',
          data.opportunities?.find(o => o.id === p.id)?.status || 'Mới phát hiện'
        ])
      ]);
      bSheet['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, bSheet, sheetName(b, used));
    }

    saveFile(
      XLSX.write(wb, { type: 'array', bookType: 'xlsx' }),
      'Vu-Gia-San-Pham-LockKing-Chua-Co.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    notify?.(`📥 Đã xuất Excel danh sách ${filtered.length} sản phẩm Lock&King chưa có!`);
  }

  function renderCard(p) {
    const opp = data.opportunities?.find(o => o.id === p.id);
    const hasProposal = (data.proposals || []).some(q => q.productId === p.id || q.id === p.id);
    return (
      <article className="missing-card" key={p.id}>
        <div className="missing-card-photo">
          <button onClick={() => setDetail(p.id)} aria-label={'Xem chi tiết ' + p.name}>
            <ProductImage p={p} />
          </button>
          <Badge tone="violet">{p.brand}</Badge>
        </div>
        <div className="missing-card-body">
          <div className="missing-card-meta">
            <span>{p.code}</span>
            <span>{p.category}</span>
          </div>
          <button className="missing-card-title" onClick={() => setDetail(p.id)}>
            {p.name}
          </button>
          <p className="missing-card-specs">
            {[p.capacity || p.dimensions, p.power, p.material].filter(Boolean).join(' · ') || 'Chưa có thông số chi tiết'}
          </p>
          <div className="missing-card-price">
            <small>Giá online tham khảo</small>
            <strong>{money(p.online)}</strong>
          </div>
          <div className="inline-actions" style={{ marginTop: 4 }}>
            <Badge tone={opp?.status === 'Đã duyệt nhập' ? 'green' : opp?.status ? 'orange' : ''}>
              {opp?.status || 'Mới phát hiện'}
            </Badge>
            {hasProposal && <Badge tone="blue">Đã gửi đề xuất</Badge>}
          </div>
          <div className="missing-card-actions">
            <button
              className="primary compact"
              onClick={() => {
                setSelected([p.id]);
                setPage('compare');
              }}
              title="Đưa vào bảng so sánh"
            >
              <ArrowLeftRight size={14} /> So sánh
            </button>
            <button
              className="proposal-highlight-btn compact"
              onClick={() => handleQuickProposal(p)}
              title="Đề xuất nhập hàng cho sản phẩm này"
            >
              <ShoppingBag size={14} /> Đề xuất
            </button>
            {canEdit && (
              <button
                className="compact"
                onClick={() => setEditing({
                  productId: p.id,
                  status: opp?.status || 'Mới phát hiện',
                  notes: opp?.notes || '',
                  targetCost: opp?.targetCost ?? '',
                  suggestedPrice: opp?.suggestedPrice ?? ''
                })}
                title="Cập nhật tiến độ nghiên cứu / R&D"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="missing-products-workspace">
      <div className="stats">
        <Stat
          label="Sản phẩm Lock&King chưa có"
          value={allMissing.length}
          icon={Sparkles}
          tone="green"
          note={`Tổng từ ${brandStats.length} thương hiệu trên thị trường`}
        />
        <Stat
          label="Thương hiệu đối thủ có SP thiếu"
          value={`${brandStats.length} hãng`}
          icon={Building2}
          tone="violet"
          note={brandStats.slice(0, 3).map(([b, c]) => `${b} (${c})`).join(', ')}
        />
        <Stat
          label="Nhóm ngành hàng còn khuyết"
          value={`${categoryStats.length} nhóm`}
          icon={Boxes}
          tone="orange"
          note={categoryStats.slice(0, 2).map(([c, n]) => `${c} (${n})`).join(', ')}
        />
        <Stat
          label="Đang nghiên cứu / Lấy mẫu"
          value={(data.opportunities || []).filter(p => ['Đang nghiên cứu', 'Đang lấy mẫu', 'Đã duyệt nhập'].includes(p.status)).length}
          icon={Search}
          note="Tiến độ R&D và Mua hàng"
        />
      </div>

      <div className="brand-filter-pills">
        <button
          className={'brand-pill ' + (brandFilter === '' ? 'active' : '')}
          onClick={() => setBrandFilter('')}
        >
          <span>Tất cả các hãng</span>
          <b>{allMissing.length}</b>
        </button>
        {brandStats.map(([brandName, count]) => (
          <button
            key={brandName}
            className={'brand-pill ' + (brandFilter === brandName ? 'active' : '')}
            onClick={() => setBrandFilter(brandFilter === brandName ? '' : brandName)}
          >
            <span>{brandName}</span>
            <b>{count}</b>
          </button>
        ))}
      </div>

      <div className="filter-panel">
        <div className="filter-row">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Tìm sản phẩm chưa có"
              placeholder="Tìm mã, tên sản phẩm, công suất, chất liệu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            aria-label="Lọc theo nhóm hàng"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">Tất cả nhóm ngành hàng ({categoryStats.length})</option>
            {categoryStats.map(([catName, count]) => (
              <option key={catName} value={catName}>{catName} ({count})</option>
            ))}
          </select>

          <select
            aria-label="Lọc theo phân khúc giá"
            value={priceRange}
            onChange={e => setPriceRange(e.target.value)}
          >
            <option value="">Tất cả phân khúc giá</option>
            <option value="under500">Dưới 500.000 đ</option>
            <option value="500to1000">500.000 đ – 1.000.000 đ</option>
            <option value="1000to2000">1.000.000 đ – 2.000.000 đ</option>
            <option value="over2000">Trên 2.000.000 đ</option>
          </select>

          <select
            aria-label="Lọc theo trạng thái R&D"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái R&D</option>
            {D.opportunityStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="view-toggle">
            <button
              className={viewMode === 'byBrand' ? 'active' : ''}
              onClick={() => setViewMode('byBrand')}
              title="Gom nhóm theo từng Thương hiệu"
            >
              <Building2 size={16} /> Theo Hãng
            </button>
            <button
              className={viewMode === 'byCategory' ? 'active' : ''}
              onClick={() => setViewMode('byCategory')}
              title="Gom nhóm theo Nhóm ngành hàng"
            >
              <Boxes size={16} /> Theo Ngành
            </button>
            <IconButton
              icon={LayoutDashboard}
              label="Dạng thẻ lưới"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'active' : ''}
            />
            <IconButton
              icon={FileSpreadsheet}
              label="Dạng bảng chi tiết"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'active' : ''}
            />
          </div>
        </div>
      </div>

      <div className="results-line">
        <span>
          Đang hiển thị <strong>{filtered.length}</strong> / {allMissing.length} sản phẩm Lock&King chưa có
          {brandFilter && <span> · Hãng: <strong>{brandFilter}</strong></span>}
          {categoryFilter && <span> · Nhóm: <strong>{categoryFilter}</strong></span>}
        </span>
        <div className="inline-actions">
          {(search || brandFilter || categoryFilter || priceRange || statusFilter) && (
            <button
              className="text-button"
              onClick={() => { setSearch(''); setBrandFilter(''); setCategoryFilter(''); setPriceRange(''); setStatusFilter(''); }}
            >
              Đặt lại bộ lọc
            </button>
          )}
          <button className="button" onClick={exportExcel}>
            <Download size={16} /> Xuất Excel ({filtered.length} SP)
          </button>
        </div>
      </div>

      {!filtered.length ? (
        <Empty
          title="Không tìm thấy sản phẩm phù hợp"
          text="Thử thay đổi từ khóa tìm kiếm hoặc bấm Đặt lại bộ lọc."
        />
      ) : viewMode === 'byBrand' ? (
        <div className="missing-brand-sections">
          {[...new Set(filtered.map(p => p.brand))].map(brandName => {
            const bItems = filtered.filter(p => p.brand === brandName);
            return (
              <section className="missing-group-box" key={brandName}>
                <div className="missing-group-head">
                  <div className="missing-group-title">
                    <span className="missing-brand-badge">{brandName.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <h3>{brandName}</h3>
                      <span className="small muted">Lock&King đang thiếu <strong>{bItems.length}</strong> sản phẩm so với hãng này</span>
                    </div>
                  </div>
                  <div className="inline-actions">
                    <button
                      className="button compact"
                      onClick={() => {
                        const wb = XLSX.utils.book_new();
                        const bRows = [
                          ['STT', 'Mã SP', 'Tên sản phẩm', 'Nhóm hàng', 'Công suất', 'Dung tích / Kích thước', 'Chất liệu', 'Giá Online', 'Trạng thái'],
                          ...bItems.map((p, idx) => [
                            idx + 1, p.code || '', p.name || '', p.category || '', p.power || '', p.capacity || p.dimensions || '', p.material || '', p.online || '',
                            data.opportunities?.find(o => o.id === p.id)?.status || 'Mới phát hiện'
                          ])
                        ];
                        const ws = XLSX.utils.aoa_to_sheet(bRows);
                        XLSX.utils.book_append_sheet(wb, ws, brandName);
                        saveFile(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), `Vu-Gia-LockKing-Thieu-So-Voi-${brandName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        notify?.(`Đã xuất danh sách sản phẩm thiếu so với ${brandName}`);
                      }}
                    >
                      <Download size={14} /> Xuất Excel hãng này
                    </button>
                  </div>
                </div>
                <div className="missing-group-body">
                  <div className="missing-grid">
                    {bItems.map(p => renderCard(p))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : viewMode === 'byCategory' ? (
        <div className="missing-category-sections">
          {[...new Set(filtered.map(p => p.category))].map(catName => {
            const cItems = filtered.filter(p => p.category === catName);
            return (
              <section className="missing-group-box" key={catName}>
                <div className="missing-group-head">
                  <div className="missing-group-title">
                    <Boxes size={22} className="text-blue" />
                    <div>
                      <h3>{catName || 'Chưa phân nhóm'}</h3>
                      <span className="small muted">Lock&King đang khuyết <strong>{cItems.length}</strong> sản phẩm thuộc nhóm này</span>
                    </div>
                  </div>
                </div>
                <div className="missing-group-body">
                  <div className="missing-grid">
                    {cItems.map(p => renderCard(p))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="missing-grid">
          {filtered.map(p => renderCard(p))}
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Sản phẩm & Mã</th>
                <th>Thương hiệu</th>
                <th>Nhóm ngành hàng</th>
                <th>Thông số kỹ thuật</th>
                <th>Giá online</th>
                <th>Trạng thái R&D</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const opp = data.opportunities?.find(o => o.id === p.id);
                return (
                  <tr key={p.id}>
                    <td style={{ width: 60 }}>
                      <button className="photo-button" style={{ width: 48, height: 48 }} onClick={() => setDetail(p.id)}>
                        <ProductImage p={p} />
                      </button>
                    </td>
                    <td>
                      <button className="table-product" onClick={() => setDetail(p.id)}>
                        <strong>{p.name}</strong>
                        <small>{p.code}</small>
                      </button>
                    </td>
                    <td><Badge tone="violet">{p.brand}</Badge></td>
                    <td>{p.category}</td>
                    <td>
                      <span className="small">
                        {[p.capacity || p.dimensions, p.power, p.material].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </td>
                    <td><strong>{money(p.online)}</strong></td>
                    <td>
                      <Badge tone={opp?.status === 'Đã duyệt nhập' ? 'green' : opp?.status ? 'orange' : ''}>
                        {opp?.status || 'Mới phát hiện'}
                      </Badge>
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button
                          className="compact primary"
                          onClick={() => {
                            setSelected([p.id]);
                            setPage('compare');
                          }}
                        >
                          So sánh
                        </button>
                        <button
                          className="compact proposal-highlight-btn"
                          onClick={() => handleQuickProposal(p)}
                        >
                          Đề xuất
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop">
          <form className="modal compact" onSubmit={saveOpportunity}>
            <div className="modal-head">
              <h2>Cập nhật tiến độ nghiên cứu & R&D</h2>
              <IconButton icon={X} label="Đóng" onClick={() => setEditing(null)} />
            </div>
            <div className="padded form-grid">
              <label className="span-2">
                Trạng thái cơ hội
                <select
                  value={editing.status}
                  onChange={e => setEditing({ ...editing, status: e.target.value })}
                >
                  {D.opportunityStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                Giá nhập mục tiêu (VND)
                <input
                  type="number"
                  min="0"
                  value={editing.targetCost}
                  onChange={e => setEditing({ ...editing, targetCost: e.target.value })}
                  placeholder="Ví dụ: 350000"
                />
              </label>
              <label>
                Giá bán đề xuất (VND)
                <input
                  type="number"
                  min="0"
                  value={editing.suggestedPrice}
                  onChange={e => setEditing({ ...editing, suggestedPrice: e.target.value })}
                  placeholder="Ví dụ: 650000"
                />
              </label>
              <label className="span-2">
                Ghi chú đánh giá, đối thủ cạnh tranh & nhà cung cấp
                <textarea
                  rows={4}
                  value={editing.notes}
                  onChange={e => setEditing({ ...editing, notes: e.target.value })}
                  placeholder="Ghi chú về thiết kế, ưu điểm vượt trội của đối thủ, thông tin xưởng sản xuất hoặc MOQ..."
                />
              </label>
            </div>
            <div className="modal-foot">
              <button type="button" onClick={() => setEditing(null)}>Hủy</button>
              <button className="primary">Lưu cập nhật</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
const Opportunities = MissingProductsView;

function Proposals({products,data,user,action,setDetail}){const[filter,setFilter]=useState('');const list=products.filter(D.own).filter(p=>!filter||(data.proposals.find(q=>q.id===p.id)?.status||'Chưa gửi')===filter);return <><div className="notice"><ShieldCheck size={19}/><span>Đề xuất chỉ kết luận khi đủ dữ liệu về điểm cạnh tranh, lợi nhuận, vòng quay vốn và rủi ro tồn kho. Ban lãnh đạo hoặc quản trị viên phê duyệt nhập hàng.</span></div><div className="results-line"><strong>{list.length} sản phẩm</strong><select aria-label="Trạng thái đề xuất" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Tất cả trạng thái</option><option>Chưa gửi</option><option>Chờ phê duyệt</option><option>Đã duyệt nhập</option><option>Từ chối</option></select></div><section className="panel table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Điểm</th><th>Đề xuất & căn cứ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.map(p=>{const proposal=data.proposals.find(q=>q.id===p.id);return <tr key={p.id}><td><button className="table-product" onClick={()=>setDetail(p.id)}><strong>{p.name}</strong><small>{p.code}</small></button></td><td><Score score={p.score}/></td><td className="recommendation-cell"><Badge tone={p.recommendation?.pending?'orange':'blue'}>{p.recommendation?.label||'Xem với quyền tài chính'}</Badge><p className="small muted">{p.recommendation?.reason||'Chi tiết giá vốn và đánh giá nhập hàng chỉ dành cho bộ phận có quyền.'}</p></td><td><Badge tone={proposal?.status==='Đã duyệt nhập'?'green':''}>{proposal?.status||'Chưa gửi'}</Badge>{proposal&&<p className="small muted">{proposal.by}<br/>{date(proposal.at)}</p>}</td><td><div className="stack-actions">{['admin','leader','sales','purchasing'].includes(user.role)&&<button onClick={()=>action('/proposals/'+p.id,{status:'Chờ phê duyệt'})}>Gửi đề xuất</button>}{['leader','admin'].includes(user.role)&&<><button className="primary" disabled={p.recommendation?.pending} onClick={()=>{if(confirm('Phê duyệt nhập '+p.code+'?'))action('/proposals/'+p.id,{status:'Đã duyệt nhập'})}}>Duyệt nhập</button><button onClick={()=>{const notes=prompt('Lý do từ chối đề xuất:');if(notes!==null)action('/proposals/'+p.id,{status:'Từ chối',notes})}}>Từ chối</button></>}</div></td></tr>})}</tbody></table>{!list.length&&<Empty/>}</section></>}

function Reports({products,user,data}){const[kind,setKind]=useState('comparison'),[category,setCategory]=useState(''),[conclusion,setConclusion]=useState('Đánh giá theo dữ liệu và trọng số tại thời điểm lập báo cáo.'),[suggestion,setSuggestion]=useState('Bổ sung dữ liệu còn thiếu và xác minh nguồn trước khi quyết định nhập hàng.');const kinds={comparison:'So sánh sản phẩm',category:'Danh mục theo nhóm sản phẩm',prices:'Giá Lock&King và đối thủ',profit:'Lợi nhuận dự kiến',score:'Điểm cạnh tranh',opportunities:'Cơ hội sản phẩm mới',proposals:'Đề xuất nhập hàng',missing:'Dữ liệu còn thiếu',history:'Lịch sử thay đổi giá'};let list=products.filter(p=>!category||p.category===category);if(kind==='opportunities')list=list.filter(p=>p.gap);if(kind==='proposals')list=list.filter(p=>data.proposals.some(q=>q.id===p.id));if(kind==='missing')list=list.filter(p=>p.score?.missing?.length||p.dataMissing?.length);const ids=list.map(p=>p.id).join(',');return <><section className="panel report-controls"><div className="form-grid"><label>Loại báo cáo<select value={kind} onChange={e=>setKind(e.target.value)}>{Object.entries(kinds).filter(([k])=>k!=='profit'||D.canFinance(user.role)).map(([k,l])=><option value={k} key={k}>{l}</option>)}</select></label><label>Nhóm sản phẩm<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Toàn bộ nhóm hàng</option>{[...new Set(products.map(p=>p.category))].map(v=><option key={v}>{v}</option>)}</select></label><label>Kết luận<textarea value={conclusion} onChange={e=>setConclusion(e.target.value)}/></label><label>Đề xuất hành động<textarea value={suggestion} onChange={e=>setSuggestion(e.target.value)}/></label></div><div className="inline-actions"><a className="button" href={'/api/report.xlsx?ids='+(ids||'none')+'&kind='+kind+'&conclusion='+encodeURIComponent(conclusion)+'&suggestion='+encodeURIComponent(suggestion)}><FileSpreadsheet size={17}/>Xuất Excel</a><button className="primary" onClick={()=>window.print()}><Printer size={17}/>In / Lưu PDF</button></div><p className="small muted">Để lưu PDF, chọn “Lưu dưới dạng PDF” trong cửa sổ in của trình duyệt. Báo cáo giữ nguyên tiếng Việt.</p></section><section className="report-document"><div className="report-heading"><div className="brand"><div className="logo-mark">V</div><div><strong>VŨ GIA</strong><span>SO SÁNH SẢN PHẨM · V2</span></div></div><div><small>Ngày lập: {date(new Date())}</small><small>Người lập: {user.name}</small></div></div><h2>BÁO CÁO {kinds[kind].toLocaleUpperCase('vi-VN')}</h2><p>Phạm vi: {category||'Toàn bộ nhóm hàng'} · {list.length} sản phẩm</p><div className="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Thương hiệu</th>{kind==='history'?<><th>Thời gian / người sửa</th><th>Thay đổi</th></>:<><th>Giá online</th><th>{kind==='profit'?'Lợi nhuận ròng':kind==='opportunities'?'Phân loại':'Điểm cạnh tranh'}</th><th>Nhận định / Dữ liệu thiếu</th></>}</tr></thead><tbody>{kind==='history'?list.flatMap(p=>(p.priceHistory||[]).map((h,i)=><tr key={p.id+i}><td>{p.code}</td><td>{p.brand}</td><td>{date(h.at)} · {h.by}</td><td>{h.changes.map(c=>`${D.labels[c.field]}: ${c.before??'—'} → ${c.after??'—'}`).join('; ')}</td></tr>)):list.map(p=><tr key={p.id}><td><strong>{p.name}</strong><br/><small>{p.code}</small></td><td>{p.brand}</td><td>{money(p.online)}</td><td>{kind==='profit'?money(p.financial?.net):kind==='opportunities'?(p.gap==='confirmed'?'Chưa có tương đương':'Chưa đủ dữ liệu'):p.score?.score??'Chưa đủ dữ liệu'}</td><td>{kind==='proposals'?data.proposals.find(q=>q.id===p.id)?.status:kind==='missing'?[...(p.dataMissing||[]).map(k=>D.labels[k]),...(p.score?.missing||[]).map(k=>D.scoreLabels[k])].join(', '):p.recommendation?.reason||p.score?.level}</td></tr>)}</tbody></table></div><h3>Nguồn dữ liệu</h3><p>{[...new Set(list.map(p=>p.source||'Chưa có nguồn xác minh'))].join('; ')||'Chưa có dữ liệu'}</p><h3>Kết luận</h3><p>{conclusion}</p><h3>Đề xuất hành động</h3><p>{suggestion}</p><div className="signatures"><div>NGƯỜI LẬP BÁO CÁO<br/><br/><strong>{user.name}</strong></div><div>PHÊ DUYỆT BAN LÃNH ĐẠO<br/><small>(Ký, ghi rõ họ tên)</small><br/><br/>........................................</div></div></section></>}

function Admin({user,notify,action,data}){const[tab,setTab]=useState('users'),[users,setUsers]=useState([]),[audit,setAudit]=useState([]),[form,setForm]=useState(null);async function refresh(){try{if(user.role==='admin')setUsers(await api('/users'));setAudit(await api('/audit'));}catch(e){notify(e.message)}}useEffect(()=>{refresh()},[]);async function autoEnrichAllProducts(){if(!confirm('Tự động bóc tách và làm giàu thông số kỹ thuật (công suất, dung tích, chất liệu, tính năng, bảo hành...) cho toàn bộ sản phẩm theo cơ sở dữ liệu Web?'))return;const ok=await action('/enrich-all',{});if(ok)notify('🎉 Đã cập nhật chính xác thông số kỹ thuật từ Web cho toàn bộ sản phẩm!');}return <><div className="tabs admin-tabs">{user.role==='admin'&&<button className={tab==='users'?'active':''} onClick={()=>setTab('users')}>Tài khoản & phân quyền</button>}<button className={tab==='audit'?'active':''} onClick={()=>setTab('audit')}>Nhật ký hoạt động</button><button className={tab==='rules'?'active':''} onClick={()=>setTab('rules')}>Quyền theo bộ phận</button></div>{tab==='users'&&user.role==='admin'&&<><section className="panel padded attention" style={{marginBottom:20}}><div className="panel-head"><div><h2>🤖 Tự động Làm giàu Thông số Kỹ thuật từ Web</h2><p>Tự động tìm kiếm & điền đầy đủ công suất, dung tích, chất liệu, công nghệ, tính năng, bảo hành cho 100% sản phẩm trong danh mục.</p></div><button className="primary" onClick={autoEnrichAllProducts}><Sparkles size={16}/> Cập nhật 100% Thông số từ Web</button></div></section><section className="panel"><div className="panel-head"><h2>Tài khoản hệ thống</h2><button className="primary" onClick={()=>setForm({name:'',email:'',password:'',role:'sales',active:true})}><Plus size={16}/>Thêm tài khoản</button></div><div className="table-wrap"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{D.roles[u.role]}</td><td><Badge tone={u.active?'green':'red'}>{u.active?'Hoạt động':'Đã khóa'}</Badge></td><td><button onClick={()=>setForm({...u,password:''})}>Chỉnh sửa</button></td></tr>)}</tbody></table></div></section></>}{(tab==='audit'||user.role==='leader'&&tab==='users')&&<section className="panel"><div className="panel-head"><h2>Nhật ký hoạt động</h2><button onClick={refresh}><RefreshCw size={16}/>Làm mới</button></div><div className="table-wrap"><table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>{audit.map(a=><tr key={a.id}><td>{date(a.at)}</td><td>{a.user}</td><td>{a.action}</td><td>{a.subject}</td><td><details><summary>Trước / sau</summary><pre>{JSON.stringify({truoc:a.before,sau:a.after},null,2)}</pre></details></td></tr>)}</tbody></table></div></section>}{tab==='rules'&&<section className="panel table-wrap"><table><thead><tr><th>Bộ phận</th><th>Quyền chính</th></tr></thead><tbody>{[['Ban lãnh đạo','Xem toàn bộ, giá nhập, trọng số, phê duyệt đề xuất.'],['Phòng Kinh doanh','Xem danh mục và giá bán, cập nhật giá thị trường, ghép cặp, so sánh và báo cáo. Không xem giá nhập.'],['Phòng Marketing','Cập nhật hình ảnh, nội dung và liên kết; xem danh mục và tạo nội dung tư vấn. Không xem giá nhập.'],['Bộ phận Mua hàng','Cập nhật nhà cung cấp, giá nhập, MOQ, giao hàng, lấy mẫu; theo dõi cơ hội và gửi đề xuất.'],['Quản trị viên','Quản lý toàn bộ dữ liệu, tài khoản, danh mục và nhật ký.']].map(([a,b])=><tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table></section>}{form&&<div className="modal-backdrop"><form className="modal compact" onSubmit={async e=>{e.preventDefault();if(await action('/users',form)){setForm(null);refresh()}}}><div className="modal-head"><h2>{form.id?'Chỉnh sửa tài khoản':'Tạo tài khoản'}</h2><IconButton icon={X} label="Đóng" onClick={()=>setForm(null)}/></div><div className="form-grid padded"><label className="span-2">Họ tên<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="span-2">Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label className="span-2">{form.id?'Mật khẩu mới (để trống để giữ nguyên)':'Mật khẩu'}<input type="password" minLength={10} required={!form.id} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><label>Vai trò<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{Object.entries(D.roles).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label><label>Trạng thái<select value={String(form.active)} onChange={e=>setForm({...form,active:e.target.value==='true'})}><option value="true">Hoạt động</option><option value="false">Đã khóa</option></select></label></div><div className="modal-foot"><button type="button" onClick={()=>setForm(null)}>Hủy</button><button className="primary">Lưu tài khoản</button></div></form></div>}</>}

createRoot(document.getElementById('root')).render(<App/>);

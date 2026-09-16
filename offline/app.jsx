// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import {
  Building2, LayoutDashboard, Package, Boxes, Upload, GitCompareArrows,
  ArrowLeftRight, ChartNoAxesCombined, Sparkles, ShoppingBag, FileDown,
  Users, Settings, Search, Plus, ChevronRight, ChevronDown, ArrowUpRight,
  ArrowDownRight, LogOut, Bell, Check, CheckCircle2, X, Menu, Maximize2,
  Download, Filter, SlidersHorizontal, ImageOff, Pencil, Trash2, Bookmark,
  ShieldCheck, Info, History, FileSpreadsheet, Eye, Link as LinkIcon,
  AlertTriangle, RefreshCw, Printer, LockKeyhole, TrendingUp, Target,
  Wallet, BarChart3
} from 'lucide-react';
import * as D from '../shared/domain.js';
import { brandKey, listBrands, sheetName, initialBrands } from '../shared/brands.js';
import { comparisonPriceGroups, comparisonPrices, populatedPriceFields } from '../shared/price-comparison.js';

import '../src/styles.css';
import '../src/readability.css';
import '../src/brands.css';

const clone = v => JSON.parse(JSON.stringify(v));
const uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
const money = v => D.has(v) ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v) : 'Chưa có dữ liệu';
const num = v => D.has(v) ? Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '—';
const date = v => v ? new Date(v).toLocaleString('vi-VN') : '—';

const IconButton = ({ icon: Icon, label, onClick, ...props }) => (
  <button className="icon-button" aria-label={label} title={label} onClick={onClick} {...props}>
    <Icon size={18} />
  </button>
);
function Badge({ children, tone = '' }) {
  return <span className={'badge ' + tone}>{children}</span>;
}
function Empty({ title = 'Chưa có dữ liệu', text = 'Thêm sản phẩm hoặc nhập file Excel để bắt đầu.', children = null }) {
  return (
    <div className="empty">
      <Package size={36} />
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
function Score({ score }) {
  return score?.score == null ? (
    <span className="muted small">Chưa đủ dữ liệu</span>
  ) : (
    <span className={'score ' + (score.score >= 70 ? 'good' : score.score >= 50 ? 'warn' : 'bad')}>
      {score.score}<small>/100</small>
    </span>
  );
}

const imageURL = (src, images = {}) => {
  if (!src) return '';
  if (images[src]) return images[src];
  if (/^(https?:|data:image\/(png|jpeg|webp|gif);base64,)/i.test(src)) return src;
  if (src.startsWith('/api/assets/')) {
    return './data/assets/' + src.slice('/api/assets/'.length);
  }
  return src;
};

function ProductImage({ p, large = false, images = {} }) {
  const [broken, setBroken] = useState(false);
  const src = imageURL(p.image, images);
  useEffect(() => setBroken(false), [p.image]);
  return (
    <div className={'product-image ' + (large ? 'large' : '')}>
      {src && !broken ? (
        <img src={src} alt={p.name} onError={() => setBroken(true)} />
      ) : (
        <div className="no-image">
          <Package size={large ? 52 : 34} />
          <span>{p.demo ? 'SẢN PHẨM MINH HỌA' : 'Chưa có ảnh'}</span>
        </div>
      )}
      {D.own(p) && <span className="brand-mark">Lock<span>&</span>King</span>}
    </div>
  );
}

const readFile = f => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(Error('Không đọc được tệp'));
  r.readAsDataURL(f);
});

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

// Storage helpers (IndexedDB)
let database;
async function storage() {
  return database || (database = await new Promise((resolve, reject) => {
    const r = indexedDB.open('vugia-offline-v1', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('data');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(Error('Đóng tab Vũ Gia khác rồi mở lại'));
  }));
}
async function readStorage() {
  const db = await storage();
  return new Promise((resolve, reject) => {
    const r = db.transaction('data').objectStore('data').get('state');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function writeStorage(state) {
  const db = await storage();
  return new Promise((resolve, reject) => {
    const t = db.transaction('data', 'readwrite');
    t.objectStore('data').put(state, 'state');
    t.oncomplete = resolve;
    t.onabort = t.onerror = () => reject(t.error || Error('Không lưu được dữ liệu'));
  });
}

function computeProduct(p, products, weights, matches) {
  const q = { ...p };
  q.suggestions = D.own(p) ? [] : D.candidates(p, products);
  const reviewed = matches?.find(m => m.id === p.id);
  q.matching = reviewed && reviewed.status !== 'AI đề xuất'
    ? reviewed.ids.map(id => {
      const target = products.find(t => t.id === id);
      return target ? { id, ...D.similarity(p, target) } : null;
    }).filter(Boolean)
    : q.suggestions;
  q.gap = D.own(p) ? null : D.gap(p, products);
  q.dataMissing = D.matchingRequired.filter(k => !D.has(p[k]));
  if (!D.has(p.capacity) && !D.has(p.dimensions)) q.dataMissing.push('capacity');
  q.score = D.competition(p, products, weights);
  q.financial = D.finance(p);
  q.recommendation = D.recommendation(p, products, weights);
  return q;
}

const pages = [
  ['dashboard', 'Tổng quan', LayoutDashboard],
  ['brands', 'Danh mục theo hãng', Building2],
  ['own', 'Sản phẩm Lock&King', Package],
  ['rivals', 'Sản phẩm đối thủ', Boxes],
  ['import', 'Nhập dữ liệu Excel', Upload],
  ['matching', 'Ghép cặp sản phẩm', GitCompareArrows],
  ['compare', 'So sánh sản phẩm', ArrowLeftRight],
  ['finance', 'Giá & lợi nhuận', ChartNoAxesCombined],
  ['scoring', 'Điểm cạnh tranh', Target],
  ['opportunities', 'Cơ hội sản phẩm mới', Sparkles],
  ['proposals', 'Đề xuất nhập hàng', ShoppingBag],
  ['reports', 'Báo cáo & xuất dữ liệu', FileDown],
  ['admin', 'Quản trị & Sao lưu', Settings]
];

export default function App({ loaded, storageError }) {
  const [state, setState] = useState(loaded);
  const [user, setUser] = useState({ id: 'admin', name: 'Ban lãnh đạo', email: 'admin@vugia.vn', role: 'admin', active: true });
  const [page, setPage] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState(storageError || '');
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);
  const [sidebar, setSidebar] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  function notify(msg) {
    setToast(msg);
  }

  async function commit(nextState, msg = 'Đã lưu thành công') {
    setBusy(true);
    try {
      await writeStorage(nextState);
      setState(nextState);
      if (msg) notify(msg);
      return true;
    } catch (e) {
      notify('Chưa lưu được: ' + e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const weights = state.weights || D.defaultWeights;
  const matches = state.matches || [];
  const opportunities = state.opportunities || [];
  const proposals = state.proposals || [];
  const follows = state.follows || [];
  const imports = state.imports || [];
  const images = state.images || {};

  // Compute enriched products
  const products = useMemo(() => {
    return state.products.map(p => computeProduct(p, state.products, weights, matches));
  }, [state.products, weights, matches]);

  const brands = useMemo(() => listBrands(state.brands || [], state.products || []), [state.brands, state.products]);

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 5
          ? [...prev, id]
          : (notify('Chọn tối đa 5 sản phẩm'), prev)
    );
  }

  function navigate(p) {
    setPage(p);
    setSidebar(false);
    setQuery('');
  }

  const ctx = {
    user,
    setUser,
    data: { products, matches, weights, opportunities, proposals, follows, imports, brands, images },
    products,
    brands,
    images,
    state,
    notify,
    commit,
    setDetail,
    setEditing,
    selected,
    setSelected,
    toggle,
    setPage: navigate,
    query
  };

  const current = pages.find(p => p[0] === page);
  const activeDetail = products.find(p => p.id === detail);
  const permitted = pages.filter(([id]) => id !== 'admin' || ['admin', 'leader'].includes(user.role))
    .filter(([id]) => id !== 'import' || ['admin', 'leader'].includes(user.role))
    .filter(([id]) => id !== 'finance' || D.canFinance(user.role));

  const pendingMatchesCount = matches.filter(m => m.status === 'AI đề xuất' && m.ids?.length).length;

  return (
    <div className="app">
      <aside className={'sidebar ' + (sidebar ? 'open' : '')}>
        <div className="brand">
          <div className="logo-mark">V</div>
          <div>
            <strong>VŨ GIA</strong>
            <span>PRODUCT INTELLIGENCE</span>
          </div>
          <Badge>V2</Badge>
        </div>
        <div className="workspace-label">KHÔNG GIAN LÀM VIỆC</div>
        <nav>
          {permitted.map(([id, label, Icon], i) => (
            <React.Fragment key={id}>
              {[4, 8, 10].includes(i) && <div className="nav-divider" />}
              <button className={page === id ? 'active' : ''} onClick={() => navigate(id)}>
                <Icon size={19} />
                <span>{label}</span>
                {id === 'matching' && pendingMatchesCount > 0 && <b>{pendingMatchesCount}</b>}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="system-note">
            <ShieldCheck size={18} />
            <span>Dữ liệu lưu an toàn trên máy<br /><small>Bản HTML trực tiếp · Quyền quản trị</small></span>
          </div>
          <div className="profile">
            <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
            <span>
              <strong>{user.name}</strong>
              <small>{D.roles[user.role]}</small>
            </span>
            <IconButton icon={Settings} label="Cài đặt vai trò" onClick={() => navigate('admin')} />
          </div>
        </div>
      </aside>

      {sidebar && <div className="sidebar-overlay" onClick={() => setSidebar(false)} />}

      <div className="workspace">
        <header className="topbar">
          <IconButton icon={Menu} label="Mở menu" onClick={() => setSidebar(!sidebar)} className="icon-button mobile-menu" />
          <div className="breadcrumb">
            Không gian làm việc <ChevronRight size={14} /><strong>{current?.[1]}</strong>
          </div>
          <div className="topbar-actions">
            <span className="today">
              {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <IconButton
              icon={Maximize2}
              label="Toàn màn hình khi họp"
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen();
                else document.documentElement.requestFullscreen().catch(() => notify('Trình duyệt không hỗ trợ toàn màn hình'));
              }}
            />
            <IconButton icon={RefreshCw} label="Làm mới hiển thị" onClick={() => notify('Dữ liệu đã được cập nhật.')} />
            <div className="avatar small-avatar">{user.name[0]}</div>
          </div>
        </header>

        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">VŨ GIA / {page === 'dashboard' ? 'TRUNG TÂM ĐIỀU HÀNH' : 'QUẢN TRỊ SẢN PHẨM'}</div>
              <h1>{current?.[1]}</h1>
              <p>
                {page === 'dashboard'
                  ? 'Bức tranh kinh doanh và những quyết định cần ưu tiên.'
                  : page === 'own'
                    ? 'Quản lý danh mục, theo dõi giá và sức cạnh tranh của Lock&King.'
                    : page === 'rivals'
                      ? 'Theo dõi thị trường và tìm sản phẩm tương đương.'
                      : 'Dữ liệu có nguồn · Đánh giá có cơ sở · Quyết định có kiểm duyệt'}
              </p>
            </div>
            <div className="heading-actions">
              {['admin', 'leader'].includes(user.role) && (
                <>
                  <button onClick={() => navigate('import')}><Upload size={16} />Nhập Excel</button>
                  <button className="primary" onClick={() => setEditing({})}><Plus size={17} />Thêm sản phẩm</button>
                </>
              )}
            </div>
          </div>

          {products.some(p => p.demo) && (
            <div className="demo-banner">
              <Info size={16} />
              <span>Đang có dữ liệu minh họa. Các mức giá và điểm đánh giá không phải thông tin thị trường đã xác minh.</span>
            </div>
          )}

          {page === 'dashboard' && <Dashboard {...ctx} />}
          {page === 'brands' && (
            <BrandSheets
              {...ctx}
              renderCatalog={(items, name) => (
                <Catalog key={name} {...ctx} products={items} kind={D.own({ brand: name }) ? 'own' : 'rivals'} />
              )}
            />
          )}
          {['own', 'rivals'].includes(page) && <Catalog {...ctx} kind={page} />}
          {page === 'import' && <ImportView {...ctx} />}
          {page === 'matching' && <Matching {...ctx} />}
          {page === 'compare' && <Comparison {...ctx} />}
          {page === 'finance' && <FinanceView {...ctx} />}
          {page === 'scoring' && <Scoring {...ctx} />}
          {page === 'opportunities' && <Opportunities {...ctx} />}
          {page === 'proposals' && <Proposals {...ctx} />}
          {page === 'reports' && <Reports {...ctx} />}
          {page === 'admin' && <Admin {...ctx} />}

          <footer>
            VŨ GIA · So sánh sản phẩm V2 <span>Nguồn dữ liệu và thời điểm cập nhật được lưu theo từng sản phẩm.</span>
          </footer>
        </main>
      </div>

      {selected.length > 0 && page !== 'compare' && (
        <div className="compare-tray">
          <div>
            <ArrowLeftRight size={20} />
            <strong>{selected.length}/5 sản phẩm đã chọn</strong>
          </div>
          <button onClick={() => setSelected([])}>Bỏ chọn</button>
          <button className="primary" onClick={() => navigate('compare')}>
            So sánh ngay <ChevronRight size={16} />
          </button>
        </div>
      )}

      {activeDetail && <ProductDetail {...ctx} p={activeDetail} close={() => setDetail(null)} />}
      {editing && <ProductEditor {...ctx} product={editing} close={() => setEditing(null)} />}
      {toast && (
        <div className="toast" role="status">
          <Info size={18} />
          {toast}
          <button onClick={() => setToast('')} aria-label="Đóng thông báo"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone = 'blue', note }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <div className={'stat-icon ' + tone}><Icon size={20} /></div>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Dashboard(c) {
  const { products, data, setPage, setDetail } = c;
  const own = products.filter(D.own);
  const rivals = products.filter(p => !D.own(p));
  const pending = data.matches.filter(m => m.status === 'AI đề xuất' && m.ids?.length);
  const gaps = rivals.filter(p => p.gap === 'confirmed');
  const profits = own.filter(p => D.has(p.financial?.net)).sort((a, b) => b.financial.net - a.financial.net).slice(0, 10);
  const top = own.filter(p => !p.recommendation?.pending && p.recommendation).sort((a, b) => (b.score?.score || 0) - (a.score?.score || 0)).slice(0, 10);
  const bars = own.filter(p => p.online > 0).slice(0, 6);
  const brands = Object.entries(rivals.reduce((a, p) => (a[p.brand] = (a[p.brand] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="stats">
        <Stat label="Sản phẩm Lock&King" value={own.length} icon={Package} note="Danh mục của Vũ Gia" />
        <Stat label="Sản phẩm đối thủ" value={rivals.length} icon={Boxes} tone="violet" note={`${brands.length} thương hiệu đang theo dõi`} />
        <Stat label="Ghép cặp chờ duyệt" value={pending.length} icon={GitCompareArrows} tone="orange" note={`${data.matches.filter(m => m.ids?.length).length} sản phẩm đã có ghép cặp`} />
        <Stat label="Cơ hội sản phẩm mới" value={gaps.length} icon={Sparkles} tone="green" note={`${rivals.filter(p => p.gap === 'incomplete').length} trường hợp cần bổ sung dữ liệu`} />
      </div>

      {!products.length ? (
        <Empty title="Sẵn sàng xây dựng danh mục của bạn" text="Nhập Excel hoặc thêm sản phẩm đầu tiên.">
          <button className="primary" onClick={() => setPage('import')}>Nhập Excel</button>
        </Empty>
      ) : (
        <>
          <div className="dashboard-grid">
            <section className="panel price-panel">
              <div className="panel-head">
                <div>
                  <h2>Vị thế giá trên thị trường</h2>
                  <p>Giá online của Lock&King và sản phẩm tương đương</p>
                </div>
                <button className="text-button" onClick={() => setPage('compare')}>Chi tiết <ArrowUpRight size={16} /></button>
              </div>
              <div className="legend">
                <span><i className="blue-dot" />Lock&King</span>
                <span><i className="light-dot" />Trung bình đối thủ tương đương</span>
              </div>
              <div className="bar-chart">
                {bars.map(p => {
                  const peers = rivals.filter(q => D.similarity(p, q).score >= 50 && q.online > 0);
                  const avg = peers.length ? peers.reduce((s, q) => s + q.online, 0) / peers.length : null;
                  const max = Math.max(...bars.map(q => q.online), ...rivals.map(q => q.online || 0), 1);
                  return (
                    <div className="bar-row" key={p.id}>
                      <button className="bar-label" onClick={() => setDetail(p.id)}>
                        {p.category}<small>{p.code}</small>
                      </button>
                      <div className="bar-tracks">
                        <div>
                          <span style={{ width: Math.max(2, p.online / max * 100) + '%' }} />
                          <b>{money(p.online)}</b>
                        </div>
                        {avg && (
                          <div>
                            <span className="rival-bar" style={{ width: Math.max(2, avg / max * 100) + '%' }} />
                            <b>{money(avg)}</b>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel attention">
              <div className="panel-head">
                <h2>Cần bạn xử lý</h2>
                <Badge tone="orange">Ưu tiên</Badge>
              </div>
              <button onClick={() => setPage('matching')}>
                <div className="attention-icon orange"><GitCompareArrows /></div>
                <span><strong>{pending.length} kết quả ghép cặp</strong><small>Kiểm tra và xác nhận tương đương</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setPage('opportunities')}>
                <div className="attention-icon green"><Sparkles /></div>
                <span><strong>{gaps.length} cơ hội mới</strong><small>Lock&King chưa có tương đương</small></span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setPage('scoring')}>
                <div className="attention-icon violet"><Target /></div>
                <span><strong>{own.filter(p => p.score?.score === null).length} sản phẩm thiếu dữ liệu</strong><small>Bổ sung trước khi chấm điểm</small></span>
                <ChevronRight size={18} />
              </button>
              <div className="advantage-summary">
                <div>
                  <strong className="good-text">{own.filter(p => p.score?.score >= 70).length}</strong>
                  <span>Có khả năng cạnh tranh</span>
                </div>
                <div>
                  <strong className="bad-text">{own.filter(p => p.score?.score != null && p.score.score < 50).length}</strong>
                  <span>Đang bất lợi</span>
                </div>
              </div>
            </section>
          </div>

          <div className="dashboard-grid lower">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Sản phẩm cần ưu tiên đánh giá</h2>
                  <p>Xếp theo điểm cạnh tranh, tối đa 10 sản phẩm</p>
                </div>
                <button className="text-button" onClick={() => setPage('proposals')}>Xem đề xuất <ChevronRight size={16} /></button>
              </div>
              {top.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Điểm</th>
                        <th>Lợi nhuận / sp</th>
                        <th>Đề xuất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top.map(p => (
                        <tr key={p.id}>
                          <td>
                            <button className="table-product" onClick={() => setDetail(p.id)}>
                              <strong>{p.name}</strong>
                              <small>{p.code} · {p.category}</small>
                            </button>
                          </td>
                          <td><Score score={p.score} /></td>
                          <td className="good-text">{money(p.financial?.net)}</td>
                          <td><Badge tone="blue">{p.recommendation.label}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="Chưa có đề xuất đủ cơ sở" text="Cần dữ liệu giá nhập, chi phí và đánh giá có nguồn để xếp hạng." />
              )}
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Thương hiệu đang theo dõi</h2>
                <Boxes size={20} />
              </div>
              <div className="brand-list">
                {brands.slice(0, 5).map(([brand, count]) => (
                  <div key={brand}>
                    <div className="brand-initial">{brand.slice(-1)}</div>
                    <span>
                      <strong>{brand}</strong>
                      <small>{rivals.filter(p => p.brand === brand && p.matching?.length).length} sản phẩm cạnh tranh trực tiếp</small>
                    </span>
                    <b>{count}</b>
                  </div>
                ))}
              </div>
              <div className="panel-bottom">Số lượng sản phẩm có trong danh mục hiện tại</div>
            </section>
          </div>

          {D.canFinance(c.user.role) && (
            <div className="dashboard-grid">
              <section className="panel">
                <div className="panel-head">
                  <h2>Top lợi nhuận dự kiến</h2>
                  <Wallet size={20} />
                </div>
                <div className="profit-bars">
                  {profits.map(p => (
                    <div key={p.id}>
                      <button onClick={() => setDetail(p.id)}>{p.code}</button>
                      <div>
                        <span
                          style={{
                            width: Math.max(2, Math.abs(p.financial.net) / Math.max(...profits.map(q => Math.abs(q.financial.net)), 1) * 100) + '%',
                            background: p.financial.net < 0 ? '#dc4c57' : undefined
                          }}
                        />
                      </div>
                      <strong>{money(p.financial.net)}</strong>
                    </div>
                  ))}
                  {!profits.length && <p className="muted">Chưa đủ dữ liệu lợi nhuận.</p>}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h2>Top cần điều chỉnh giá</h2>
                  <TrendingUp size={20} />
                </div>
                <div className="brand-list">
                  {own.filter(p => p.recommendation?.label === 'Nên đàm phán lại giá').slice(0, 10).map(p => (
                    <button className="list-link" key={p.id} onClick={() => setDetail(p.id)}>
                      {p.name} <Badge tone="orange">Đàm phán giá</Badge>
                    </button>
                  ))}
                  {!own.some(p => p.recommendation?.label === 'Nên đàm phán lại giá') && (
                    <p className="muted">Chưa ghi nhận đề xuất điều chỉnh giá có đủ cơ sở.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          <div className="dashboard-grid">
            <Matrix products={own} title="Ma trận giá & tính năng" x="online" y="difference" xLabel="Giá online →" yLabel="Tính năng khác biệt (0–100)" setDetail={setDetail} />
            <Matrix products={own} title="Ma trận tiềm năng & rủi ro" x="inventoryRisk" y="demand" xLabel="Rủi ro tồn kho (0–100) →" yLabel="Tiềm năng nhu cầu (0–100)" setDetail={setDetail} />
          </div>
        </>
      )}
    </>
  );
}

function Matrix({ products, title, x, y, xLabel, yLabel, setDetail }) {
  const points = products.filter(p => D.has(p[x]) && D.has(p[y]) && D.has(p.assessmentSource));
  const max = Math.max(1, ...points.map(p => p[x]));
  const clusters = Object.values(points.reduce((out, p) => {
    const key = p[x] + ':' + p[y];
    (out[key] ??= []).push(p);
    return out;
  }, {}));

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="small muted">{points.length} sản phẩm có dữ liệu</span>
      </div>
      <div className="scatter">
        <small>{yLabel}</small>
        <div className="scatter-grid">
          {clusters.map((cluster, i) => {
            const p = cluster[0];
            return (
              <button
                key={i}
                style={{ left: 5 + p[x] / max * 88 + '%', bottom: 5 + p[y] / 100 * 80 + '%' }}
                title={cluster.map(p => p.code + ': ' + num(p[x]) + ' / ' + num(p[y])).join('\n')}
                onClick={() => setDetail(p.id)}
              >
                <i />{cluster.length > 1 ? cluster.length + ' sản phẩm' : p.code}
              </button>
            );
          })}
          {!points.length && <span className="matrix-empty">Chưa đủ dữ liệu để hiển thị</span>}
        </div>
        <small className="x-label">{xLabel}</small>
        {clusters.some(c => c.length > 1) && <small>Các sản phẩm cùng tọa độ được gộp; trỏ chuột để xem mã.</small>}
      </div>
    </section>
  );
}

function BrandSheets({ products, brands, user, notify, setEditing, renderCatalog, state, commit }) {
  const [active, setActive] = useState('lockking');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [names, setNames] = useState('');
  const [busy, setBusy] = useState(false);

  const current = brands.find(b => b.key === active) || brands[0];
  const matching = useMemo(() => products.filter(p => brandKey(p.brand) === current?.key), [products, current?.key]);
  const filtered = brands.filter(b => brandKey(b.name).includes(brandKey(search)));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const list = names.split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
      if (list.some(n => n.length > 120) || list.length > 1000) {
        throw Error('Tối đa 1.000 hãng, mỗi tên tối đa 120 ký tự.');
      }
      const existingKeys = new Set(brands.map(b => b.key));
      const toAdd = list.filter(n => {
        const k = brandKey(n);
        if (existingKeys.has(k)) return false;
        existingKeys.add(k);
        return true;
      }).map(name => ({ name }));

      const nextBrands = [...(state.brands || []), ...toAdd];
      await commit({ ...state, brands: nextBrands }, `Đã thêm ${toAdd.length} hãng mới.`);
      setAdding(false);
      setNames('');
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  function exportBrandExcel(all) {
    const wb = XLSX.utils.book_new(), used = new Set();
    const targetBrands = all ? brands : current ? [current] : [];
    for (const b of targetBrands) {
      const rows = products.filter(p => brandKey(p.brand) === b.key);
      const sh = XLSX.utils.aoa_to_sheet([
        D.fields.map(f => f.label),
        ...rows.map(p => D.fields.map(f => String(p[f.key] ?? '').startsWith('data:image/') ? 'Ảnh lưu trong bản sao lưu JSON' : p[f.key] ?? ''))
      ]);
      sh['!cols'] = D.fields.map(f => ({ wch: f.key === 'name' ? 45 : 22 }));
      XLSX.utils.book_append_sheet(wb, sh, sheetName(b.name, used));
    }
    if (!wb.SheetNames.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([D.fields.map(f => f.label)]), 'Sản phẩm');
    }
    saveFile(
      XLSX.write(wb, { type: 'array', bookType: 'xlsx' }),
      all ? 'Vu-Gia-Moi-Hang-Mot-Sheet.xlsx' : `Vu-Gia-${current?.name || 'Hang'}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }

  return (
    <>
      <div className="brand-workspace-actions">
        <span><strong>{brands.length}</strong> hãng · <strong>{products.length}</strong> sản phẩm</span>
        <div className="inline-actions">
          <button className="button" onClick={() => exportBrandExcel(true)}><Download size={16} />Xuất mỗi hãng 1 sheet</button>
          {['admin', 'leader'].includes(user.role) && (
            <button className="primary" onClick={() => setAdding(true)}><Plus size={16} />Thêm danh sách hãng</button>
          )}
        </div>
      </div>

      <div className="brand-workspace">
        <aside className="brand-index panel">
          <div className="brand-search">
            <Search size={17} />
            <input
              aria-label="Tìm tên hãng"
              placeholder="Tìm trong danh sách hãng…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div role="tablist" aria-label="Danh sách hãng" aria-orientation="vertical" className="brand-tabs">
            {filtered.map(b => (
              <button
                key={b.key}
                id={'brand-tab-' + encodeURIComponent(b.key)}
                role="tab"
                aria-selected={current?.key === b.key}
                aria-controls="brand-products-panel"
                onClick={() => setActive(b.key)}
              >
                <Building2 size={16} />
                <span>{b.name}</span>
                <b>{b.count}</b>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          {!filtered.length && <p className="muted padded">Không tìm thấy hãng.</p>}
        </aside>

        <section role="tabpanel" id="brand-products-panel" aria-labelledby={current ? 'brand-tab-' + encodeURIComponent(current.key) : undefined} className="brand-products">
          <div className="brand-current">
            <div>
              <h2>{current?.name || 'Danh mục hãng'}</h2>
              <p>{matching.length} sản phẩm thuộc hãng này</p>
            </div>
            <div className="inline-actions">
              {current && (
                <button className="button" onClick={() => exportBrandExcel(false)}><Download size={16} />Xuất hãng này</button>
              )}
              {current && ['admin', 'leader'].includes(user.role) && (
                <button onClick={() => setEditing({ brand: current.name })}><Plus size={16} />Thêm sản phẩm</button>
              )}
            </div>
          </div>
          {current && renderCatalog(matching, current.name)}
        </section>
      </div>

      {adding && (
        <div className="modal-backdrop">
          <form className="modal compact" onSubmit={save}>
            <div className="modal-head">
              <h2>Thêm danh sách hãng</h2>
              <IconButton icon={X} label="Đóng" onClick={() => setAdding(false)} />
            </div>
            <div className="padded">
              <label>
                Mỗi dòng một hãng, hoặc ngăn cách bằng dấu phẩy
                <textarea
                  rows={12}
                  autoFocus
                  value={names}
                  onChange={e => setNames(e.target.value)}
                  placeholder={'Jiwon\nMorico\nHare\nHaatz'}
                />
              </label>
              <p className="small muted">Có thể dán khoảng 100 hãng cùng lúc. Tên trùng được bỏ qua; hãng mới có sheet trống để bạn nhập sản phẩm.</p>
            </div>
            <div className="modal-foot">
              <button type="button" onClick={() => setAdding(false)}>Hủy</button>
              <button disabled={busy || !names.trim()} className="primary">{busy ? 'Đang lưu…' : 'Tạo các sheet hãng'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Catalog(c) {
  const { products, kind, setEditing, setDetail, selected, toggle, data, images } = c;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [score, setScore] = useState('');
  const [profit, setProfit] = useState('');
  const [match, setMatch] = useState('');
  const [proposal, setProposal] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [view, setView] = useState('grid');

  const base = products.filter(p => D.own(p) === (kind === 'own'));
  const list = base.filter(p =>
    D.norm([p.code, p.name, p.brand, p.category, p.purpose, p.capacity, p.power, p.material].join(' ')).includes(D.norm(search)) &&
    (!category || p.category === category) &&
    (!brand || p.brand === brand) &&
    (!min || (D.has(p.online) && p.online >= Number(min))) &&
    (!max || (D.has(p.online) && p.online <= Number(max))) &&
    (!score || p.score?.score >= Number(score)) &&
    (!profit || p.financial?.net >= Number(profit)) &&
    (!match || (match === 'gap' ? p.gap === 'confirmed' : data.matches.find(m => m.id === p.id)?.status === match)) &&
    (!proposal || data.proposals.find(m => m.productId === p.id)?.status === proposal)
  );

  return (
    <>
      <section className="panel filter-panel">
        <div className="filter-main">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tìm mã, tên, thương hiệu, dung tích, chất liệu…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select aria-label="Nhóm ngành hàng" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Tất cả nhóm hàng</option>
            {[...new Set(base.map(p => p.category))].filter(Boolean).map(v => <option key={v}>{v}</option>)}
          </select>
          <select aria-label="Thương hiệu" value={brand} onChange={e => setBrand(e.target.value)}>
            <option value="">Tất cả thương hiệu</option>
            {[...new Set(base.map(p => p.brand))].filter(Boolean).map(v => <option key={v}>{v}</option>)}
          </select>
          <button onClick={() => setAdvanced(!advanced)}>
            <SlidersHorizontal size={17} />Bộ lọc
          </button>
        </div>
        {advanced && (
          <div className="advanced-filters">
            <label>Giá online từ<input type="number" min="0" value={min} onChange={e => setMin(e.target.value)} /></label>
            <label>Giá online đến<input type="number" min="0" value={max} onChange={e => setMax(e.target.value)} /></label>
            <label>Điểm tối thiểu<input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} /></label>
            {D.canFinance(c.user.role) && (
              <label>Lợi nhuận tối thiểu<input type="number" value={profit} onChange={e => setProfit(e.target.value)} /></label>
            )}
            <label>
              Ghép cặp
              <select value={match} onChange={e => setMatch(e.target.value)}>
                <option value="">Tất cả</option>
                <option>AI đề xuất</option>
                <option>Đã kiểm duyệt</option>
                <option value="gap">Chưa có tương đương</option>
              </select>
            </label>
            <label>
              Đề xuất nhập
              <select value={proposal} onChange={e => setProposal(e.target.value)}>
                <option value="">Tất cả</option>
                <option>Chờ phê duyệt</option>
                <option>Đã duyệt nhập</option>
                <option>Từ chối</option>
              </select>
            </label>
          </div>
        )}
      </section>

      <div className="results-line">
        <span><strong>{list.length}</strong> sản phẩm <span className="muted">trong danh mục</span></span>
        <div className="segmented">
          <button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')}>
            <LayoutDashboard size={16} />Dạng thẻ
          </button>
          <button className={view === 'table' ? 'selected' : ''} onClick={() => setView('table')}>
            <Menu size={16} />Dạng bảng
          </button>
        </div>
      </div>

      {!list.length ? (
        <Empty title="Không có sản phẩm phù hợp" text="Thử thay đổi bộ lọc hoặc thêm dữ liệu." />
      ) : view === 'grid' ? (
        <div className="product-grid">
          {list.map(p => (
            <article className={'product-card ' + (selected.includes(p.id) ? 'is-selected' : '')} key={p.id}>
              <div className="card-photo">
                <button className="photo-button" onClick={() => setDetail(p.id)} aria-label={'Chi tiết ' + p.name}>
                  <ProductImage p={p} images={images} />
                </button>
                <input
                  className="select-check"
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  aria-label={'Chọn so sánh ' + p.name}
                />
                <Badge tone={p.stock === 'Còn hàng' ? 'green' : ''}>{p.stock || 'Chưa rõ tồn kho'}</Badge>
              </div>
              <div className="card-body">
                <div className="card-meta">
                  <span>{p.code}</span>
                  <span>{p.category}</span>
                </div>
                <button className="product-title" onClick={() => setDetail(p.id)}>{p.name}</button>
                <p className="card-specs">{[p.capacity, p.power, p.material].filter(Boolean).join(' · ') || 'Chưa có thông số'}</p>
                <div className="card-prices">
                  {D.catalogPriceKeys.filter(k => D.has(p[k])).map(k => (
                    <div key={k}>
                      <small>{D.labels[k]}</small>
                      <strong>{money(p[k])}</strong>
                    </div>
                  ))}
                  {!D.catalogPriceKeys.some(k => D.has(p[k])) && <span className="muted">Chưa có giá xác định</span>}
                </div>
                {p.quoteReview?.length > 0 && (
                  <button className="text-button warn-text" onClick={() => setDetail(p.id)}>
                    Báo giá có {p.quoteReview.length} mục cần xác minh
                  </button>
                )}
                <div className="card-bottom">
                  <div>
                    <small>Điểm cạnh tranh</small>
                    <Score score={p.score} />
                  </div>
                  <button onClick={() => setDetail(p.id)} className="text-button">
                    {D.own(p)
                      ? products.filter(q => !D.own(q) && q.matching?.some(m => m.id === p.id)).length
                      : p.matching?.length || 0} tương đương
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="data-status">
                  <span className={p.dataMissing?.length ? 'warn-text' : 'good-text'}>
                    {p.dataMissing?.length ? 'Cần bổ sung thông số' : 'Đã có thông số chính'}
                  </span>
                  <small>{p.demo ? 'Minh họa' : p.brand}</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Chọn</th>
                <th>Sản phẩm</th>
                <th>Thương hiệu</th>
                <th>Giá theo báo giá</th>
                <th>Điểm</th>
                <th>Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={'Chọn ' + p.name}
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                  </td>
                  <td>
                    <button className="table-product" onClick={() => setDetail(p.id)}>
                      <strong>{p.name}</strong>
                      <small>{p.code}</small>
                    </button>
                  </td>
                  <td>{p.brand}</td>
                  <td>
                    {D.catalogPriceKeys.filter(k => D.has(p[k])).map(k => (
                      <div key={k}><small>{D.labels[k]}: </small>{money(p[k])}</div>
                    ))}
                    {!D.catalogPriceKeys.some(k => D.has(p[k])) && 'Chưa có giá xác định'}
                  </td>
                  <td><Score score={p.score} /></td>
                  <td>{p.stock || 'Chưa có dữ liệu'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ProductEditor({ product, close, user, state, commit, notify }) {
  const [tab, setTab] = useState('basic');
  const [values, setValues] = useState({ ...product });
  const [saving, setSaving] = useState(false);

  const permitted = Object.entries(D.groups).filter(([key]) =>
    D.fields.some(f => f.group === key && D.editable(user.role, f.key))
  );

  useEffect(() => {
    if (!permitted.some(([key]) => key === tab)) setTab(permitted[0]?.[0]);
  }, []);

  const fs = D.fields.filter(f => f.group === tab && (D.canFinance(user.role) || !D.privateKeys.includes(f.key)));

  async function save(e) {
    e.preventDefault();
    const errors = D.validate(values);
    if (errors.length) {
      notify(errors.map(e => D.labels[e.field] + ': ' + e.message).join('; '));
      return;
    }
    setSaving(true);
    try {
      const old = state.products.find(p => p.id === product.id);
      const nextP = {
        ...values,
        id: product.id || uid(),
        updatedAt: new Date().toISOString(),
        updatedBy: user.name
      };
      const priceChanges = D.fields.filter(f => f.type === 'money' && old?.[f.key] !== nextP[f.key])
        .map(f => ({ field: f.key, before: old?.[f.key] ?? null, after: nextP[f.key] ?? null }));
      nextP.priceHistory = [
        ...(old?.priceHistory || []),
        ...(priceChanges.length ? [{ at: nextP.updatedAt, by: user.name, changes: priceChanges }] : [])
      ];

      const nextProducts = old
        ? state.products.map(x => x.id === nextP.id ? nextP : x)
        : [...state.products, nextP];

      const ok = await commit({ ...state, products: nextProducts }, 'Đã lưu thông tin sản phẩm.');
      if (ok) close();
    } catch (e) {
      notify(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal editor" role="dialog" aria-modal="true" aria-label="Thông tin sản phẩm">
        <div className="modal-head">
          <div>
            <h2>{product.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
            <p>Ô trống là chưa có dữ liệu. Chỉ nhập 0 khi đã xác nhận.</p>
          </div>
          <IconButton icon={X} label="Đóng" onClick={close} />
        </div>
        <div className="tabs">
          {permitted.map(([key, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
        <form onSubmit={save}>
          <div className="form-grid scroll-form">
            {tab === 'media' && (
              <label className="span-2">
                Tải ảnh từ máy tính (lưu trực tiếp trong dữ liệu)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 10 * 1024 * 1024) {
                        notify('Ảnh tối đa 10 MB.');
                        return;
                      }
                      const b64 = await readFile(f);
                      setValues({ ...values, image: b64 });
                    }
                  }}
                />
              </label>
            )}
            {fs.map(f => (
              <label key={f.key} className={f.type === 'textarea' ? 'span-2' : ''}>
                {f.label}
                {['code', 'name', 'brand', 'category'].includes(f.key) && <span className="required"> *</span>}
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={values[f.key] ?? ''}
                    disabled={!D.editable(user.role, f.key)}
                    onChange={e => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : (
                  <input
                    type={['number', 'money', 'percent'].includes(f.type) ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    step="any"
                    min={D.numeric.includes(f.key) ? 0 : undefined}
                    value={values[f.key] ?? ''}
                    disabled={!D.editable(user.role, f.key)}
                    onChange={e => setValues({
                      ...values,
                      [f.key]: D.numeric.includes(f.key) && e.target.value !== '' ? Number(e.target.value) : e.target.value
                    })}
                    placeholder={
                      f.key === 'brand'
                        ? 'Lock&King hoặc tên thương hiệu'
                        : f.key === 'capacity'
                          ? 'Ví dụ: 3 l hoặc 3000 ml'
                          : f.key === 'power'
                            ? 'Ví dụ: 700 W'
                            : ''
                    }
                  />
                )}
              </label>
            ))}
          </div>
          <div className="modal-foot">
            <span className="small muted">Người cập nhật: {user.name}</span>
            <button type="button" onClick={close}>Hủy</button>
            <button className="primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu sản phẩm'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProductDetail(c) {
  const { p, close, user, data, setEditing, setSelected, setPage, products, notify, state, commit, images } = c;
  const [tab, setTab] = useState('details');
  const [advice, setAdvice] = useState('');
  const peers = D.own(p)
    ? products.filter(q => !D.own(q) && q.matching?.some(m => m.id === p.id))
    : products.filter(q => p.matching?.some(m => m.id === q.id));
  const f = p.financial;

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  async function toggleFollow() {
    const nextFollows = data.follows.some(f => f.productId === p.id)
      ? data.follows.filter(f => f.productId !== p.id)
      : [...data.follows, { id: uid(), productId: p.id }];
    await commit({ ...state, follows: nextFollows }, 'Đã cập nhật theo dõi.');
  }

  async function deleteProduct() {
    if (!confirm('Xóa sản phẩm ' + p.code + '? Thao tác này sẽ xóa cả ghép cặp liên quan.')) return;
    const nextProducts = state.products.filter(x => x.id !== p.id);
    const nextMatches = (state.matches || []).filter(m => m.id !== p.id)
      .map(m => ({ ...m, ids: m.ids?.filter(id => id !== p.id) }));
    await commit({ ...state, products: nextProducts, matches: nextMatches }, 'Đã xóa sản phẩm.');
    close();
  }

  async function sendProposal() {
    if (!confirm('Gửi sản phẩm này vào danh sách chờ phê duyệt nhập hàng?')) return;
    const nextProposals = [
      ...(state.proposals || []).filter(q => q.id !== p.id),
      { id: p.id, productId: p.id, status: 'Chờ phê duyệt', by: user.name, at: new Date().toISOString() }
    ];
    await commit({ ...state, proposals: nextProposals }, 'Đã gửi đề xuất nhập hàng.');
  }

  return (
    <div className="drawer-backdrop" onClick={close}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={'Chi tiết ' + p.name} onClick={e => e.stopPropagation()}>
        <div className="drawer-top">
          <Badge tone="blue">{p.code}</Badge>
          <div className="inline-actions">
            <IconButton icon={Bookmark} label="Theo dõi sản phẩm" onClick={toggleFollow} />
            <IconButton icon={Pencil} label="Chỉnh sửa" onClick={() => setEditing(p)} />
            <IconButton icon={X} label="Đóng chi tiết" onClick={close} />
          </div>
        </div>
        <ProductImage p={p} large images={images} />
        <div className="drawer-content">
          <div className="eyebrow">{p.brand} / {p.category}</div>
          <h2>{p.name}</h2>
          <div className="inline-actions">
            <Score score={p.score} />
            <Badge tone={p.stock === 'Còn hàng' ? 'green' : ''}>{p.stock || 'Chưa rõ tồn kho'}</Badge>
            {data.follows.some(f => f.productId === p.id) && <Badge tone="blue">Đang theo dõi</Badge>}
          </div>
          <p className="muted small">Cập nhật {date(p.updatedAt)} · {p.updatedBy || 'Chưa ghi nhận'}</p>

          <div className="drawer-cta">
            <button
              className="primary"
              onClick={() => {
                setSelected([p.id, ...peers.slice(0, 4).map(p => p.id)]);
                setPage('compare');
                close();
              }}
            >
              <ArrowLeftRight size={17} />So sánh ngay
            </button>
            {!D.own(p) && (
              <button onClick={() => { setPage('matching'); close(); }}>Chọn tương đương</button>
            )}
          </div>

          <div className="tabs">
            <button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Chi tiết</button>
            <button className={tab === 'prices' ? 'active' : ''} onClick={() => setTab('prices')}>Giá & lợi nhuận</button>
            <button className={tab === 'matches' ? 'active' : ''} onClick={() => setTab('matches')}>Tương đương</button>
            <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Lịch sử</button>
          </div>

          {tab === 'details' && (
            <>
              {['basic', 'specs', 'media', 'market', 'procurement', 'assessment'].map(group => (
                <section className="detail-section" key={group}>
                  <h3>{D.groups[group]}</h3>
                  <dl>
                    {D.fields.filter(f => f.group === group && !['image', 'images', 'packaging'].includes(f.key) && (D.canFinance(user.role) || !D.privateKeys.includes(f.key))).map(f => (
                      <div key={f.key}>
                        <dt>{f.label}</dt>
                        <dd>
                          {D.has(p[f.key])
                            ? (f.type === 'url' ? <a href={p[f.key]} target="_blank" rel="noreferrer">Mở đường dẫn <ArrowUpRight size={12} /></a> : String(p[f.key]))
                            : <span className="muted">Chưa có dữ liệu</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}

              <section className="detail-section">
                <h3>Chuẩn hóa dữ liệu</h3>
                {p.normalizationConfirmed ? (
                  <Badge tone="green">Đã xác nhận bởi {p.normalizationConfirmed.by}</Badge>
                ) : (
                  <>
                    <p className="small muted">Giữ nguyên dữ liệu gốc. Xem giá trị chuẩn bên dưới trước khi xác nhận.</p>
                    <dl>
                      {['code', 'capacity', 'power', 'mass', 'dimensions'].map(k => (
                        <div key={k}>
                          <dt>{D.labels[k]}</dt>
                          <dd>{p[k] || '—'} → {D.normalizeProduct(p).data[k] || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                    {(p.warnings || []).map(w => <p className="warn-text small" key={w}>{w}</p>)}
                    {['admin', 'leader'].includes(user.role) && (
                      <button
                        onClick={async () => {
                          if (confirm('Xác nhận áp dụng các giá trị chuẩn hóa? Dữ liệu gốc vẫn được lưu.')) {
                            const norm = D.normalizeProduct(p);
                            const updated = { ...p, ...norm.data, normalizationConfirmed: { by: user.name, at: new Date().toISOString() } };
                            await commit({ ...state, products: state.products.map(x => x.id === p.id ? updated : x) }, 'Đã xác nhận chuẩn hóa.');
                          }
                        }}
                      >
                        <Check size={16} />Xác nhận chuẩn hóa
                      </button>
                    )}
                  </>
                )}
              </section>
            </>
          )}

          {tab === 'prices' && (
            <>
              <section className="detail-section">
                <h3>Các mức giá và chi phí</h3>
                <dl>
                  {D.fields.filter(f => f.group === 'prices' && (D.canFinance(user.role) || !D.privateKeys.includes(f.key))).map(f => (
                    <div key={f.key}>
                      <dt>{f.label}</dt>
                      <dd>{f.type === 'money' ? money(p[f.key]) : (p[f.key] ?? 'Chưa có dữ liệu')}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              {f && (
                <section className="detail-section">
                  <h3>Lợi nhuận dự kiến</h3>
                  {f.missing?.length ? (
                    <p className="notice">Cần bổ sung: {f.missing.map(k => D.labels[k]).join(', ')}</p>
                  ) : f.error ? (
                    <p className="notice error">{f.error}</p>
                  ) : (
                    <dl>
                      {[['net', 'Lợi nhuận ròng / sp'], ['breakEven', 'Giá hòa vốn'], ['totalProfit', 'Tổng lợi nhuận dự kiến']].map(([k, l]) => (
                        <div key={k}>
                          <dt>{l}</dt>
                          <dd>{money(f[k])}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <h3>{p.recommendation?.label}</h3>
                  <p>{p.recommendation?.reason}</p>
                </section>
              )}
            </>
          )}

          {tab === 'matches' && (
            <section className="detail-section">
              {peers.length ? (
                peers.map(q => (
                  <button key={q.id} className="peer-card" onClick={() => c.setDetail(q.id)}>
                    <Package />
                    <span>
                      <strong>{q.name}</strong>
                      <small>{D.similarity(p, q).reason}</small>
                    </span>
                    <Badge tone="blue">{D.similarity(p, q).score}/100</Badge>
                  </button>
                ))
              ) : (
                <p className="notice">
                  {p.gap === 'confirmed' ? 'LOCK&KING HIỆN CHƯA CÓ SẢN PHẨM TƯƠNG ĐƯƠNG.' : 'Chưa đủ dữ liệu hoặc chưa có ghép cặp phù hợp.'}
                </p>
              )}
            </section>
          )}

          {tab === 'history' && (
            <section className="detail-section">
              <h3>Lịch sử thay đổi giá</h3>
              {p.priceHistory?.length ? (
                p.priceHistory.slice().reverse().map((h, i) => (
                  <div className="history-entry" key={i}>
                    <strong>{date(h.at)} · {h.by}</strong>
                    {h.changes.map((v, idx) => (
                      <p key={idx}>{D.labels[v.field]}: {v.before ?? 'Chưa có'} → {v.after ?? 'Chưa có'}</p>
                    ))}
                  </div>
                ))
              ) : (
                <p className="muted">Chưa có lịch sử được ghi nhận hoặc bạn không có quyền xem chi tiết.</p>
              )}
            </section>
          )}

          <div className="detail-section inline-actions">
            <button onClick={sendProposal}><ShoppingBag size={16} />Đề xuất nhập</button>
            <button onClick={() => setAdvice(`${p.name}\n${p.highlights || p.features || 'Cần bổ sung điểm nổi bật.'}\n${[p.capacity, p.material, p.warranty ? `Bảo hành ${p.warranty} tháng` : null].filter(Boolean).join(' · ')}\nGiá tham khảo: ${money(p.online)}.\nNguồn: ${p.source || 'Cần xác minh'}.\n${p.limitations ? 'Lưu ý: ' + p.limitations : ''}`)}>
              Tạo nội dung tư vấn
            </button>
          </div>

          {advice && (
            <div className="advice">
              <textarea value={advice} onChange={e => setAdvice(e.target.value)} rows={7} />
              <button onClick={() => navigator.clipboard.writeText(advice).then(() => notify('Đã sao chép')).catch(() => notify('Hãy chọn và sao chép nội dung trong ô'))}>
                Sao chép nội dung
              </button>
            </div>
          )}

          {['admin', 'leader'].includes(user.role) && (
            <button className="danger" onClick={deleteProduct}><Trash2 size={16} />Xóa sản phẩm</button>
          )}
        </div>
      </aside>
    </div>
  );
}

function ImportView({ data, notify, state, commit }) {
  const [draft, setDraft] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [validated, setValidated] = useState(null);
  const [mode, setMode] = useState('skip');
  const [busy, setBusy] = useState(false);

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellFormula: true });
      const sheetName = wb.SheetNames.includes('Sản phẩm') ? 'Sản phẩm' : wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      if (!sheet) throw Error('File không có trang dữ liệu');
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!matrix.length) throw Error('File trống');
      const headers = matrix[0].map(String);
      const rows = matrix.slice(1).map((values, i) => ({ row: i + 2, values })).filter(r => r.values.some(D.has));
      const autoMapping = headers.map(h => D.fields.find(f => D.norm(f.label) === D.norm(h) || D.norm(f.key) === D.norm(h) || (f.key === 'npp' && D.norm(h) === 'gia npp'))?.key || '');
      setDraft({ headers, rows, count: rows.length, file: file.name });
      setMapping(autoMapping);
      setValidated(null);
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  function validate() {
    if (!draft) return;
    setBusy(true);
    try {
      const selectedKeys = mapping.filter(Boolean);
      if (new Set(selectedKeys).size !== selectedKeys.length) throw Error('Mỗi trường chỉ được ghép một cột');
      if (['code', 'name', 'brand', 'category'].some(k => !selectedKeys.includes(k))) throw Error('Phải ghép đủ bốn cột bắt buộc (Mã sản phẩm, Tên sản phẩm, Thương hiệu, Nhóm ngành hàng)');

      const existing = [...state.products];
      const result = [];
      for (const row of draft.rows) {
        const p = {};
        mapping.forEach((k, i) => {
          if (k) {
            let v = row.values[i];
            if (D.numeric.includes(k) && D.has(v)) {
              let s = String(v).replace(/\s|₫|đ|VND/gi, '');
              if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
              else s = s.replace(',', '.');
              v = Number(s);
            }
            p[k] = v;
          }
        });
        const errors = D.validate(p);
        const dup = existing.find(q => D.norm(q.code) === D.norm(p.code) || (D.has(p.model) && D.norm(q.model) === D.norm(p.model)) || D.norm(q.name) === D.norm(p.name));
        const n = D.normalizeProduct(p);
        result.push({ row: row.row, p, errors, duplicate: dup ? { id: dup.id, code: dup.code } : null, warnings: n.warnings });
        existing.push({ ...p, id: 'row-' + row.row });
      }
      setValidated(result);
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function acceptCommit() {
    if (!draft || !validated) return;
    if (validated.some(r => r.errors.length)) {
      notify('Hãy sửa hoặc bỏ qua các dòng lỗi trước khi nhập.');
      return;
    }
    setBusy(true);
    try {
      let added = 0, updated = 0, skipped = 0;
      const ps = clone(state.products);
      for (const row of validated) {
        const at = ps.findIndex(x => brandKey(x.brand) === brandKey(row.p.brand) && D.norm(x.code) === D.norm(row.p.code));
        if (at >= 0) {
          if (mode === 'skip') {
            skipped++;
            continue;
          }
          if (mode === 'update') {
            ps[at] = { ...ps[at], ...row.p, updatedAt: new Date().toISOString() };
            updated++;
          } else {
            ps.push({ ...row.p, id: uid(), code: row.p.code + '-' + uid().slice(0, 4).toUpperCase(), updatedAt: new Date().toISOString() });
            added++;
          }
        } else {
          ps.push({ ...row.p, id: uid(), updatedAt: new Date().toISOString() });
          added++;
        }
      }

      const record = { id: uid(), file: draft.file, at: new Date().toISOString(), by: 'Bản HTML', added, updated, skipped };
      const nextImports = [...(state.imports || []), record];
      await commit({ ...state, products: ps, imports: nextImports }, `Đã thêm ${added}, cập nhật ${updated}, bỏ qua ${skipped} sản phẩm.`);
      setDraft(null);
      setValidated(null);
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }

  function template() {
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([D.fields.map(f => f.label)]);
    sheet['!cols'] = D.fields.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, sheet, 'Sản phẩm');
    saveFile(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), 'Mau-nhap-Vu-Gia.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  function downloadErrors() {
    const rows = validated.filter(r => r.errors.length).flatMap(r => r.errors.map(e => `"${r.row}","${D.labels[e.field]}","${e.message}"`));
    const blob = new Blob(['\ufeffDòng,Cột,Nguyên nhân\r\n' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    saveFile(blob, 'Loi-nhap-lieu.csv', 'text/csv');
  }

  return (
    <>
      <div className="steps">
        {['Tải lên Excel', 'Ánh xạ & xem trước', 'Kiểm tra dữ liệu', 'Xác nhận nhập'].map((s, i) => (
          <div key={s} className={(draft ? validated ? 3 : 1 : 0) >= i ? 'active' : ''}>
            <b>{i + 1}</b>{s}
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Nhập danh mục từ Excel</h2>
            <p>Hỗ trợ .xlsx, .xls và .csv · Tối đa 10 MB / 2.000 dòng mỗi lần</p>
          </div>
          <button className="button" onClick={template}><Download size={16} />Tải Excel mẫu</button>
        </div>
        <label className="upload-zone">
          <div className="upload-icon"><FileSpreadsheet size={34} /></div>
          <strong>{busy ? 'Đang xử lý dữ liệu…' : 'Chọn file Excel để nhập sản phẩm'}</strong>
          <span>Dữ liệu sẽ được kiểm tra trước khi lưu vào danh mục.</span>
          <input type="file" accept=".xlsx,.xls,.csv" aria-label="Chọn file Excel" disabled={busy} onChange={e => upload(e.target.files?.[0])} />
        </label>
      </section>

      {draft && (
        <>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Ghép cột dữ liệu</h2>
                <p>{draft.count} dòng · Tự nhận diện theo tên cột, có thể điều chỉnh bên dưới</p>
              </div>
              <Badge tone="blue">Bản xem trước</Badge>
            </div>
            <div className="mapping-grid">
              {draft.headers.map((header, i) => (
                <label key={i}>
                  {header || `Cột ${i + 1}`}
                  <select
                    value={mapping[i]}
                    onChange={e => {
                      const m = [...mapping];
                      m[i] = e.target.value;
                      setMapping(m);
                      setValidated(null);
                    }}
                  >
                    <option value="">Bỏ qua cột này</option>
                    {D.fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="table-wrap preview-table">
              <table>
                <thead>
                  <tr>
                    <th>Dòng</th>
                    {draft.headers.map((h, i) => <th key={i}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {draft.rows.slice(0, 10).map(row => (
                    <tr key={row.row}>
                      <td>{row.row}</td>
                      {draft.headers.map((h, i) => <td key={i}>{String(row.values[i] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel-bottom">
              <span>Hiển thị tối đa 10 dòng đầu. Kiểm tra sẽ chạy trên toàn bộ file.</span>
              <button className="primary" onClick={validate} disabled={busy}><ShieldCheck size={16} />Kiểm tra dữ liệu</button>
            </div>
          </section>

          {validated && (
            <section className="panel">
              <div className="panel-head">
                <h2>Kết quả kiểm tra</h2>
                <div className="inline-actions">
                  <Badge tone="green">{validated.filter(r => !r.errors.length).length} hợp lệ</Badge>
                  <Badge tone="red">{validated.filter(r => r.errors.length).length} dòng lỗi</Badge>
                  <Badge tone="orange">{validated.filter(r => r.duplicate).length} dòng trùng</Badge>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dòng</th>
                      <th>Mã / Tên sản phẩm</th>
                      <th>Trùng dữ liệu</th>
                      <th>Cột lỗi & nguyên nhân</th>
                      <th>Kiểm tra đơn vị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validated.slice(0, 50).map(r => (
                      <tr key={r.row}>
                        <td>{r.row}</td>
                        <td>{r.p.code}<br /><small>{r.p.name}</small></td>
                        <td>{r.duplicate ? <Badge tone="orange">Trùng {r.duplicate.code}</Badge> : '—'}</td>
                        <td className="bad-text">{r.errors.map(e => D.labels[e.field] + ': ' + e.message).join('; ') || <span className="good-text">Hợp lệ</span>}</td>
                        <td>{r.warnings.join('; ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="import-actions">
                <label>
                  Dòng bị trùng
                  <select value={mode} onChange={e => setMode(e.target.value)}>
                    <option value="skip">Bỏ qua dữ liệu trùng</option>
                    <option value="update">Cập nhật dữ liệu cũ (cần xác nhận)</option>
                    <option value="new">Tạo sản phẩm mới với mã riêng</option>
                  </select>
                </label>
                {validated.some(r => r.errors.length) && <button onClick={downloadErrors}>Tải danh sách lỗi</button>}
                <button className="primary" disabled={busy || validated.some(r => r.errors.length)} onClick={acceptCommit}>
                  <Check size={16} />Xác nhận nhập dữ liệu
                </button>
              </div>
            </section>
          )}
        </>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Lịch sử nhập dữ liệu</h2>
          <History size={20} />
        </div>
        {data.imports.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Thời gian</th>
                  <th>Người nhập</th>
                  <th>Thêm</th>
                  <th>Cập nhật</th>
                  <th>Bỏ qua</th>
                </tr>
              </thead>
              <tbody>
                {data.imports.slice().reverse().map((i, idx) => (
                  <tr key={i.id || idx}>
                    <td>{i.file}</td>
                    <td>{date(i.at)}</td>
                    <td>{i.by}</td>
                    <td>{i.added}</td>
                    <td>{i.updated}</td>
                    <td>{i.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Chưa có lần nhập nào" text="Lịch sử được lưu sau khi xác nhận nhập thành công." />
        )}
      </section>
    </>
  );
}

function Matching({ products, data, setDetail, user, state, commit, images }) {
  const [filter, setFilter] = useState('');
  const [edits, setEdits] = useState({});
  const rivals = products.filter(p => !D.own(p));
  const local = products.filter(D.own);
  const can = ['admin', 'leader', 'sales'].includes(user.role);

  async function saveMatch(pId, candidateIds) {
    const nextMatches = [
      ...(state.matches || []).filter(m => m.id !== pId),
      { id: pId, ids: candidateIds, status: candidateIds.length ? 'Đã kiểm duyệt' : 'Đã hủy', by: user.name, at: new Date().toISOString() }
    ];
    await commit({ ...state, matches: nextMatches }, 'Đã lưu ghép cặp.');
  }

  return (
    <>
      <div className="notice">
        <Info size={18} />
        <span><strong>AI đề xuất</strong> sử dụng thuật toán đối chiếu theo quy tắc, không phải mô hình nhận diện hình ảnh. Từ 50 điểm mới ghép tự động; mỗi đối thủ tối đa 3 sản phẩm.</span>
      </div>
      <div className="results-line">
        <strong>{rivals.length} sản phẩm đối thủ</strong>
        <select aria-label="Lọc ghép cặp" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option>AI đề xuất</option>
          <option>Đã kiểm duyệt</option>
          <option>Đã hủy</option>
        </select>
      </div>

      {!rivals.length ? (
        <Empty />
      ) : (
        rivals.filter(p => !filter || data.matches.find(m => m.id === p.id)?.status === filter).map(p => {
          const match = data.matches.find(m => m.id === p.id);
          const ids = edits[p.id] ?? match?.ids ?? p.matching.map(m => m.id);
          return (
            <section className="panel match-panel" key={p.id}>
              <div className="match-source">
                <ProductImage p={p} images={images} />
                <div>
                  <Badge tone="violet">{p.brand}</Badge>
                  <button className="product-title" onClick={() => setDetail(p.id)}>{p.name}</button>
                  <p>{p.code} · {p.capacity || 'Chưa rõ dung tích'} · {p.power || 'Chưa rõ công suất'}</p>
                  <Badge tone={match?.status === 'Đã kiểm duyệt' ? 'green' : 'orange'}>{match?.status || 'AI đề xuất'}</Badge>
                  {match?.by && <p className="small muted">{match.by} · {date(match.at)}</p>}
                </div>
              </div>
              <div className="match-results">
                {p.matching.length ? (
                  p.matching.map(m => {
                    const q = local.find(q => q.id === m.id);
                    if (!q) return null;
                    return (
                      <div className="match-candidate" key={q.id}>
                        <div>
                          <button className="table-product" onClick={() => setDetail(q.id)}>
                            <strong>{q.name}</strong>
                            <small>{q.code} · {m.level}</small>
                          </button>
                          <p>{m.reason}</p>
                          <details>
                            <summary>Chi tiết điểm ghép</summary>
                            <div className="criteria">
                              {m.criteria.map(c => (
                                <span key={c.label}>{c.label}<b>{c.points}/{c.max}</b></span>
                              ))}
                            </div>
                          </details>
                        </div>
                        <div className="match-score">{m.score}<small>/100</small></div>
                      </div>
                    );
                  })
                ) : (
                  <div className={'notice ' + (p.gap === 'confirmed' ? 'opportunity-notice' : '')}>
                    <AlertTriangle size={19} />
                    {p.gap === 'confirmed' ? 'LOCK&KING HIỆN CHƯA CÓ SẢN PHẨM TƯƠNG ĐƯƠNG.' : 'Dữ liệu danh mục chưa đầy đủ nên chưa thể xác định sản phẩm tương đương.'}
                  </div>
                )}

                <div className="manual-match">
                  <label>Chọn hoặc thay đổi sản phẩm tương đương (tối đa 3)</label>
                  <div className="match-checkboxes">
                    {local.map(q => (
                      <label key={q.id}>
                        <input
                          type="checkbox"
                          checked={ids.includes(q.id)}
                          disabled={!can || (!ids.includes(q.id) && ids.length >= 3)}
                          onChange={() => setEdits({ ...edits, [p.id]: ids.includes(q.id) ? ids.filter(id => id !== q.id) : [...ids, q.id] })}
                        />
                        {q.code} · {q.name}
                      </label>
                    ))}
                  </div>
                  {can && (
                    <div className="inline-actions">
                      <button className="primary" disabled={!ids.length} onClick={() => saveMatch(p.id, ids)}>
                        <Check size={16} />Xác nhận ghép cặp
                      </button>
                      <button onClick={() => { if (confirm('Hủy ghép cặp của ' + p.code + '?')) saveMatch(p.id, []); }}>
                        Hủy ghép cặp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })
      )}
    </>
  );
}

const compareGroups = {
  basic: ['brand', 'code', 'purpose'],
  specs: ['material', 'capacity', 'dimensions', 'mass', 'power', 'technology', 'features', 'accessories', 'warranty'],
  prices: ['cost', ...D.catalogPriceKeys, 'online'],
  market: ['rating', 'popularity', 'advantages', 'limitations']
};

function Comparison(c) {
  const { products, selected, toggle, user, setDetail, images } = c;
  const [show, setShow] = useState({ basic: true, specs: true, prices: true, market: true, computed: true });
  const [search, setSearch] = useState('');

  const chosen = selected.map(id => products.find(p => p.id === id)).filter(Boolean).sort((a, b) => Number(D.own(b)) - Number(D.own(a)));

  function tone(key, p) {
    const val = p[key], base = chosen[0];
    if (!D.has(val)) return 'cell-missing';
    if (!D.has(base?.[key])) return 'cell-equal';
    if (!D.own(base)) return 'cell-equal';
    const direction = ['online', 'npp', 'nppOnline', 'facebookPrice', 'marketplacePrice'].includes(key)
      ? -1
      : ['warranty', 'rating'].includes(key)
        ? 1
        : 0;
    if (!direction || p.id === base.id) return 'cell-equal';
    if (Number(base[key]) === Number(val)) return 'cell-equal';
    return (Number(base[key]) - Number(val)) * direction > 0 ? 'cell-good' : 'cell-bad';
  }

  function exportComparisonExcel() {
    const wb = XLSX.utils.book_new();
    const headers = ['Tiêu chí', ...chosen.map(p => `${p.brand} - ${p.name} (${p.code})`)];
    const data = [];

    if (show.prices) {
      data.push(['--- ĐỐI CHIẾU GIÁ CÙNG LOẠI ---', ...chosen.map(() => '')]);
      comparisonPriceGroups.filter(g => chosen.some(p => comparisonPrices(p, g).length)).forEach(g => {
        data.push([g.label, ...chosen.map(p => comparisonPrices(p, g).map(v => `${money(v.value)} (${v.label})`).join('; ') || 'Chưa có giá')]);
      });
    }

    Object.entries(compareGroups).filter(([g]) => show[g]).forEach(([g, keys]) => {
      data.push([`--- ${D.groups[g].toUpperCase()} ---`, ...chosen.map(() => '')]);
      (g === 'prices' ? populatedPriceFields(chosen).map(f => f.key) : keys)
        .filter(k => D.canFinance(user.role) || !D.privateKeys.includes(k))
        .forEach(key => {
          data.push([
            D.labels[key] || key,
            ...chosen.map(p => D.fields.find(f => f.key === key)?.type === 'money' ? money(p[key]) : (p[key] ?? 'Chưa có dữ liệu'))
          ]);
        });
    });

    if (show.computed) {
      data.push(['--- KẾT QUẢ TÍNH TOÁN ---', ...chosen.map(() => '')]);
      data.push(['Chênh lệch giá online (Lock&King - đối thủ)', ...chosen.map((p, i) => i === 0 ? 'Mốc so sánh' : (D.own(chosen[0]) && p.online > 0 && D.has(chosen[0].online) ? `${money(chosen[0].online - p.online)} (${num((chosen[0].online - p.online) / p.online * 100)}%)` : 'Chưa đủ dữ liệu'))]);
      data.push(['Điểm cạnh tranh', ...chosen.map(p => p.score?.score != null ? `${p.score.score}/100` : 'Chưa đủ dữ liệu')]);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, 'So sánh sản phẩm');
    saveFile(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), 'Bang-so-sanh-Vu-Gia.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Chọn từ 2 đến 5 sản phẩm</h2>
            <p>Lock&King được đặt trước. Dung tích và công suất chỉ đối chiếu, không mặc định lớn hơn là tốt hơn.</p>
          </div>
          <Badge tone="blue">{chosen.length}/5 đã chọn</Badge>
        </div>
        <div className="comparison-picker">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Tìm sản phẩm so sánh"
              placeholder="Tìm sản phẩm để thêm vào bảng…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="picker-items">
            {products.filter(p => D.norm(p.name + ' ' + p.code).includes(D.norm(search))).map(p => (
              <button key={p.id} className={selected.includes(p.id) ? 'picked' : ''} onClick={() => toggle(p.id)}>
                {selected.includes(p.id) ? <Check size={15} /> : <Plus size={15} />} {p.code} · {p.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {chosen.length < 2 ? (
        <Empty title="Chọn thêm sản phẩm để so sánh" text="Bảng sẽ hiển thị khi có ít nhất 2 sản phẩm." />
      ) : (
        <>
          <div className="compare-tools">
            <div className="inline-actions">
              {Object.keys(show).map(g => (
                <label key={g}>
                  <input type="checkbox" checked={show[g]} onChange={() => setShow({ ...show, [g]: !show[g] })} />
                  {D.groups[g] || 'Kết quả tính toán'}
                </label>
              ))}
            </div>
            <div className="inline-actions">
              <button className="button" onClick={exportComparisonExcel}><Download size={16} />Excel</button>
              <button onClick={() => window.print()}><Printer size={16} />In / PDF</button>
            </div>
          </div>

          <div className="comparison-legend">
            <Badge tone="green">Xanh: Lock&King có lợi thế</Badge>
            <Badge tone="red">Đỏ: Lock&King bất lợi</Badge>
            <Badge tone="orange">Vàng: tương đương / xem xét</Badge>
            <Badge>Xám: thiếu dữ liệu</Badge>
          </div>

          <div className="panel comparison-scroll">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Tiêu chí so sánh</th>
                  {chosen.map(p => (
                    <th key={p.id} className={D.own(p) ? 'own-column' : ''}>
                      <ProductImage p={p} images={images} />
                      <button className="product-title" onClick={() => setDetail(p.id)}>{p.name}</button>
                      <Badge tone={D.own(p) ? 'blue' : ''}>{p.brand}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {show.prices && (
                  <>
                    <tr className="group-row"><th colSpan={chosen.length + 1}>Đối chiếu giá cùng loại</th></tr>
                    {comparisonPriceGroups.filter(g => chosen.some(p => comparisonPrices(p, g).length)).map(g => (
                      <tr key={g.key}>
                        <th>{g.label}</th>
                        {chosen.map(p => (
                          <td key={p.id} className={comparisonPrices(p, g).length ? 'cell-equal' : 'cell-missing'}>
                            {comparisonPrices(p, g).length ? (
                              comparisonPrices(p, g).map(v => (
                                <div key={v.key}>
                                  <strong>{money(v.value)}</strong><br />
                                  <small>{v.label}</small>
                                </div>
                              ))
                            ) : (
                              'Chưa có giá loại này'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                )}

                {Object.entries(compareGroups).filter(([g]) => show[g]).map(([g, keys]) => (
                  <React.Fragment key={g}>
                    <tr className="group-row"><th colSpan={chosen.length + 1}>{D.groups[g]}</th></tr>
                    {(g === 'prices' ? populatedPriceFields(chosen).map(f => f.key) : keys)
                      .filter(k => D.canFinance(user.role) || !D.privateKeys.includes(k))
                      .map(key => (
                        <tr key={key}>
                          <th>{D.labels[key]}</th>
                          {chosen.map(p => (
                            <td className={tone(key, p)} key={p.id}>
                              {D.fields.find(f => f.key === key)?.type === 'money' ? money(p[key]) : (p[key] ?? 'Chưa có dữ liệu')}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </React.Fragment>
                ))}

                {show.computed && (
                  <>
                    <tr className="group-row"><th colSpan={chosen.length + 1}>Kết quả tính toán</th></tr>
                    <tr>
                      <th>Chênh lệch giá online<br /><small>Lock&King − đối thủ</small></th>
                      {chosen.map((p, i) => (
                        <td key={p.id}>
                          {i === 0 ? (
                            'Mốc so sánh'
                          ) : D.own(chosen[0]) && p.online > 0 && D.has(chosen[0].online) ? (
                            <>
                              {money(chosen[0].online - p.online)}<br />
                              <small>{num((chosen[0].online - p.online) / p.online * 100)}%</small>
                            </>
                          ) : (
                            'Chưa đủ dữ liệu'
                          )}
                        </td>
                      ))}
                    </tr>
                    {D.canFinance(user.role) && [['fees', 'Chi phí bán hàng / sp'], ['net', 'Lợi nhuận ròng / sp'], ['breakEven', 'Giá hòa vốn']].map(([key, label]) => (
                      <tr key={key}>
                        <th>{label}</th>
                        {chosen.map(p => <td key={p.id}>{money(p.financial?.[key])}</td>)}
                      </tr>
                    ))}
                    <tr>
                      <th>Điểm cạnh tranh</th>
                      {chosen.map(p => <td key={p.id}><Score score={p.score} /></td>)}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <p className="small muted">
            Nguồn: {chosen.map(p => p.source || 'Chưa có nguồn').filter((v, i, a) => a.indexOf(v) === i).join('; ')} · Người lập: {user.name} · {date(new Date())}
          </p>
          <div className="print-only">Phê duyệt Ban lãnh đạo: ........................................</div>
        </>
      )}
    </>
  );
}

function FinanceView({ products, user, state, commit }) {
  const [id, setId] = useState(products.find(D.own)?.id || products[0]?.id || '');
  const [values, setValues] = useState({});
  const [target, setTarget] = useState(20);

  const p = products.find(p => p.id === id);
  useEffect(() => {
    if (p) setValues({ ...p });
  }, [id, products]);

  const f = D.finance(values, Number(target));
  const inputs = ['cost', 'sale', 'platform', 'tax', 'ads', 'shipping', 'warrantyCost', 'gift', 'other', 'discount', 'returns', 'returnCost', 'quantity'];
  const scenarios = [['Thận trọng', .95, .7, 1.2, 1.3], ['Cơ sở', 1, 1, 1, 1], ['Tăng trưởng', 1.03, 1.3, .9, .8]];

  async function saveAssumptions() {
    if (!p) return;
    if (!confirm('Lưu các giả định giá và chi phí vào sản phẩm?')) return;
    const updated = { ...p, ...values, updatedAt: new Date().toISOString() };
    await commit({ ...state, products: state.products.map(x => x.id === p.id ? updated : x) }, 'Đã lưu giả định kinh doanh.');
  }

  return !products.length ? (
    <Empty />
  ) : (
    <>
      <section className="panel finance-selector">
        <label>
          Sản phẩm tính toán
          <select value={id} onChange={e => setId(e.target.value)}>
            <option value="">Chọn sản phẩm</option>
            {products.map(p => <option value={p.id} key={p.id}>{p.code} · {p.name}</option>)}
          </select>
        </label>
        <Badge tone="blue">Kịch bản chưa lưu cho đến khi xác nhận</Badge>
      </section>

      {p && (
        <>
          <div className="finance-layout">
            <section className="panel">
              <div className="panel-head">
                <h2>Giả định kinh doanh</h2>
                <SlidersHorizontal size={20} />
              </div>
              <div className="form-grid padded">
                {inputs.map(k => (
                  <label key={k}>
                    {D.labels[k]}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={values[k] ?? ''}
                      onChange={e => setValues({ ...values, [k]: e.target.value === '' ? null : Number(e.target.value) })}
                    />
                  </label>
                ))}
                <label>
                  Biên lợi nhuận ròng mục tiêu (%)
                  <input type="number" min="0" max="99" value={target} onChange={e => setTarget(e.target.value)} />
                </label>
              </div>
              <div className="panel-bottom">
                <span>Chi phí cố định: đồng trên một sản phẩm bán thành công.</span>
                <button className="primary" onClick={saveAssumptions}>Lưu giả định</button>
              </div>
            </section>

            <section className="panel finance-result">
              <div className="panel-head">
                <h2>Kết quả dự kiến</h2>
                <Wallet size={22} />
              </div>
              {f.missing?.length ? (
                <div className="padded">
                  <div className="notice">
                    <Info size={18} />
                    <div>Chưa đủ dữ liệu. Cần bổ sung: {f.missing.map(k => D.labels[k]).join(', ')}.</div>
                  </div>
                  <p className="muted">Nếu không phát sinh một khoản chi phí, hãy xác nhận bằng số 0.</p>
                </div>
              ) : f.error ? (
                <div className="notice error">{f.error}</div>
              ) : (
                <>
                  <div className="main-profit">
                    <span>Lợi nhuận ròng / sản phẩm</span>
                    <strong className={f.net >= 0 ? 'good-text' : 'bad-text'}>{money(f.net)}</strong>
                    <Badge tone={f.net >= 0 ? 'green' : 'red'}>Biên ròng {num(f.netMargin)}%</Badge>
                  </div>
                  <dl className="finance-metrics">
                    {[
                      ['Giá thực nhận sau chiết khấu', money(f.price)],
                      ['Lợi nhuận gộp', money(f.gross)],
                      ['Biên lợi nhuận gộp', num(f.margin) + '%'],
                      ['Tỷ suất lợi nhuận trên vốn', D.has(f.roi) ? num(f.roi) + '%' : 'Không xác định (giá nhập bằng 0)'],
                      ['Tổng chi phí bán hàng / sp', money(f.fees)],
                      ['Giá hòa vốn', money(f.breakEven)],
                      ['Giá bán mục tiêu (sau chiết khấu)', money(f.targetPrice)],
                      ['Số bán thành công dự kiến', num(f.delivered)],
                      ['Doanh thu dự kiến', money(f.revenue)],
                      ['Tổng chi phí và giá vốn', money(f.totalCost)],
                      ['Tổng lợi nhuận ròng', money(f.totalProfit)]
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {f.targetPrice === null && <p className="notice">Biên mục tiêu cộng tỷ lệ phí phải nhỏ hơn 100%.</p>}
                </>
              )}
            </section>
          </div>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Ba kịch bản kinh doanh</h2>
                <p>Giả định tham khảo, không phải dự báo thị trường. Tính lại ngay từ dữ liệu phía trên.</p>
              </div>
              <ChartNoAxesCombined size={22} />
            </div>
            <div className="scenario-grid">
              {scenarios.map(([name, priceFactor, quantityFactor, adsFactor, returnFactor]) => {
                const v = {
                  ...values,
                  sale: D.has(values.sale) ? values.sale * priceFactor : null,
                  quantity: D.has(values.quantity) ? Math.round(values.quantity * quantityFactor) : null,
                  ads: D.has(values.ads) ? values.ads * adsFactor : null,
                  returns: D.has(values.returns) ? Math.min(99, values.returns * returnFactor) : null
                };
                const r = D.finance(v, target);
                return (
                  <div className={'scenario ' + (name === 'Cơ sở' ? 'base' : '')} key={name}>
                    <Badge tone={name === 'Cơ sở' ? 'blue' : ''}>{name}</Badge>
                    <h3>{money(r.totalProfit)}</h3>
                    <span>Lợi nhuận ròng toàn kỳ</span>
                    <dl>
                      <div><dt>Giá bán</dt><dd>{num(priceFactor * 100)}% cơ sở</dd></div>
                      <div><dt>Số lượng</dt><dd>{num(quantityFactor * 100)}% cơ sở</dd></div>
                      <div><dt>Quảng cáo</dt><dd>{num(adsFactor * 100)}% cơ sở</dd></div>
                      <div><dt>Hoàn hàng</dt><dd>{num(v.returns)}%</dd></div>
                      <div><dt>Doanh thu</dt><dd>{money(r.revenue)}</dd></div>
                    </dl>
                  </div>
                );
              })}
            </div>
          </section>

          <details className="panel formula-note">
            <summary>Công thức và cách xử lý hoàn hàng</summary>
            <p>Giá thực nhận = Giá bán × (1 − chiết khấu). Lợi nhuận gộp = Giá thực nhận − Giá nhập.</p>
            <p>Chi phí hoàn phân bổ = Chi phí mỗi đơn hoàn × Tỷ lệ hoàn / (1 − Tỷ lệ hoàn). Chi phí cố định gồm quảng cáo, vận chuyển, bảo hành, quà tặng, chi phí khác và chi phí hoàn phân bổ.</p>
            <p>Lợi nhuận ròng = Giá thực nhận − Giá nhập − Chi phí cố định − Giá thực nhận × (Phí sàn + Thuế). Giá hòa vốn = (Giá nhập + Chi phí cố định) / (1 − Phí sàn − Thuế).</p>
            <p>Giá mục tiêu = (Giá nhập + Chi phí cố định) / (1 − Phí sàn − Thuế − Biên ròng mục tiêu). Số bán thành công = Số lượng dự kiến × (1 − Tỷ lệ hoàn).</p>
          </details>
        </>
      )}
    </>
  );
}

function Scoring({ products, data, user, setDetail, state, commit }) {
  const [weights, setWeights] = useState({ ...data.weights });
  const total = Object.values(weights).reduce((s, n) => s + Number(n), 0);

  async function saveWeights() {
    if (!confirm('Áp dụng trọng số mới cho toàn bộ danh mục?')) return;
    await commit({ ...state, weights }, 'Đã lưu trọng số cạnh tranh.');
  }

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Trọng số cạnh tranh</h2>
            <p>Điểm tổng = Σ (điểm tiêu chí / 100 × trọng số). Đánh giá định tính cần có nguồn và người cập nhật.</p>
          </div>
          <Badge tone={total === 100 ? 'green' : 'red'}>Tổng {total}/100</Badge>
        </div>
        <div className="weight-grid">
          {Object.entries(D.scoreLabels).map(([k, label]) => (
            <label key={k}>
              {label}
              <div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights[k]}
                  disabled={!['admin', 'leader'].includes(user.role)}
                  onChange={e => setWeights({ ...weights, [k]: Number(e.target.value) })}
                />
                <span>điểm</span>
              </div>
            </label>
          ))}
        </div>
        {['admin', 'leader'].includes(user.role) && (
          <div className="panel-bottom">
            <p>Thay đổi trọng số sẽ tính lại điểm của toàn bộ danh mục.</p>
            <button className="primary" disabled={total !== 100} onClick={saveWeights}>Lưu trọng số</button>
          </div>
        )}
      </section>

      <div className="notice">
        <Info size={18} />
        <span>Điểm giá: 50 + % lợi thế so với giá trung bình đối thủ tương đương, giới hạn 0–100. Điểm lợi nhuận: biên ròng 30% tương ứng 100 điểm. Các tiêu chí khác dùng đánh giá có nguồn. “Độ đầy đủ” là tỷ trọng tiêu chí có dữ liệu, không phải độ chính xác dự báo.</span>
      </div>

      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Điểm cạnh tranh</th>
              <th>Xếp loại</th>
              <th>Độ đầy đủ</th>
              <th>Dữ liệu cần bổ sung</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <button className="table-product" onClick={() => setDetail(p.id)}>
                    <strong>{p.name}</strong>
                    <small>{p.code}</small>
                  </button>
                </td>
                <td><Score score={p.score} /></td>
                <td>{p.score?.level}</td>
                <td>
                  <div className="confidence"><span style={{ width: (p.score?.confidence || 0) + '%' }} /></div>
                  <small>{p.score?.confidence || 0}%</small>
                </td>
                <td className="small">{p.score?.missing?.map(k => D.scoreLabels[k]).join(', ') || 'Đã có dữ liệu các tiêu chí'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && <Empty />}
      </section>
    </>
  );
}

function Opportunities({ products, data, user, setDetail, state, commit, images }) {
  const [filterState, setFilterState] = useState('');
  const [editing, setEditing] = useState(null);
  const gaps = products.filter(p => !D.own(p) && p.gap);
  const can = ['admin', 'leader', 'purchasing'].includes(user.role);

  async function saveOpportunity(e) {
    e.preventDefault();
    const nextOpps = [
      ...(state.opportunities || []).filter(o => o.id !== editing.productId),
      {
        id: editing.productId,
        productId: editing.productId,
        status: editing.status,
        notes: editing.notes,
        targetCost: editing.targetCost ? Number(editing.targetCost) : null,
        suggestedPrice: editing.suggestedPrice ? Number(editing.suggestedPrice) : null,
        by: user.name,
        at: new Date().toISOString()
      }
    ];
    await commit({ ...state, opportunities: nextOpps }, 'Đã cập nhật cơ hội sản phẩm.');
    setEditing(null);
  }

  return (
    <>
      <div className="stats three">
        <Stat label="Chưa có tương đương" value={gaps.filter(p => p.gap === 'confirmed').length} icon={Sparkles} tone="green" note="Danh mục có đủ thông số đối chiếu" />
        <Stat label="Cần bổ sung dữ liệu" value={gaps.filter(p => p.gap === 'incomplete').length} icon={Info} tone="orange" note="Chưa kết luận khoảng trống sản phẩm" />
        <Stat label="Đang nghiên cứu / lấy mẫu" value={data.opportunities.filter(p => ['Đang nghiên cứu', 'Đang lấy mẫu'].includes(p.status)).length} icon={Search} note="Theo trạng thái do người dùng cập nhật" />
      </div>

      <div className="results-line">
        <p>Khoảng trống được xác định trong phạm vi danh mục hiện có.</p>
        <select aria-label="Trạng thái cơ hội" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {D.opportunityStates.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {gaps.length ? (
        <div className="opportunity-grid">
          {gaps.filter(p => !filterState || (data.opportunities.find(o => o.id === p.id)?.status || 'Mới phát hiện') === filterState).map(p => {
            const o = data.opportunities.find(o => o.id === p.id);
            const enough = D.has(p.demand) && D.has(p.inventoryRisk) && D.has(p.assessmentSource);
            const opportunityScore = enough ? Math.round(p.demand * .6 + (100 - p.inventoryRisk) * .4) : null;
            return (
              <section className="panel opportunity-card" key={p.id}>
                <ProductImage p={p} images={images} />
                <div className="opportunity-body">
                  <div className="inline-actions">
                    <Badge tone={p.gap === 'confirmed' ? 'green' : 'orange'}>
                      {p.gap === 'confirmed' ? 'Chưa có tương đương' : 'Chưa thể xác định'}
                    </Badge>
                    <Badge>{o?.status || 'Mới phát hiện'}</Badge>
                  </div>
                  <button className="product-title" onClick={() => setDetail(p.id)}>{p.name}</button>
                  <p>{p.brand} · {p.category}</p>
                  <p className="small muted">{[p.capacity, p.power, p.material, p.features].filter(Boolean).join(' · ')}</p>
                  <dl>
                    <div><dt>Giá online / phân khúc</dt><dd>{money(p.online)}</dd></div>
                    <div><dt>Mức độ phổ biến</dt><dd>{p.popularity || 'Chưa có dữ liệu'}</dd></div>
                    <div><dt>Thương hiệu cùng nhóm</dt><dd>{new Set(products.filter(q => !D.own(q) && q.category === p.category).map(q => q.brand)).size}</dd></div>
                    {D.canFinance(user.role) && (
                      <>
                        <div><dt>Giá nhập mục tiêu</dt><dd>{money(o?.targetCost)}</dd></div>
                        <div><dt>Giá bán đề xuất</dt><dd>{money(o?.suggestedPrice)}</dd></div>
                        <div><dt>Lợi nhuận gộp mục tiêu</dt><dd>{D.has(o?.targetCost) && D.has(o?.suggestedPrice) ? money(o.suggestedPrice - o.targetCost) : 'Chưa đủ dữ liệu'}</dd></div>
                        <div><dt>Lợi nhuận ròng mục tiêu</dt><dd>{money(D.finance({ ...p, cost: o?.targetCost, sale: o?.suggestedPrice }).net)}</dd></div>
                      </>
                    )}
                    <div><dt>Điểm cơ hội / ưu tiên</dt><dd>{opportunityScore === null ? 'Chưa đủ dữ liệu' : `${opportunityScore}/100 · ${opportunityScore >= 80 ? 'Cao' : opportunityScore >= 60 ? 'Trung bình' : 'Thấp'}`}</dd></div>
                    <div><dt>Rủi ro tồn kho</dt><dd>{D.has(p.inventoryRisk) ? p.inventoryRisk + '/100' : 'Chưa có dữ liệu'}</dd></div>
                  </dl>
                  <p className="small">
                    {p.gap === 'confirmed'
                      ? 'Lý do: chưa tìm thấy Lock&King đạt ngưỡng tương đồng 50 điểm trong danh mục đủ thông số.'
                      : 'Bổ sung dữ liệu danh mục trước khi đề xuất nhập.'}
                  </p>
                  {o?.notes && <p className="notice">{o.notes}</p>}
                  {can && (
                    <button onClick={() => setEditing({ productId: p.id, status: o?.status || 'Mới phát hiện', notes: o?.notes || '', targetCost: o?.targetCost ?? '', suggestedPrice: o?.suggestedPrice ?? '' })}>
                      Cập nhật cơ hội <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Empty title="Chưa phát hiện khoảng trống sản phẩm" text="Các đối thủ hiện có đều có ứng viên tương đương hoặc danh mục còn trống." />
      )}

      {editing && (
        <div className="modal-backdrop">
          <form className="modal compact" onSubmit={saveOpportunity}>
            <div className="modal-head">
              <h2>Cập nhật cơ hội</h2>
              <IconButton icon={X} label="Đóng" onClick={() => setEditing(null)} />
            </div>
            <div className="padded form-grid">
              <label className="span-2">
                Trạng thái
                <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}>
                  {D.opportunityStates.filter(s => s !== 'Đã duyệt nhập' || ['admin', 'leader'].includes(user.role)).map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>Giá nhập mục tiêu<input type="number" min="0" value={editing.targetCost} onChange={e => setEditing({ ...editing, targetCost: e.target.value })} /></label>
              <label>Giá bán đề xuất<input type="number" min="0" value={editing.suggestedPrice} onChange={e => setEditing({ ...editing, suggestedPrice: e.target.value })} /></label>
              <label className="span-2">Ghi chú, rủi ro và nguồn đánh giá<textarea rows={4} value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></label>
            </div>
            <div className="modal-foot">
              <button type="button" onClick={() => setEditing(null)}>Hủy</button>
              <button className="primary">Lưu cập nhật</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Proposals({ products, data, user, setDetail, state, commit }) {
  const [filter, setFilter] = useState('');
  const list = products.filter(D.own).filter(p => !filter || (data.proposals.find(q => q.id === p.id)?.status || 'Chưa gửi') === filter);

  async function updateProposal(pId, status, notes = '') {
    const nextProposals = [
      ...(state.proposals || []).filter(q => q.id !== pId),
      { id: pId, productId: pId, status, notes, by: user.name, at: new Date().toISOString() }
    ];
    await commit({ ...state, proposals: nextProposals }, 'Đã cập nhật trạng thái đề xuất.');
  }

  return (
    <>
      <div className="notice">
        <ShieldCheck size={19} />
        <span>Đề xuất chỉ kết luận khi đủ dữ liệu về điểm cạnh tranh, lợi nhuận, vòng quay vốn và rủi ro tồn kho. Ban lãnh đạo hoặc quản trị viên phê duyệt nhập hàng.</span>
      </div>
      <div className="results-line">
        <strong>{list.length} sản phẩm</strong>
        <select aria-label="Trạng thái đề xuất" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option>Chưa gửi</option>
          <option>Chờ phê duyệt</option>
          <option>Đã duyệt nhập</option>
          <option>Từ chối</option>
        </select>
      </div>

      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Điểm</th>
              <th>Đề xuất & căn cứ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => {
              const proposal = data.proposals.find(q => q.id === p.id);
              return (
                <tr key={p.id}>
                  <td>
                    <button className="table-product" onClick={() => setDetail(p.id)}>
                      <strong>{p.name}</strong>
                      <small>{p.code}</small>
                    </button>
                  </td>
                  <td><Score score={p.score} /></td>
                  <td className="recommendation-cell">
                    <Badge tone={p.recommendation?.pending ? 'orange' : 'blue'}>
                      {p.recommendation?.label || 'Xem với quyền tài chính'}
                    </Badge>
                    <p className="small muted">{p.recommendation?.reason || 'Chi tiết giá vốn và đánh giá nhập hàng chỉ dành cho bộ phận có quyền.'}</p>
                  </td>
                  <td>
                    <Badge tone={proposal?.status === 'Đã duyệt nhập' ? 'green' : ''}>
                      {proposal?.status || 'Chưa gửi'}
                    </Badge>
                    {proposal && <p className="small muted">{proposal.by}<br />{date(proposal.at)}</p>}
                  </td>
                  <td>
                    <div className="stack-actions">
                      {['admin', 'leader', 'sales', 'purchasing'].includes(user.role) && (
                        <button onClick={() => updateProposal(p.id, 'Chờ phê duyệt')}>Gửi đề xuất</button>
                      )}
                      {['leader', 'admin'].includes(user.role) && (
                        <>
                          <button className="primary" disabled={p.recommendation?.pending} onClick={() => { if (confirm('Phê duyệt nhập ' + p.code + '?')) updateProposal(p.id, 'Đã duyệt nhập'); }}>
                            Duyệt nhập
                          </button>
                          <button onClick={() => { const notes = prompt('Lý do từ chối đề xuất:'); if (notes !== null) updateProposal(p.id, 'Từ chối', notes); }}>
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <Empty />}
      </section>
    </>
  );
}

function Reports({ products, user, data }) {
  const [kind, setKind] = useState('comparison');
  const [category, setCategory] = useState('');
  const [conclusion, setConclusion] = useState('Đánh giá theo dữ liệu và trọng số tại thời điểm lập báo cáo.');
  const [suggestion, setSuggestion] = useState('Bổ sung dữ liệu còn thiếu và xác minh nguồn trước khi quyết định nhập hàng.');

  const kinds = {
    comparison: 'So sánh sản phẩm',
    category: 'Danh mục theo nhóm sản phẩm',
    prices: 'Giá Lock&King và đối thủ',
    profit: 'Lợi nhuận dự kiến',
    score: 'Điểm cạnh tranh',
    opportunities: 'Cơ hội sản phẩm mới',
    proposals: 'Đề xuất nhập hàng',
    missing: 'Dữ liệu còn thiếu',
    history: 'Lịch sử thay đổi giá'
  };

  let list = products.filter(p => !category || p.category === category);
  if (kind === 'opportunities') list = list.filter(p => p.gap);
  if (kind === 'proposals') list = list.filter(p => data.proposals.some(q => q.id === p.id));
  if (kind === 'missing') list = list.filter(p => p.score?.missing?.length || p.dataMissing?.length);

  function exportReportExcel() {
    const wb = XLSX.utils.book_new();
    const visible = D.fields.filter(f => D.canFinance(user.role) || !D.privateKeys.includes(f.key));
    const rows = list.map(q => {
      const out = Object.fromEntries(visible.map(f => [f.label, q[f.key] ?? '']));
      out['Điểm cạnh tranh'] = q.score?.score ?? 'Chưa đủ dữ liệu';
      out['Độ đầy đủ (%)'] = q.score?.confidence;
      out['Ngày cập nhật'] = q.updatedAt;
      out['Nguồn dữ liệu'] = q.source || 'Chưa có';
      if (D.canFinance(user.role)) {
        out['Lợi nhuận ròng / sp'] = q.financial?.net ?? 'Chưa đủ dữ liệu';
        out['Giá hòa vốn'] = q.financial?.breakEven ?? '';
        out['Đề xuất'] = q.recommendation?.label || '';
      }
      return out;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Sản phẩm');
    const meta = [
      ['VŨ GIA — BÁO CÁO ' + kinds[kind].toUpperCase()],
      ['Ngày lập', new Date().toISOString()],
      ['Người lập', user.name],
      ['Số sản phẩm', list.length],
      ['Kết luận', conclusion],
      ['Đề xuất hành động', suggestion]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meta), 'Thông tin báo cáo');
    saveFile(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), `Bao-cao-Vu-Gia-${kind}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  return (
    <>
      <section className="panel report-controls">
        <div className="form-grid">
          <label>
            Loại báo cáo
            <select value={kind} onChange={e => setKind(e.target.value)}>
              {Object.entries(kinds).filter(([k]) => k !== 'profit' || D.canFinance(user.role)).map(([k, l]) => (
                <option value={k} key={k}>{l}</option>
              ))}
            </select>
          </label>
          <label>
            Nhóm sản phẩm
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Toàn bộ nhóm hàng</option>
              {[...new Set(products.map(p => p.category))].filter(Boolean).map(v => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="span-2">Kết luận<textarea value={conclusion} onChange={e => setConclusion(e.target.value)} /></label>
          <label className="span-2">Đề xuất hành động<textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} /></label>
        </div>
        <div className="inline-actions">
          <button className="button" onClick={exportReportExcel}><FileSpreadsheet size={17} />Xuất Excel</button>
          <button className="primary" onClick={() => window.print()}><Printer size={17} />In / Lưu PDF</button>
        </div>
      </section>

      <section className="report-document">
        <div className="report-heading">
          <div className="brand">
            <div className="logo-mark">V</div>
            <div><strong>VŨ GIA</strong><span>SO SÁNH SẢN PHẨM · V2</span></div>
          </div>
          <div>
            <small>Ngày lập: {date(new Date())}</small>
            <small>Người lập: {user.name}</small>
          </div>
        </div>
        <h2>BÁO CÁO {kinds[kind].toLocaleUpperCase('vi-VN')}</h2>
        <p>Phạm vi: {category || 'Toàn bộ nhóm hàng'} · {list.length} sản phẩm</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Thương hiệu</th>
                {kind === 'history' ? (
                  <>
                    <th>Thời gian / người sửa</th>
                    <th>Thay đổi</th>
                  </>
                ) : (
                  <>
                    <th>Giá online</th>
                    <th>{kind === 'profit' ? 'Lợi nhuận ròng' : kind === 'opportunities' ? 'Phân loại' : 'Điểm cạnh tranh'}</th>
                    <th>Nhận định / Dữ liệu thiếu</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {kind === 'history' ? (
                list.flatMap(p => (p.priceHistory || []).map((h, i) => (
                  <tr key={p.id + i}>
                    <td>{p.code}</td>
                    <td>{p.brand}</td>
                    <td>{date(h.at)} · {h.by}</td>
                    <td>{h.changes.map(c => `${D.labels[c.field]}: ${c.before ?? '—'} → ${c.after ?? '—'}`).join('; ')}</td>
                  </tr>
                )))
              ) : (
                list.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong><br /><small>{p.code}</small></td>
                    <td>{p.brand}</td>
                    <td>{money(p.online)}</td>
                    <td>{kind === 'profit' ? money(p.financial?.net) : kind === 'opportunities' ? (p.gap === 'confirmed' ? 'Chưa có tương đương' : 'Chưa đủ dữ liệu') : (p.score?.score ?? 'Chưa đủ dữ liệu')}</td>
                    <td>{kind === 'proposals' ? data.proposals.find(q => q.id === p.id)?.status : kind === 'missing' ? [...(p.dataMissing || []).map(k => D.labels[k]), ...(p.score?.missing || []).map(k => D.scoreLabels[k])].join(', ') : p.recommendation?.reason || p.score?.level}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <h3>Nguồn dữ liệu</h3>
        <p>{[...new Set(list.map(p => p.source || 'Chưa có nguồn xác minh'))].join('; ') || 'Chưa có dữ liệu'}</p>
        <h3>Kết luận</h3>
        <p>{conclusion}</p>
        <h3>Đề xuất hành động</h3>
        <p>{suggestion}</p>
        <div className="signatures">
          <div>NGƯỜI LẬP BÁO CÁO<br /><br /><strong>{user.name}</strong></div>
          <div>PHÊ DUYỆT BAN LÃNH ĐẠO<br /><small>(Ký, ghi rõ họ tên)</small><br /><br />........................................</div>
        </div>
      </section>
    </>
  );
}

function Admin({ user, setUser, state, commit, notify, brands, products }) {
  const [tab, setTab] = useState('backup');

  function backup() {
    const payload = {
      format: 'vugia-offline',
      version: 1,
      at: new Date().toISOString(),
      products: state.products,
      brands: state.brands,
      images: state.images,
      matches: state.matches,
      weights: state.weights,
      opportunities: state.opportunities,
      proposals: state.proposals,
      follows: state.follows,
      imports: state.imports
    };
    saveFile(JSON.stringify(payload, null, 2), 'Vu-Gia-sao-luu-' + new Date().toISOString().slice(0, 10) + '.json', 'application/json');
    notify('Đã tạo tệp sao lưu gồm toàn bộ sản phẩm, giá và ảnh.');
  }

  async function restore(file) {
    if (!file) return;
    try {
      const b = JSON.parse(await file.text());
      if (b.format !== 'vugia-offline' || b.version !== 1 || !Array.isArray(b.products)) {
        throw Error('Tệp sao lưu không đúng định dạng chuẩn của Vũ Gia.');
      }
      if (!confirm(`Khôi phục ${b.products.length} sản phẩm từ bản sao lưu? Dữ liệu hiện tại trên trình duyệt sẽ được thay thế.`)) return;
      await commit({
        products: b.products,
        brands: b.brands || state.brands,
        images: b.images || state.images,
        matches: b.matches || [],
        weights: b.weights || D.defaultWeights,
        opportunities: b.opportunities || [],
        proposals: b.proposals || [],
        follows: b.follows || [],
        imports: b.imports || []
      }, 'Khôi phục dữ liệu thành công.');
    } catch (e) {
      notify('Lỗi khôi phục: ' + e.message);
    }
  }

  function exportAllBrandsExcel() {
    const wb = XLSX.utils.book_new(), used = new Set();
    for (const b of brands) {
      const rows = products.filter(p => brandKey(p.brand) === b.key);
      const sh = XLSX.utils.aoa_to_sheet([
        D.fields.map(f => f.label),
        ...rows.map(p => D.fields.map(f => String(p[f.key] ?? '').startsWith('data:image/') ? 'Ảnh lưu trong bản sao lưu JSON' : p[f.key] ?? ''))
      ]);
      sh['!cols'] = D.fields.map(f => ({ wch: f.key === 'name' ? 45 : 22 }));
      XLSX.utils.book_append_sheet(wb, sh, sheetName(b.name, used));
    }
    saveFile(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), 'Vu-Gia-Moi-Hang-Mot-Sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  return (
    <>
      <div className="tabs admin-tabs">
        <button className={tab === 'backup' ? 'active' : ''} onClick={() => setTab('backup')}>Sao lưu & Khôi phục</button>
        <button className={tab === 'role' ? 'active' : ''} onClick={() => setTab('role')}>Chuyển đổi vai trò</button>
        <button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>Quyền theo bộ phận</button>
      </div>

      {tab === 'backup' && (
        <div className="panels">
          <section className="panel padded">
            <h2>Sao lưu dữ liệu và hình ảnh</h2>
            <p>Dữ liệu được lưu trữ trực tiếp trên trình duyệt này qua IndexedDB. Hãy tải bản sao lưu JSON định kỳ để giữ an toàn hoặc chuyển sang máy khác.</p>
            <div className="inline-actions" style={{ marginTop: 15 }}>
              <button className="primary" onClick={backup}><Download size={16} />Tải bản sao lưu JSON</button>
              <label className="button">
                <Upload size={16} />Khôi phục từ file JSON
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => { restore(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </div>
          </section>

          <section className="panel padded">
            <h2>Xuất bảng giá Excel toàn bộ hãng</h2>
            <p>Xuất danh mục toàn bộ {brands.length} hãng với cấu trúc mỗi hãng một sheet riêng biệt, tương thích chuẩn Vũ Gia.</p>
            <div className="inline-actions" style={{ marginTop: 15 }}>
              <button className="button" onClick={exportAllBrandsExcel}><FileSpreadsheet size={16} />Xuất tất cả hãng (.xlsx)</button>
            </div>
          </section>
        </div>
      )}

      {tab === 'role' && (
        <section className="panel padded">
          <h2>Chuyển đổi vai trò làm việc</h2>
          <p>Trên bản HTML chạy trực tiếp, bạn có thể chuyển vai trò để kiểm tra giao diện và phân quyền theo từng bộ phận.</p>
          <div className="form-grid" style={{ maxWidth: 400, marginTop: 15 }}>
            <label>
              Vai trò hiện tại
              <select value={user.role} onChange={e => setUser({ ...user, role: e.target.value, name: D.roles[e.target.value] })}>
                {Object.entries(D.roles).map(([k, v]) => <option value={k} key={k}>{v}</option>)}
              </select>
            </label>
          </div>
        </section>
      )}

      {tab === 'rules' && (
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bộ phận</th>
                <th>Quyền chính</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Ban lãnh đạo', 'Xem toàn bộ, giá nhập, trọng số, phê duyệt đề xuất.'],
                ['Phòng Kinh doanh', 'Xem danh mục và giá bán, cập nhật giá thị trường, ghép cặp, so sánh và báo cáo. Không xem giá nhập.'],
                ['Phòng Marketing', 'Cập nhật hình ảnh, nội dung và liên kết; xem danh mục và tạo nội dung tư vấn. Không xem giá nhập.'],
                ['Bộ phận Mua hàng', 'Cập nhật nhà cung cấp, giá nhập, MOQ, giao hàng, lấy mẫu; theo dõi cơ hội và gửi đề xuất.'],
                ['Quản trị viên', 'Quản lý toàn bộ dữ liệu, tài khoản, danh mục và nhật ký.']
              ].map(([a, b]) => (
                <tr key={a}>
                  <td><strong>{a}</strong></td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

const initialSeed = () => window.VUGIA_SEED || { products: [], brands: initialBrands.map(name => ({ name })), images: {} };

async function boot() {
  let state, storageError;
  try {
    state = await readStorage();
    if (!state || !state.products?.length) {
      const seed = initialSeed();
      state = {
        products: seed.products || [],
        brands: seed.brands || initialBrands.map(name => ({ name })),
        images: seed.images || {},
        matches: seed.matches || [],
        weights: seed.weights || D.defaultWeights,
        opportunities: seed.opportunities || [],
        proposals: seed.proposals || [],
        follows: seed.follows || [],
        imports: seed.imports || []
      };
      await writeStorage(state);
    }
  } catch (e) {
    const seed = initialSeed();
    state = {
      products: seed.products || [],
      brands: seed.brands || initialBrands.map(name => ({ name })),
      images: seed.images || {},
      matches: [],
      weights: D.defaultWeights,
      opportunities: [],
      proposals: [],
      follows: [],
      imports: []
    };
    storageError = 'Trình duyệt chưa bật lưu IndexedDB: ' + e.message;
  }

  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(<App loaded={state} storageError={storageError} />);
  }
}

boot().catch(e => {
  const rootEl = document.getElementById('root');
  if (rootEl) rootEl.textContent = 'Không mở được phần mềm: ' + e.message;
});

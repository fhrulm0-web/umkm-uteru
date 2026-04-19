// ===== DATA =====
var API_BASE = (function () {
  if (window.location.protocol === 'file:') return 'http://localhost:8080/api';
  return window.location.protocol + '//' + window.location.hostname + ':8080/api';
})();
var VARIANTS = ['Gula Putih', 'Aren', 'Sirup'];

var DEFAULT_PRODUCTS = [
  { id: 1, name: 'Es Kelapa Plastik', image: '/images/es-kelapa-plastik.jpg', desc: 'Pilih varian', price: 6000, category: 'Minuman', icon: '🥥', hasVariant: true },
  { id: 2, name: 'Es Kelapa Cup Kecil', image: '/images/es-kelapa-cup-kecil.jpg', desc: 'Pilih varian', price: 6000, category: 'Minuman', icon: '🥤', hasVariant: true },
  { id: 3, name: 'Es Kelapa Cup Besar', image: '/images/es-kelapa-cup-besar.jpg', desc: 'Pilih varian', price: 10000, category: 'Minuman', icon: '🥤', hasVariant: true },
  { id: 4, name: 'Es Jeruk Cup Besar', image: '/images/es-jeruk-cup-besar.jpg', desc: 'Segar dingin', price: 10000, category: 'Minuman', icon: '🍊' },
  { id: 5, name: 'Es Jeruk Cup Kecil', image: '/images/es-jeruk-cup-kecil.jpg', desc: 'Segar dingin', price: 5000, category: 'Minuman', icon: '🍊' },
  { id: 6, name: 'Es Teh Cup Besar', image: '/images/es-teh-cup-besar.jpg', desc: 'Teh manis dingin', price: 5000, category: 'Minuman', icon: '🍵' },
  { id: 7, name: 'Es Teh Cup Kecil', image: '/images/es-teh-cup-kecil.jpg', desc: 'Teh manis dingin', price: 3000, category: 'Minuman', icon: '🍵' },
  { id: 21, name: 'Pentol Kuah', image: '/images/pentol-kuah.jpg', desc: 'Staff input harga', price: 0, category: 'Makanan', icon: '🍢', isCustomPrice: true, packName: 'Plastik', pcsPerPack: 60, trackStock: true },
  { id: 22, name: 'Pentol', image: '/images/pentol.jpg', desc: 'Staff input harga', price: 0, category: 'Makanan', icon: '🍡', isCustomPrice: true, packName: 'Plastik', pcsPerPack: 60, trackStock: true },
  { id: 23, name: 'Pentol Goreng', image: '/images/pentol-goreng.jpg', desc: 'Staff input harga', price: 0, category: 'Makanan', icon: '🍡', isCustomPrice: true, packName: 'Plastik', pcsPerPack: 20, trackStock: true },
  { id: 24, name: 'Pentol Telur', image: '/images/pentol-telur.jpg', desc: 'Staff input harga', price: 0, category: 'Makanan', icon: '🥚', isCustomPrice: true, packName: 'Plastik', pcsPerPack: 40, trackStock: true },
  { id: 25, name: 'Sempol', image: '/images/sempol.jpg', desc: 'Staff input harga', price: 0, category: 'Makanan', icon: '🍢', isCustomPrice: true, packName: 'Plastik', pcsPerPack: 30, trackStock: true },
  { id: 26, name: 'Tahu Isi', image: '/images/tahu-isi.jpg', desc: 'Staff input harga', price: 0, category: 'Makanan', icon: '🧆', isCustomPrice: true, packName: 'Plastik', pcsPerPack: 25, trackStock: true },
  { id: 27, name: 'Siomay', image: '/images/siomay.jpg', desc: 'Staff input harga', price: 0, category: 'Makanan', icon: '🥟', isCustomPrice: true, packName: 'Plastik', pcsPerPack: 16, trackStock: true },
  { id: 28, name: 'Pentol Besar', image: '/images/pentol-besar.jpg', desc: 'Staff input harga', price: 0, category: 'Makanan', icon: '🍡', isCustomPrice: true, packName: 'Plastik', pcsPerPack: 8, trackStock: true },
  { id: 30, name: 'Kelapa Bijian', image: '/images/kelapa-bijian.jpg', desc: 'Harga custom', price: 0, category: 'Minuman', icon: '🥥', isCustomPrice: true },

];
var PRODUCTS = DEFAULT_PRODUCTS.slice();
var POS_HISTORY = [];
var STOCK_LOGS = [];
var isAppReady = false;
var isSyncing = false;
var syncMessage = 'Sinkronisasi data...';

var CATEGORIES = ['Semua', 'Minuman', 'Makanan'];
var CAT_ICONS = { 'Semua': '🏷️', 'Minuman': '🥤', 'Makanan': '🍡' };
function getStockProducts() { return PRODUCTS.filter(function (p) { return p.trackStock; }); }
function findProduct(id) { for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === id) return PRODUCTS[i]; } return null; }
function findDefaultProduct(id) { for (var i = 0; i < DEFAULT_PRODUCTS.length; i++) { if (DEFAULT_PRODUCTS[i].id === id) return DEFAULT_PRODUCTS[i]; } return null; }
// ===== STATE & DATA =====
var cart = [];
var currentCategory = 'Semua';
var currentPage = 'pos';
var searchQuery = '';
var selectedPayment = 'CASH';
var currentUser = JSON.parse(localStorage.getItem('pos_current_user') || 'null');
var reportFilterDate = formatDateOnly(new Date());

function getMasterStock(productId) {
  var product = findProduct(productId);
  var current = product && !isNaN(parseInt(product.currentStockPcs)) ? parseInt(product.currentStockPcs) : 0;
  var usedPcs = 0;
  var today = todayStr();
  var morning = null;
  var night = null;

  for (var i = 0; i < STOCK_LOGS.length; i++) {
    var log = STOCK_LOGS[i];
    if (log.productId === productId && log.day === today) {
      if (log.shift === 'morning') morning = log.totalPcs;
      if (log.shift === 'night') night = log.totalPcs;
    }
  }
  if (morning != null && night != null && morning > night) usedPcs = morning - night;
  return { current: current, base: current, used: usedPcs };
}

function renderLoadingState() {
  return '<div class="empty-state" style="padding-top:120px"><div class="empty-icon">ðŸ”—</div><p>' + syncMessage + '</p></div>';
}

function setSyncing(flag, message) {
  isSyncing = flag;
  if (message) syncMessage = message;
}

function formatDateOnly(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

async function apiFetch(path, options) {
  var response = await fetch(API_BASE + path, options || {});
  var text = await response.text();
  if (!response.ok) {
    throw new Error(text || ('HTTP ' + response.status));
  }
  if (!text) return null;
  var contentType = response.headers.get('content-type') || '';
  if (contentType.indexOf('application/json') !== -1) {
    return JSON.parse(text);
  }
  return text;
}

function normalizeProduct(product) {
  var fallback = findDefaultProduct(product.id) || {};
  return {
    id: product.id,
    name: product.name || fallback.name || '',
    image: fallback.image || '',
    desc: product.description || fallback.desc || '',
    price: Number(product.price || fallback.price || 0),
    category: (product.category && product.category.name) || fallback.category || 'Lainnya',
    icon: product.icon || fallback.icon || '',
    hasVariant: !!fallback.hasVariant,
    isCustomPrice: product.isCustomPrice != null ? product.isCustomPrice : !!fallback.isCustomPrice,
    packName: product.packName || fallback.packName || null,
    pcsPerPack: Number(product.pcsPerPack || fallback.pcsPerPack || 1),
    trackStock: product.trackStock != null ? product.trackStock : !!fallback.trackStock,
    currentStockPcs: Number(product.currentStockPcs || 0)
  };
}

function normalizeTransaction(tx) {
  return {
    dbId: tx.id,
    id: tx.transactionCode || ('TX-' + tx.id),
    date: tx.transactionDate,
    method: tx.paymentMethod,
    total: Number(tx.totalAmount || 0),
    items: (tx.details || []).map(function (detail) {
      var fallbackName = detail.product && detail.product.name ? detail.product.name : 'Produk';
      return {
        id: detail.product && detail.product.id ? detail.product.id : null,
        name: detail.productName || fallbackName,
        qty: Number(detail.quantity || 0),
        price: Number(detail.priceAtTime || 0)
      };
    }),
    cashier: tx.cashierName || '-'
  };
}

function normalizeStockLogs(logs, day) {
  var normalized = [];
  for (var i = 0; i < logs.length; i++) {
    var item = logs[i];
    var product = item.product || {};
    var pcsPerPack = Number(product.pcsPerPack || 1);
    if (item.morningStock != null) {
      normalized.push({
        day: day,
        date: item.createdAt || new Date().toISOString(),
        product: product.name,
        productId: product.id,
        shift: 'morning',
        packs: Math.floor(item.morningStock / pcsPerPack),
        loose: item.morningStock % pcsPerPack,
        totalPcs: item.morningStock,
        pcsPerPack: pcsPerPack,
        staff: item.morningStaffName || ''
      });
    }
    if (item.nightStock != null) {
      normalized.push({
        day: day,
        date: item.updatedAt || new Date().toISOString(),
        product: product.name,
        productId: product.id,
        shift: 'night',
        packs: Math.floor(item.nightStock / pcsPerPack),
        loose: item.nightStock % pcsPerPack,
        totalPcs: item.nightStock,
        pcsPerPack: pcsPerPack,
        staff: item.nightStaffName || ''
      });
    }
  }
  return normalized;
}

function updateCachedProduct(product) {
  var normalized = normalizeProduct(product);
  var found = false;
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === normalized.id) {
      PRODUCTS[i] = normalized;
      found = true;
      break;
    }
  }
  if (!found) PRODUCTS.push(normalized);
}

async function loadProductsFromServer() {
  var data = await apiFetch('/master/products');
  var seen = {};
  var normalized = [];
  for (var i = 0; i < data.length; i++) {
    var product = normalizeProduct(data[i]);
    if (seen[product.id]) continue;
    seen[product.id] = true;
    normalized.push(product);
  }
  PRODUCTS = normalized;
}

async function loadTransactionsFromServer(from, to) {
  var data = await apiFetch('/pos/transactions?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to));
  POS_HISTORY = data.map(normalizeTransaction).sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });
}

async function loadStockLogsFromServer(date) {
  var data = await apiFetch('/pos/stock/logs?date=' + encodeURIComponent(date));
  STOCK_LOGS = normalizeStockLogs(data, date);
}

function getReportRange() {
  var now = new Date();
  if (reportTab === 'daily') return { from: reportFilterDate, to: reportFilterDate };
  if (reportTab === 'weekly') {
    var weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    return { from: formatDateOnly(weekStart), to: formatDateOnly(now) };
  }
  return { from: formatDateOnly(new Date(now.getFullYear(), now.getMonth(), 1)), to: formatDateOnly(now) };
}

async function refreshCurrentPageData() {
  if (currentPage === 'report') {
    var range = getReportRange();
    await loadTransactionsFromServer(range.from, range.to);
    if (reportTab === 'daily' && isOwner()) await loadStockLogsFromServer(reportFilterDate);
    else STOCK_LOGS = [];
    return;
  }

  if (currentPage === 'stock') {
    await loadProductsFromServer();
    await loadStockLogsFromServer(todayStr());
    return;
  }

  await loadProductsFromServer();
}

async function syncPageData(message) {
  setSyncing(true, message || 'Sinkronisasi data...');
  render();
  try {
    await refreshCurrentPageData();
    isAppReady = true;
  } catch (err) {
    if (!isAppReady) isAppReady = true;
    console.error(err);
  } finally {
    setSyncing(false);
    render();
  }
}

async function bootstrapApp() {
  await syncPageData('Memuat data produk dari database...');
}

// ===== PROFILES =====
var DEFAULT_PROFILES = [
  { id: 'owner', name: 'Owner', role: 'owner', avatar: '👑', pin: 'admin123' },
  { id: 'staff1', name: 'Bu Rani', role: 'staff', avatar: '👩', pin: '1234' },
  { id: 'staff2', name: 'Nadya', role: 'staff', avatar: '👧', pin: '1234' },
];
function getProfiles() {
  var saved = JSON.parse(localStorage.getItem('pos_profiles') || 'null');
  if (!saved) { localStorage.setItem('pos_profiles', JSON.stringify(DEFAULT_PROFILES)); return DEFAULT_PROFILES; }

  var changed = false;
  if (!saved[0].pin) { saved[0].pin = 'admin123'; changed = true; }
  if (saved[1] && (!saved[1].pin || saved[1].name === 'Staff 1')) { saved[1].name = 'Bu Rani'; saved[1].avatar = '👩'; saved[1].pin = '1234'; changed = true; }
  if (saved[2] && (!saved[2].pin || saved[2].name === 'Staff 2')) { saved[2].name = 'Nadya'; saved[2].avatar = '👧'; saved[2].pin = '1234'; changed = true; }
  if (changed) localStorage.setItem('pos_profiles', JSON.stringify(saved));
  return saved;
}
function isOwner() { return currentUser && currentUser.role === 'owner'; }

function showLoginScreen() {
  var profiles = getProfiles();
  var cards = '';
  for (var i = 0; i < profiles.length; i++) {
    var p = profiles[i];
    cards += '<div class="login-card" onclick="promptLogin(\'' + p.id + '\')">' +
      '<div class="login-avatar">' + p.avatar + '</div>' +
      '<div class="login-name">' + p.name + '</div>' +
      '<div class="login-role">' + (p.role === 'owner' ? 'Owner' : 'Staff') + '</div></div>';
  }
  document.getElementById('app').innerHTML = '<div class="login-page">' +
    '<div class="login-header"><div class="login-logo">🏪</div><h1>POS Uteru F&B</h1><p>Pilih akun untuk masuk</p></div>' +
    '<div class="login-grid">' + cards + '</div></div>';
}

function promptLogin(id) {
  var profiles = getProfiles();
  var p = null;
  for (var i = 0; i < profiles.length; i++) { if (profiles[i].id === id) p = profiles[i]; }
  if (!p) return;

  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'login-pin-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('login-pin-modal') };
  var defPin = p.role === 'owner' ? 'admin123' : '1234';

  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div>' +
    '<div style="text-align:center;font-size:3rem;margin-bottom:8px">' + p.avatar + '</div>' +
    '<h2 style="margin-top:0">Masuk sebagai ' + p.name + '</h2>' +
    '<p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-bottom:16px">Password default: ' + defPin + '</p>' +
    '<div class="form-row"><input type="password" id="login-pin-input" placeholder="••••••••" style="text-align:center;font-size:1.5rem;letter-spacing:6px;padding:12px;" /></div>' +
    '<div id="login-pin-error" style="color:var(--danger);text-align:center;font-size:0.85rem;display:none;margin-top:-8px;margin-bottom:16px">❌ Password salah!</div>' +
    '<div class="btn-row"><button class="btn btn-outline" onclick="closeModal(\'login-pin-modal\')">Kembali</button>' +
    '<button class="btn btn-primary" onclick="verifyPin(\'' + id + '\', \'' + p.pin + '\')">🔓 Login</button></div></div>';
  document.body.appendChild(o);

  setTimeout(function () {
    var pi = document.getElementById('login-pin-input');
    if (pi) {
      pi.focus();
      pi.onkeydown = function (e) { if (e.key === 'Enter') verifyPin(id, p.pin); };
    }
  }, 100);
}

function verifyPin(id, correctPin) {
  var val = document.getElementById('login-pin-input').value;
  if (val === correctPin) {
    closeModal('login-pin-modal');
    loginAs(id);
  } else {
    document.getElementById('login-pin-error').style.display = 'block';
  }
}

function loginAs(id) {
  var profiles = getProfiles();
  for (var i = 0; i < profiles.length; i++) { if (profiles[i].id === id) { currentUser = profiles[i]; break; } }
  localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
  currentPage = 'pos';
  render();
  syncPageData('Menyambungkan akun ke database...');
}
function logout() { currentUser = null; localStorage.removeItem('pos_current_user'); showLoginScreen(); }

// ===== HELPERS =====
function rp(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function cartTotal() { return cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0); }
function cartCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
function formatCurrency(input) {
  var raw = input.value.replace(/\D/g, '');
  if (!raw) { input.value = ''; input.setAttribute('data-raw', ''); return; }
  input.value = parseInt(raw).toLocaleString('id-ID');
  input.setAttribute('data-raw', raw);
}
function getRawValue(id) {
  var el = document.getElementById(id);
  if (!el) return 0;
  return parseInt((el.getAttribute('data-raw') || el.value).replace(/\D/g, '')) || 0;
}
function formatPlastikPcs(totalPcs, pcsPerPack) {
  if (!pcsPerPack || pcsPerPack <= 1) return totalPcs + ' pcs';
  var isNeg = totalPcs < 0;
  var absTotal = Math.abs(totalPcs);
  var pl = Math.floor(absTotal / pcsPerPack), si = absTotal % pcsPerPack, parts = [];
  if (pl > 0) parts.push(pl + ' plastik');
  if (si > 0) parts.push(si + ' pcs');
  var res = parts.length ? parts.join(' + ') : '0';
  return isNeg ? '-' + res : res;
}
function todayStr() { return formatDateOnly(new Date()); }
function getFilteredProducts() {
  var list = PRODUCTS;
  if (currentCategory !== 'Semua') list = list.filter(function (p) { return p.category === currentCategory; });
  if (searchQuery) { var q = searchQuery.toLowerCase(); list = list.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1; }); }
  var unique = [];
  var seen = {};
  for (var i = 0; i < list.length; i++) {
    var key = String(list[i].id);
    if (seen[key]) continue;
    seen[key] = true;
    unique.push(list[i]);
  }
  list = unique;
  return list;
}

// ===== RENDER =====
function render() {
  if (!currentUser) { showLoginScreen(); return; }
  var app = document.getElementById('app');
  if (!isAppReady && isSyncing) { app.innerHTML = renderLoadingState(); return; }
  if (currentPage === 'pos') app.innerHTML = renderPOS() + renderBottomNav();
  else if (currentPage === 'stock') app.innerHTML = (isOwner() ? renderOwnerStockPage() : renderStaffStockPage()) + renderBottomNav();
  else if (currentPage === 'report') app.innerHTML = renderReportPage() + renderBottomNav();
  else if (currentPage === 'profile') app.innerHTML = renderProfilePage() + renderBottomNav();
}
function updateProductGrid() {
  var g = document.getElementById('product-grid'), t = document.getElementById('section-title');
  if (!g) return;
  var f = getFilteredProducts();
  if (t) t.textContent = currentCategory === 'Semua' ? 'SEMUA PRODUK' : currentCategory.toUpperCase();
  if (!f.length) { g.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Produk tidak ditemukan</p></div>'; return; }
  var h = ''; for (var i = 0; i < f.length; i++) h += renderProductCard(f[i]); g.innerHTML = h;
}

// ===== POS PAGE =====
function renderPOS() {
  var f = getFilteredProducts(), cl = currentCategory === 'Semua' ? 'SEMUA PRODUK' : currentCategory.toUpperCase();
  var ct = '';
  for (var i = 0; i < CATEGORIES.length; i++) {
    var c = CATEGORIES[i];
    ct += '<button class="cat-tab ' + (currentCategory === c ? 'active' : '') + '" onclick="setCategory(\'' + c + '\')">' +
      '<span class="tab-icon">' + CAT_ICONS[c] + '</span>' + c + '</button>';
  }
  var ph = '';
  if (!f.length) ph = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Produk tidak ditemukan</p></div>';
  else { ph = '<div class="product-grid" id="product-grid">'; for (var j = 0; j < f.length; j++) ph += renderProductCard(f[j]); ph += '</div>'; }
  return '<div class="page-enter"><div class="app-header"><div class="header-left">' +
    '<div class="header-greeting">Halo, ' + currentUser.name + ' ' + currentUser.avatar + '</div>' +
    '<div class="header-title">POS Uteru F&B</div></div><div class="header-right">' +
    '<button class="icon-btn" onclick="openCartModal()">🛒' + (cartCount() ? '<span class="badge">' + cartCount() + '</span>' : '') + '</button></div></div>' +
    '<div class="search-bar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
    '<input type="text" id="search-input" placeholder="Cari produk..." value="' + searchQuery + '" oninput="handleSearch(this.value)" /></div>' +
    '<div class="category-tabs">' + ct + '</div><div class="section-title" id="section-title">' + cl + '</div>' + ph +
    (cart.length ? renderBottomCart() : '') + '</div>';
}
function renderProductCard(p) {
  var dImg = p.image ? '<img src="' + p.image + '" alt="' + p.name + '" class="real-product-img" onerror="this.style.display=\'none\'" />' + p.icon : p.icon;
  if (p.isCustomPrice) return '<div class="product-card" id="card-' + p.id + '"><div class="product-img">' + dImg + '</div><div class="product-body"><div class="product-name">' + p.name + '</div><div class="product-desc">' + p.desc + '</div><div class="custom-input-group"><div class="custom-input-row"><input type="text" id="cprice-' + p.id + '" placeholder="Harga (Rp)" inputmode="numeric" oninput="formatCurrency(this)" onclick="event.stopPropagation()" /></div><button class="custom-add-full-btn" onclick="event.stopPropagation(); addCustomToCart(' + p.id + ')">+ Tambah</button></div></div></div>';
  if (p.hasVariant) return '<div class="product-card" onclick="openVariantModal(' + p.id + ')"><div class="product-img">' + dImg + '</div><div class="product-body"><div class="product-name">' + p.name + '</div><div class="product-desc">Pilih varian & jumlah</div><div class="product-footer"><span class="product-price">' + rp(p.price) + '</span><button class="add-btn">...</button></div></div></div>';
  return '<div class="product-card" onclick="addToCart(' + p.id + ')"><div class="product-img">' + dImg + '</div><div class="product-body"><div class="product-name">' + p.name + '</div><div class="product-desc">' + (p.desc || '') + '</div><div class="product-footer"><span class="product-price">' + rp(p.price) + '</span><button class="add-btn">+</button></div></div></div>';
}
function renderBottomCart() {
  return '<div class="bottom-cart"><div class="cart-info"><div class="cart-count">' + cartCount() + ' item</div><div class="cart-total">' + rp(cartTotal()) + '</div></div><button class="checkout-btn" onclick="openCartModal()">Lihat Keranjang</button></div>';
}

// ===== VARIANT MODAL =====
var variantQty = 1, selectedVariant = 'Gula Putih';
function openVariantModal(id) {
  closeModal('variant-modal'); variantQty = 1; selectedVariant = 'Gula Putih';
  var p = findProduct(id); if (!p) return;
  var vb = ''; for (var v = 0; v < VARIANTS.length; v++) vb += '<button class="variant-pill ' + (v === 0 ? 'active' : '') + '" onclick="selectVariant(this,\'' + VARIANTS[v] + '\')">' + VARIANTS[v] + '</button>';
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'variant-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('variant-modal') };
  o.innerHTML = '<div class="modal-sheet variant-sheet"><div class="handle"></div><div class="variant-header"><span class="variant-icon">' + p.icon + '</span><div><h2 style="text-align:left;margin:0">' + p.name + '</h2><p style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">' + rp(p.price) + ' per pcs</p></div></div><div class="form-row"><label>Pilih Varian</label><div class="variant-pills">' + vb + '</div></div><div class="form-row"><label>Jumlah</label><div class="qty-selector"><button class="qty-btn-lg" onclick="changeVariantQty(-1)">-</button><span class="qty-display" id="variant-qty">1</span><button class="qty-btn-lg" onclick="changeVariantQty(1)">+</button></div></div><button class="btn btn-primary btn-block" onclick="addVariantToCart(' + id + ')" style="margin-top:16px">+ Tambah - ' + rp(p.price) + '</button></div>';
  document.body.appendChild(o);
}
function selectVariant(el, v) { selectedVariant = v; var ps = document.querySelectorAll('.variant-pill'); for (var i = 0; i < ps.length; i++) ps[i].classList.remove('active'); el.classList.add('active'); }
function changeVariantQty(d) { variantQty = Math.max(1, variantQty + d); document.getElementById('variant-qty').textContent = variantQty; }
function addVariantToCart(id) {
  var p = findProduct(id); if (!p) return;
  var key = id + '-' + selectedVariant, name = p.name + ' (' + selectedVariant + ')';
  var ex = null; for (var j = 0; j < cart.length; j++) { if (cart[j].cartKey === key) { ex = cart[j]; break; } }
  if (ex) ex.qty += variantQty; else cart.push({ id: p.id, name: name, price: p.price, qty: variantQty, cartKey: key });
  closeModal('variant-modal'); selectedVariant = 'Gula Putih'; variantQty = 1; render();
}

// ===== ACTIONS =====
function setCategory(c) { currentCategory = c; render(); }
function handleSearch(v) { searchQuery = v; updateProductGrid(); }
function navigate(p) { currentPage = p; render(); syncPageData('Memuat data terbaru...'); }
function addToCart(id) {
  var p = findProduct(id); if (!p || p.isCustomPrice || p.hasVariant) return;
  var ex = null; for (var j = 0; j < cart.length; j++) { if (cart[j].id === id && !cart[j].cartKey) { ex = cart[j]; break; } }
  if (ex) ex.qty++; else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 }); render();
}
function addCustomToCart(id) {
  var p = findProduct(id); if (!p) return;
  var price = getRawValue('cprice-' + id);
  if (!price || price <= 0) { alert('Masukkan harga yang valid!'); return; }
  var key = id + '-' + price;
  var ex = null; for (var j = 0; j < cart.length; j++) { if (cart[j].cartKey === key) { ex = cart[j]; break; } }
  if (ex) ex.qty++; else cart.push({ id: p.id, name: p.name, price: price, qty: 1, cartKey: key });
  var el = document.getElementById('cprice-' + id); if (el) { el.value = ''; el.setAttribute('data-raw', ''); } render();
}

// ===== CART MODAL =====
function openCartModal() {
  if (!cart.length) { alert('Keranjang masih kosong!'); return; }
  closeModal('cart-modal');
  var ih = ''; for (var i = 0; i < cart.length; i++) {
    var it = cart[i];
    ih += '<div class="cart-item-row"><div class="cart-item-info"><div class="cart-item-name">' + it.name + '</div><div class="cart-item-price">' + rp(it.price) + ' x ' + it.qty + ' = ' + rp(it.price * it.qty) + '</div></div><div class="cart-item-qty"><button class="qty-btn" onclick="changeQty(' + i + ',-1)">-</button><span class="qty-num">' + it.qty + '</span><button class="qty-btn" onclick="changeQty(' + i + ',1)">+</button></div></div>';
  }
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'cart-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('cart-modal') };
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><h2>🛒 Keranjang</h2>' + ih +
    '<div class="total-row"><span class="total-label">TOTAL</span><span class="total-value">' + rp(cartTotal()) + '</span></div>' +
    '<h2 style="margin-top:24px">Pembayaran</h2><div class="payment-options">' +
    '<div class="payment-opt ' + (selectedPayment === 'CASH' ? 'selected' : '') + '" onclick="selectPayment(this,\'CASH\')"><div class="pay-icon">💵</div><div class="pay-label">Cash</div></div>' +
    '<div class="payment-opt ' + (selectedPayment === 'TRANSFER' ? 'selected' : '') + '" onclick="selectPayment(this,\'TRANSFER\')"><div class="pay-icon">🏦</div><div class="pay-label">Transfer</div></div>' +
    '<div class="payment-opt ' + (selectedPayment === 'QRIS' ? 'selected' : '') + '" onclick="selectPayment(this,\'QRIS\')"><div class="pay-icon">📱</div><div class="pay-label">QRIS</div></div></div>' +
    '<div class="btn-row"><button class="btn btn-outline" onclick="closeModal(\'cart-modal\')">Batal</button><button class="btn btn-primary" onclick="processCheckout()">Bayar ' + rp(cartTotal()) + '</button></div></div>';
  document.body.appendChild(o);
}
function selectPayment(el, m) { selectedPayment = m; var os = document.querySelectorAll('.payment-opt'); for (var i = 0; i < os.length; i++) os[i].classList.remove('selected'); el.classList.add('selected'); }
function changeQty(i, d) { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1); closeModal('cart-modal'); render(); if (cart.length) openCartModal(); }

async function processCheckout() {
  var total = cartTotal();
  if (!cart.length) return;
  var pfx = currentUser.id === 'staff1' ? 'Staff 1 ' : (currentUser.id === 'staff2' ? 'Staff 2 ' : 'Staff ');
  var cName = currentUser.role === 'owner' ? currentUser.name : pfx + '(' + currentUser.name + ')';
  try {
    var savedTx = await apiFetch('/pos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethod: selectedPayment,
        cashierName: cName,
        totalAmount: total,
        amountPaid: total,
        changeAmount: 0,
        details: cart.map(function (it) {
          return {
            product: it.id ? { id: it.id } : null,
            productName: it.name,
            quantity: it.qty,
            priceAtTime: it.price,
            subtotal: it.price * it.qty
          };
        })
      })
    });
    POS_HISTORY.unshift(normalizeTransaction(savedTx));
  } catch (e) {
    console.error(e);
    alert('Transaksi gagal disimpan ke database. Pastikan backend aktif lalu coba lagi.');
    return;
  }
  var txId = savedTx && savedTx.transactionCode ? savedTx.transactionCode : '-';
  closeModal('cart-modal');
  var ov = document.createElement('div'); ov.className = 'success-overlay'; ov.id = 'success-overlay';
  ov.innerHTML = '<div class="check-icon">✅</div><h2>Transaksi Berhasil!</h2><p>' + rp(total) + ' via ' + selectedPayment + '</p><p style="font-size:0.75rem;opacity:0.7;margin-top:8px">' + txId + ' - ' + currentUser.name + '</p>';
  document.body.appendChild(ov); cart = []; selectedPayment = 'CASH';
  setTimeout(function () { var el = document.getElementById('success-overlay'); if (el) el.remove(); render(); }, 2500);
}

// ===== RECEIPT =====
function openReceipt(index) {
  closeModal('receipt-modal');
  var tx = POS_HISTORY[index]; if (!tx) return;
  var d = new Date(tx.date);
  var ds = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var ts = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  var ih = ''; for (var j = 0; j < tx.items.length; j++) {
    var it = tx.items[j];
    ih += '<div class="receipt-item"><div class="receipt-item-left"><span class="receipt-item-name">' + it.name + '</span><span class="receipt-item-detail">' + it.qty + ' x ' + rp(it.price) + '</span></div><span class="receipt-item-total">' + rp(it.price * it.qty) + '</span></div>';
  }
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'receipt-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('receipt-modal') };
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><div class="receipt-header"><div class="receipt-logo">🧾</div><h2 style="margin:0">RESI PENJUALAN</h2><p class="receipt-id">' + (tx.id || '-') + '</p></div>' +
    '<div class="receipt-meta"><div class="receipt-meta-row"><span>Tanggal</span><span>' + ds + '</span></div><div class="receipt-meta-row"><span>Waktu</span><span>' + ts + '</span></div><div class="receipt-meta-row"><span>Kasir</span><span>' + (tx.cashier || '-') + '</span></div><div class="receipt-meta-row"><span>Pembayaran</span><span class="receipt-badge">' + (tx.method === 'CASH' ? '💵' : tx.method === 'QRIS' ? '📱' : '🏦') + ' ' + tx.method + '</span></div></div>' +
    '<div class="receipt-divider"></div><div class="receipt-items">' + ih + '</div><div class="receipt-divider"></div>' +
    '<div class="receipt-total-section"><div class="receipt-total-row"><span>Total</span><span class="receipt-grand-total">' + rp(tx.total) + '</span></div></div>' +
    '<div class="btn-row" style="margin-top:20px">' +
    '<button class="btn btn-outline" onclick="closeModal(\'receipt-modal\')" style="flex:1">Tutup</button>' +
    '<button class="btn btn-danger" onclick="voidTransaction(' + index + ')" style="flex:1">🗑️ Hapus</button>' +
    '</div></div>';
  document.body.appendChild(o);
}

async function voidTransaction(index) {
  if (!confirm('Yakin ingin membatalkan/menghapus transaksi ini? (Uang akan dibatalkan)')) return;
  var tx = POS_HISTORY[index];
  if (!tx || !tx.dbId) return;
  try {
    await apiFetch('/pos/transactions/' + tx.dbId, { method: 'DELETE' });
    POS_HISTORY.splice(index, 1);
    closeModal('receipt-modal');
    render();
  } catch (e) {
    console.error(e);
    alert('Transaksi gagal dihapus dari database.');
  }
}

// ===== STOCK: STAFF VIEW (Shift Pagi/Malam) =====
function renderStaffStockPage() {
  var today = todayStr();
  var ml = STOCK_LOGS.filter(function (s) { return s.day === today && s.shift === 'morning'; });
  var nl = STOCK_LOGS.filter(function (s) { return s.day === today && s.shift === 'night'; });

  return '<div class="stock-page page-enter"><div class="app-header"><div><div class="header-greeting">Inventaris</div><div class="header-title">📦 Stok Harian</div></div></div>' +
    '<div class="stock-action-buttons"><button class="btn btn-primary" onclick="openStockModal(\'morning\')" style="flex:1">☀️ Stok Pagi</button>' +
    '<button class="btn btn-outline" onclick="openStockModal(\'night\')" style="flex:1">🌙 Stok Malam</button></div>' +
    '<div class="section-title">☀️ Shift Pagi</div>' + (ml.length ? renderStockList(ml) : '<div class="empty-state" style="padding:20px"><p>Belum dicatat</p></div>') +
    '<div class="section-title" style="margin-top:20px">🌙 Shift Malam</div>' + (nl.length ? renderStockList(nl) : '<div class="empty-state" style="padding:20px"><p>Belum dicatat</p></div>') +
    '</div>';
}

// ===== STOCK PAGE (Owner) =====
function renderOwnerStockPage() {
  var sp = getStockProducts();
  var masterHtml = '';
  for (var i = 0; i < sp.length; i++) {
    var p = sp[i];
    var ms = getMasterStock(p.id);
    var qty = ms.current;

    masterHtml += '<div class="stock-card"><div class="stock-info">' +
      '<div class="stock-name">' + p.icon + ' ' + p.name + '</div>' +
      '<div class="stock-detail">Stok: ' + formatPlastikPcs(qty, p.pcsPerPack) + ' (' + qty + ' pcs)' +
      (ms.used > 0 ? ' <span style="font-size:0.7em;color:gray;">| ' + ms.used + ' pcs dipakai</span>' : '') +
      '</div></div>' +
      '<button class="add-btn" onclick="openAddMasterStock(' + p.id + ',' + qty + ')">✏️</button></div>';
  }

  // Staff shift hari ini
  var today = todayStr();
  var ml = STOCK_LOGS.filter(function (s) { return s.day === today && s.shift === 'morning'; });
  var nl = STOCK_LOGS.filter(function (s) { return s.day === today && s.shift === 'night'; });
  var shiftHtml = '';
  if (ml.length || nl.length) {
    shiftHtml = '<div class="section-title" style="margin-top:24px">👥 Laporan Shift Staff Hari Ini</div>';
    if (ml.length) { shiftHtml += '<p style="padding:0 20px;font-size:0.78rem;color:var(--text-muted);margin-bottom:8px">☀️ Shift Pagi</p>' + renderStockList(ml); }
    if (nl.length) { shiftHtml += '<p style="padding:0 20px;font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;margin-top:12px">🌙 Shift Malam</p>' + renderStockList(nl); }
  }

  return '<div class="stock-page page-enter"><div class="app-header"><div><div class="header-greeting">Owner</div><div class="header-title">📦 Manajemen Stok</div></div></div>' +
    '<div class="section-title">📊 Stok Keseluruhan</div>' + masterHtml + shiftHtml + '</div>';
}

function openAddMasterStock(productId, currentQty) {
  closeModal('master-stock-modal');
  var p = findProduct(productId); if (!p) return;
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'master-stock-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('master-stock-modal') };
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><h2>' + p.icon + ' ' + p.name + '</h2>' +
    '<p style="text-align:center;font-size:0.78rem;color:var(--text-muted)">Stok saat ini: ' + formatPlastikPcs(currentQty, p.pcsPerPack) + ' (' + currentQty + ' pcs)</p>' +
    '<div class="form-row" style="margin-top:16px"><label>Tambah Stok (plastik)</label><input type="number" id="add-master-pack" placeholder="0" min="0" /></div>' +
    '<div class="form-row"><label>Tambah Stok (pcs lepas)</label><input type="number" id="add-master-loose" placeholder="0" min="0" /></div>' +
    '<div class="form-row"><label>Atau set total pcs manual</label><input type="number" id="set-master-total" placeholder="Kosongkan jika tambah" min="0" /></div>' +
    '<div class="btn-row"><button class="btn btn-outline" onclick="closeModal(\'master-stock-modal\')">Batal</button>' +
    '<button class="btn btn-primary" onclick="saveMasterStock(' + productId + ',' + p.pcsPerPack + ',' + currentQty + ')">💾 Simpan</button></div></div>';
  document.body.appendChild(o);
}

async function saveMasterStock(productId, pcsPerPack, currentQty) {
  var setTotal = parseInt(document.getElementById('set-master-total').value);
  var setTotalFilled = document.getElementById('set-master-total').value !== "";
  var addPack = parseInt(document.getElementById('add-master-pack').value) || 0;
  var addLoose = parseInt(document.getElementById('add-master-loose').value) || 0;

  if (!setTotalFilled && (addPack * pcsPerPack + addLoose) === 0) { alert('Masukkan jumlah stok!'); return; }

  try {
    var updatedProduct = await apiFetch('/pos/stock/master', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: productId,
        addPackQuantity: addPack,
        addLoosePcsQuantity: addLoose,
        setTotalPcs: setTotalFilled ? setTotal : null
      })
    });
    updateCachedProduct(updatedProduct);
    closeModal('master-stock-modal');
    render();
  } catch (e) {
    console.error(e);
    alert('Stok master gagal disimpan ke database.');
  }
}

// ===== STOCK MODAL (Staff batch input) =====
function openStockModal(shift) {
  closeModal('stock-modal');
  var sp = getStockProducts(), today = todayStr();
  var ih = '';
  for (var i = 0; i < sp.length; i++) {
    var p = sp[i], existing = null;
    for (var k = 0; k < STOCK_LOGS.length; k++) { if (STOCK_LOGS[k].productId === p.id && STOCK_LOGS[k].shift === shift && STOCK_LOGS[k].day === today) { existing = STOCK_LOGS[k]; break; } }
    ih += '<div class="stock-input-row"><div class="stock-input-label"><span class="stock-input-icon">' + p.icon + '</span><div><div class="stock-input-name">' + p.name + '</div><div class="stock-input-info">1 plastik = ' + p.pcsPerPack + ' pcs' + (existing ? ' (sudah diisi)' : '') + '</div></div></div>' +
      '<div class="stock-input-fields"><div class="stock-field"><input type="number" id="spack-' + p.id + '" placeholder="0" min="0" value="' + (existing ? existing.packs : '') + '" /><span class="stock-field-label">plastik</span></div>' +
      '<div class="stock-field"><input type="number" id="sloose-' + p.id + '" placeholder="0" min="0" value="' + (existing ? existing.loose : '') + '" /><span class="stock-field-label">pcs lepas</span></div></div></div>';
  }
  var sl = shift === 'morning' ? '☀️ Stok Awal (Pagi)' : '🌙 Stok Sisa (Malam)';
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'stock-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('stock-modal') };
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><h2>' + sl + '</h2><p style="text-align:center;font-size:0.78rem;color:var(--text-muted);margin-bottom:20px">' +
    (shift === 'morning' ? 'Catat stok yang disiapkan hari ini.' : 'Catat stok tersisa di akhir hari.') + '</p>' + ih +
    '<div class="btn-row" style="margin-top:24px"><button class="btn btn-outline" onclick="closeModal(\'stock-modal\')">Batal</button><button class="btn btn-primary" onclick="submitBatchStock(\'' + shift + '\')">💾 Simpan</button></div></div>';
  document.body.appendChild(o);
}

async function submitBatchStock(shift) {
  var sp = getStockProducts();
  var hasData = false;

  try {
    for (var i = 0; i < sp.length; i++) {
      var p = sp[i];
      var packEl = document.getElementById('spack-' + p.id);
      var looseEl = document.getElementById('sloose-' + p.id);
      var isBlank = packEl.value === '' && looseEl.value === '';
      if (isBlank) continue;

      var packs = parseInt(packEl.value) || 0;
      var loose = parseInt(looseEl.value) || 0;
      hasData = true;

      await apiFetch('/pos/stock/' + shift, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: p.id,
          packQuantity: packs,
          loosePcsQuantity: loose,
          staffName: currentUser.name
        })
      });
    }

    if (!hasData) { alert('Masukkan minimal satu stok untuk disimpan.'); return; }

    await loadProductsFromServer();
    await loadStockLogsFromServer(todayStr());
    closeModal('stock-modal');
    alert('Stok ' + (shift === 'morning' ? 'Pagi' : 'Malam') + ' berhasil disimpan ke database.');
    render();
  } catch (e) {
    console.error(e);
    alert('Stok gagal disimpan ke database. Cek input stok pagi/malam lalu coba lagi.');
  }
}

function renderStockList(logs) {
  var h = ''; for (var i = 0; i < logs.length; i++) {
    var s = logs[i], pp = s.pcsPerPack || 1, tp = s.totalPcs || (s.packs * pp + s.loose);
    h += '<div class="stock-card"><div class="stock-info"><div class="stock-name">' + s.product + '</div>' +
      '<div class="stock-detail">' + formatPlastikPcs(tp, pp) + ' (' + tp + ' pcs)' + (s.staff ? ' - ' + s.staff : '') + '</div></div></div>';
  }
  return h;
}

// ===== REPORT PAGE =====
var reportTab = 'daily';
function setReportTab(t) { reportTab = t; render(); syncPageData('Memuat laporan...'); }
function setReportDate(v) { reportFilterDate = v; render(); syncPageData('Memuat laporan harian...'); }

function renderReportPage() {
  var hist = POS_HISTORY;
  var now = new Date(), filtered = [];

  if (reportTab === 'daily') {
    filtered = hist.filter(function (h) { return h.date.startsWith(reportFilterDate); });
  } else if (reportTab === 'weekly') {
    var wa = new Date(now - 7 * 864e5);
    filtered = hist.filter(function (h) { return new Date(h.date) >= wa; });
  } else {
    var ms = new Date(now.getFullYear(), now.getMonth(), 1);
    filtered = hist.filter(function (h) { return new Date(h.date) >= ms; });
  }

  var totalRev = 0, mc = { CASH: 0, TRANSFER: 0, QRIS: 0 };
  for (var i = 0; i < filtered.length; i++) { totalRev += filtered[i].total; mc[filtered[i].method] = (mc[filtered[i].method] || 0) + 1; }
  var avg = filtered.length ? Math.round(totalRev / filtered.length) : 0;

  // Menu Paling Laris
  var menuMap = {};
  for (var f = 0; f < filtered.length; f++) {
    for (var g = 0; g < filtered[f].items.length; g++) {
      var it = filtered[f].items[g];
      var key = (it.name || 'Produk').trim();
      if (!menuMap[key]) menuMap[key] = { name: key, qty: 0, revenue: 0 };
      menuMap[key].qty += it.qty;
      menuMap[key].revenue += it.qty * it.price;
    }
  }
  var menuList = [];
  for (var mk in menuMap) { if (menuMap.hasOwnProperty(mk)) menuList.push(menuMap[mk]); }
  menuList.sort(function (a, b) { return b.qty - a.qty; });
  var topMenu = menuList.slice(0, 5);

  var topMenuHtml = '';
  if (topMenu.length) {
    topMenuHtml = '<div class="section-title" style="padding:0;margin:20px 0 12px">🏆 Menu Paling Laris</div>';
    for (var tm = 0; tm < topMenu.length; tm++) {
      var m = topMenu[tm];
      var medal = tm === 0 ? '🥇' : tm === 1 ? '🥈' : tm === 2 ? '🥉' : (tm + 1) + '.';
      topMenuHtml += '<div class="report-row"><div class="report-row-left"><div class="report-row-name">' + medal + ' ' + m.name + '</div>' +
        '<div class="report-row-sub">' + m.qty + ' terjual</div></div>' +
        '<div class="report-row-right"><div class="report-row-value">' + rp(m.revenue) + '</div></div></div>';
    }
  }

  // Stok Terpakai (owner, daily)
  var stockHtml = '';
  if (reportTab === 'daily' && isOwner()) {
    var ml = STOCK_LOGS.filter(function (s) { return s.day === reportFilterDate && s.shift === 'morning'; });
    var nl = STOCK_LOGS.filter(function (s) { return s.day === reportFilterDate && s.shift === 'night'; });
    var diffs = [];
    for (var k = 0; k < ml.length; k++) {
      var mg = ml[k], ng = null;
      for (var j2 = 0; j2 < nl.length; j2++) { if (nl[j2].productId === mg.productId) { ng = nl[j2]; break; } }
      if (ng) diffs.push({ product: mg.product, used: (mg.totalPcs || 0) - (ng.totalPcs || 0), pcsPerPack: mg.pcsPerPack || 1, morning: mg.totalPcs, night: ng.totalPcs });
    }
    if (diffs.length) {
      stockHtml = '<div class="section-title" style="padding:0;margin:20px 0 12px">📦 Stok Terpakai</div>';
      for (var d = 0; d < diffs.length; d++) {
        var df = diffs[d];
        stockHtml += '<div class="report-row clickable" onclick="showStockDetail(' + df.morning + ',' + df.night + ',' + df.used + ',' + df.pcsPerPack + ',\'' + df.product.replace(/'/g, "\\'") + '\')">' +
          '<div class="report-row-left"><div class="report-row-name">' + df.product + '</div><div class="report-row-sub">Terpakai: ' + formatPlastikPcs(df.used, df.pcsPerPack) + '</div></div>' +
          '<div class="report-row-right"><div class="stock-diff used">-' + df.used + '</div><div class="report-row-arrow">></div></div></div>';
      }
    }
  }

  // Transaction list
  var lh = '';
  if (!filtered.length) lh = '<div class="empty-state"><div class="empty-icon">📋</div><p>Belum ada transaksi ' + (reportTab === 'daily' ? 'pada tanggal ini' : '') + '</p></div>';
  else {
    for (var r = 0; r < filtered.length; r++) {
      var h = filtered[r], di = new Date(h.date);
      var time = di.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      var ds = di.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      var sum = h.items.map(function (x) { return x.qty + 'x ' + (x.name || 'Produk'); }).join(', ');
      if (sum.length > 35) sum = sum.substring(0, 35) + '...';
      var ri = hist.indexOf(h);
      lh += '<div class="report-row clickable" onclick="openReceipt(' + ri + ')"><div class="report-row-left"><div class="report-row-name">' + sum + '</div><div class="report-row-sub">' + ds + ' ' + time + ' - ' + h.method + (h.cashier ? ' - ' + h.cashier : '') + '</div></div><div class="report-row-right"><div class="report-row-value">' + rp(h.total) + '</div><div class="report-row-arrow">></div></div></div>';
    }
  }

  // Stats (owner only)
  var statsHtml = '';
  if (isOwner()) {
    statsHtml = '<div class="stat-cards">' +
      '<div class="stat-card highlight"><div class="stat-icon">💰</div><div class="stat-label">Total Pendapatan</div><div class="stat-value">' + rp(totalRev) + '</div></div>' +
      '<div class="stat-card"><div class="stat-icon">🧾</div><div class="stat-label">Jumlah Transaksi</div><div class="stat-value">' + filtered.length + '</div></div>' +
      '<div class="stat-card"><div class="stat-icon">📈</div><div class="stat-label">Rata-rata / Trx</div><div class="stat-value">' + rp(avg) + '</div></div>' +
      '<div class="stat-card"><div class="stat-icon">💳</div><div class="stat-label">QRIS / TF / Cash</div><div class="stat-value">' + mc.QRIS + ' / ' + mc.TRANSFER + ' / ' + mc.CASH + '</div></div></div>';
  }

  // Date filter for daily
  var dateFilterHtml = '';
  if (reportTab === 'daily') {
    dateFilterHtml = '<div class="date-filter"><input type="date" value="' + reportFilterDate + '" onchange="setReportDate(this.value)" /><span class="date-filter-label">' +
      new Date(reportFilterDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '</span></div>';
  }

  return '<div class="report-page page-enter"><div class="app-header"><div><div class="header-greeting">Laporan</div><div class="header-title">📊 Ringkasan Penjualan</div></div></div>' +
    '<div class="report-tabs"><button class="report-tab ' + (reportTab === 'daily' ? 'active' : '') + '" onclick="setReportTab(\'daily\')">Harian</button><button class="report-tab ' + (reportTab === 'weekly' ? 'active' : '') + '" onclick="setReportTab(\'weekly\')">Mingguan</button><button class="report-tab ' + (reportTab === 'monthly' ? 'active' : '') + '" onclick="setReportTab(\'monthly\')">Bulanan</button></div>' +
    dateFilterHtml + statsHtml + topMenuHtml + stockHtml +
    '<div class="section-title" style="padding:0;margin:20px 0 12px">Riwayat Transaksi</div><div class="report-list">' + lh + '</div></div>';
}

function showStockDetail(morning, night, used, pcsPerPack, product) {
  closeModal('stock-detail-modal');
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'stock-detail-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('stock-detail-modal') };
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><h2>📦 ' + product + '</h2><div class="receipt-meta">' +
    '<div class="receipt-meta-row"><span>Stok Pagi</span><span>' + formatPlastikPcs(morning, pcsPerPack) + ' (' + morning + ' pcs)</span></div>' +
    '<div class="receipt-meta-row"><span>Stok Malam</span><span>' + formatPlastikPcs(night, pcsPerPack) + ' (' + night + ' pcs)</span></div>' +
    '<div class="receipt-meta-row"><span><strong>Terpakai</strong></span><span><strong>' + formatPlastikPcs(used, pcsPerPack) + ' (' + used + ' pcs)</strong></span></div>' +
    '<div class="receipt-meta-row"><span>1 Plastik</span><span>' + pcsPerPack + ' pcs</span></div></div>' +
    '<button class="btn btn-outline btn-block" onclick="closeModal(\'stock-detail-modal\')" style="margin-top:16px">Tutup</button></div>';
  document.body.appendChild(o);
}

// ===== PROFILE =====
function renderProfilePage() {
  return '<div class="stock-page page-enter"><div class="app-header"><div><div class="header-greeting">Profil</div><div class="header-title">' + currentUser.avatar + ' ' + currentUser.name + '</div></div></div>' +
    '<div class="receipt-meta" style="margin:0 20px"><div class="receipt-meta-row"><span>Nama</span><span>' + currentUser.name + '</span></div><div class="receipt-meta-row"><span>Role</span><span class="receipt-badge">' + (isOwner() ? '👑 Owner' : '👤 Staff') + '</span></div></div>' +
    '<div style="padding:20px"><button class="btn btn-danger btn-block" onclick="logout()">Logout</button></div></div>';
}

// ===== BOTTOM NAV =====
function renderBottomNav() {
  var n = '<nav class="bottom-nav"><button class="nav-item ' + (currentPage === 'pos' ? 'active' : '') + '" onclick="navigate(\'pos\')"><span class="nav-icon">🏠</span>Kasir</button>';
  n += '<button class="nav-item ' + (currentPage === 'stock' ? 'active' : '') + '" onclick="navigate(\'stock\')"><span class="nav-icon">📦</span>Stok</button>';
  n += '<button class="nav-item ' + (currentPage === 'report' ? 'active' : '') + '" onclick="navigate(\'report\')"><span class="nav-icon">📊</span>Laporan</button>';
  n += '<button class="nav-item ' + (currentPage === 'profile' ? 'active' : '') + '" onclick="navigate(\'profile\')"><span class="nav-icon">' + currentUser.avatar + '</span>Profil</button></nav>';
  return n;
}
function closeModal(id) { var el = document.getElementById(id); if (el) el.remove(); }

// ===== INIT =====
Object.assign(window, {
  promptLogin: promptLogin,
  verifyPin: verifyPin,
  closeModal: closeModal,
  formatCurrency: formatCurrency,
  setCategory: setCategory,
  handleSearch: handleSearch,
  openCartModal: openCartModal,
  openVariantModal: openVariantModal,
  selectVariant: selectVariant,
  changeVariantQty: changeVariantQty,
  addVariantToCart: addVariantToCart,
  navigate: navigate,
  addToCart: addToCart,
  addCustomToCart: addCustomToCart,
  changeQty: changeQty,
  processCheckout: processCheckout,
  selectPayment: selectPayment,
  openReceipt: openReceipt,
  voidTransaction: voidTransaction,
  openStockModal: openStockModal,
  openAddMasterStock: openAddMasterStock,
  saveMasterStock: saveMasterStock,
  submitBatchStock: submitBatchStock,
  setReportTab: setReportTab,
  setReportDate: setReportDate,
  showStockDetail: showStockDetail,
  logout: logout
});
render();
bootstrapApp();

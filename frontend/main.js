// ===== DATA =====
var API_BASE = (function () {
  if (window.location.protocol === 'file:') return 'http://localhost:8080/api';
  return window.location.protocol + '//' + window.location.hostname + ':8080/api';
})();
var VARIANTS = ['Gula Putih', 'Aren', 'Sirup'];

var PRODUCT_UI = {
  1: { image: '/images/es kelapa plastik.png', icon: '\uD83E\uDD65', hasVariant: true },
  2: { image: '/images/es kelapa aren cup sedang.png', icon: '\uD83E\uDD64', hasVariant: true },
  3: { image: '/images/es kelapa aren cup jumbo.png', icon: '\uD83E\uDD64', hasVariant: true },
  4: {
    image: '/images/es jeruk cup sedang.png',
    icon: '\uD83C\uDF4A',
    displayName: 'Es Jeruk',
    displayDesc: 'Pilih ukuran cup',
    sizeOptions: [
      { label: 'Cup Besar', productId: 4 },
      { label: 'Cup Kecil', productId: 5 }
    ]
  },
  5: { image: '/images/es jeruk cup sedang.png', icon: '\uD83C\uDF4A', hideFromPos: true },
  6: {
    image: '/images/es-teh-cup-besar.jpg',
    icon: '\uD83C\uDF75',
    displayName: 'Es Teh',
    displayDesc: 'Pilih ukuran cup',
    sizeOptions: [
      { label: 'Cup Besar', productId: 6 },
      { label: 'Cup Kecil', productId: 7 }
    ]
  },
  7: { image: '/images/es-teh-cup-kecil.jpg', icon: '\uD83C\uDF75', hideFromPos: true },
  21: { image: '/images/pentol kuah.png', icon: '\uD83C\uDF62' },
  22: { image: '/images/tahu.png', icon: '\uD83C\uDF61' },
  23: { image: '/images/pentol goreng.png', icon: '\uD83C\uDF61' },
  24: { image: '/images/pentol telur.png', icon: '\uD83E\uDD5A' },
  25: { image: '/images/sempol.png', icon: '\uD83C\uDF62' },
  26: { image: '', icon: '\uD83E\uDDC6', hideFromPos: true },
  27: { image: '', icon: '\uD83E\uDD5F', hideFromPos: true },
  28: { image: '', icon: '\uD83C\uDF61', hideFromPos: true },
  30: { image: '/images/buah kelapa ori.png', icon: '\uD83E\uDD65' }
};
var PRODUCTS = [];
var POS_HISTORY = [];
var STOCK_LOGS = [];
var isAppReady = false;
var isSyncing = false;
var syncMessage = 'Sinkronisasi data...';
var syncErrorMessage = '';
var hasTransactionHistoryLoaded = false;

var CAT_ICONS = { 'Semua': '\uD83C\uDFF7\uFE0F', 'Minuman': '\uD83E\uDD64', 'Makanan': '\uD83C\uDF61' };
function getStockProducts() { return PRODUCTS.filter(function (p) { return p.trackStock; }); }
function findProduct(id) { for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === id) return PRODUCTS[i]; } return null; }
function getProductUi(id) { return PRODUCT_UI[id] || {}; }
function isPosProduct(product) { return product && !product.hideFromPos; }
function getCategoryTabs() {
  var tabs = ['Semua'];
  var seen = { 'Semua': true };
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (!isPosProduct(PRODUCTS[i])) continue;
    var cat = PRODUCTS[i].category || 'Lainnya';
    if (!seen[cat]) {
      seen[cat] = true;
      tabs.push(cat);
    }
  }
  return tabs;
}
// ===== STATE & DATA =====
var cart = [];
var currentCategory = 'Semua';
var currentPage = 'pos';
var searchQuery = '';
var selectedPayment = 'CASH';
var currentUser = JSON.parse(sessionStorage.getItem('pos_current_user') || 'null');
localStorage.removeItem('pos_current_user');
if (currentUser && currentUser.pin) {
  currentUser = null;
  sessionStorage.removeItem('pos_current_user');
}
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
  var ui = getProductUi(product.id);
  return {
    id: product.id,
    name: product.name || '',
    image: product.image || ui.image || '',
    desc: product.description || '',
    price: Number(product.price || 0),
    category: (product.category && product.category.name) || 'Lainnya',
    icon: product.icon || ui.icon || '',
    hasVariant: !!ui.hasVariant,
    displayName: ui.displayName || '',
    displayDesc: ui.displayDesc || '',
    sizeOptions: ui.sizeOptions || null,
    hideFromPos: !!ui.hideFromPos,
    isCustomPrice: product.isCustomPrice === true,
    packName: product.packName || null,
    pcsPerPack: Number(product.pcsPerPack || 1),
    trackStock: product.trackStock === true,
    currentStockPcs: Number(product.currentStockPcs || 0)
  };
}

function normalizeDate(d) {
  // Jackson may return LocalDateTime as ISO string or as array [year, month, day, hour, minute, second, nano]
  if (!d) return new Date().toISOString();
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    // d = [year, month, day, hour, minute, second, nano?]
    var year = d[0], month = d[1], day = d[2], hour = d[3] || 0, min = d[4] || 0, sec = d[5] || 0;
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0') +
      'T' + String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }
  return String(d);
}

function normalizeTransaction(tx) {
  return {
    dbId: tx.id,
    id: tx.transactionCode || ('TX-' + tx.id),
    date: normalizeDate(tx.transactionDate),
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
  hasTransactionHistoryLoaded = true;
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

function getRecentHistoryRange() {
  var now = new Date();
  var start = new Date(now);
  start.setDate(now.getDate() - 30);
  return { from: formatDateOnly(start), to: formatDateOnly(now) };
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
  // Always load transactions fresh from server to avoid stale data
  var recentRange = getRecentHistoryRange();
  await loadTransactionsFromServer(recentRange.from, recentRange.to);
}

async function syncPageData(message) {
  setSyncing(true, message || 'Sinkronisasi data...');
  render();
  try {
    await refreshCurrentPageData();
    syncErrorMessage = '';
    isAppReady = true;
  } catch (err) {
    if (!isAppReady) isAppReady = true;
    syncErrorMessage = 'Gagal memuat data dari backend. Pastikan backend dan database aktif.';
    console.error(err);
  } finally {
    setSyncing(false);
    render();
  }
}

async function bootstrapApp() {
  if (currentUser) await syncPageData('Memuat data produk dari database...');
}

// ===== PROFILES =====
function isOwner() { return currentUser && currentUser.role === 'owner'; }
function getUserAvatar(user) { return (user && user.avatar) || (user && user.role === 'owner' ? 'O' : 'S'); }
function getUserDisplayName(user) { return (user && (user.name || user.username)) || 'Kasir'; }
function getCategoryIcon(category) { return CAT_ICONS[category] || CAT_ICONS.Semua; }
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}
function escapeJsString(value) {
  return String(value == null ? '' : value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/[\r\n]/g, ' ');
}

function showLoginScreen() {
  document.body.classList.add('is-login');
  document.getElementById('app').innerHTML = '<div class="login-page">' +
    '<div class="login-title-outside">Login</div>' +
    '<div class="login-panel">' +
    '<div class="login-brand">' +
    '<div class="store-logo" aria-hidden="true"><div class="store-sign">24</div><div class="store-awning"></div><div class="store-building"><span></span><span></span><span></span></div><div class="store-base"></div></div>' +
    '<h1>POS UTERU F&amp;B</h1></div>' +
    '<form class="login-form" onsubmit="handleLoginSubmit(); return false;">' +
    '<div class="login-field"><span class="login-field-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.4 0-8 2-8 4.5V20h16v-1.5C20 16 16.4 14 12 14Z"/></svg></span><input id="login-identity" type="text" autocomplete="username" placeholder="Username or Email" oninput="clearLoginError()" /></div>' +
    '<div class="login-field"><span class="login-field-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4Z"/></svg></span><input id="login-password" type="password" autocomplete="current-password" placeholder="Password" oninput="clearLoginError()" /><button class="login-eye" type="button" onclick="toggleLoginPassword()" aria-label="Show password"><svg viewBox="0 0 24 24"><path d="M12 5c5.3 0 9 5 9 7s-3.7 7-9 7-9-5-9-7 3.7-7 9-7Zm0 2c-3.9 0-6.7 3.3-7 5 .3 1.7 3.1 5 7 5s6.7-3.3 7-5c-.3-1.7-3.1-5-7-5Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg></button></div>' +
    '<div id="login-error" class="login-error" role="alert"></div>' +
    '<button class="login-submit" type="submit">Login</button>' +
    '</form></div></div>';

  setTimeout(function () {
    var input = document.getElementById('login-identity');
    if (input) input.focus();
  }, 50);
}

function clearLoginError() {
  var el = document.getElementById('login-error');
  if (el) el.textContent = '';
}

function setLoginError(message) {
  var el = document.getElementById('login-error');
  if (el) el.textContent = message;
}

async function handleLoginSubmit() {
  var identityEl = document.getElementById('login-identity');
  var passwordEl = document.getElementById('login-password');
  var identity = identityEl ? identityEl.value : '';
  var password = passwordEl ? passwordEl.value : '';

  if (!identity || !password) {
    setLoginError('Username/email dan password wajib diisi.');
    return;
  }

  try {
    var user = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: identity, password: password })
    });
    completeLogin(user);
  } catch (err) {
    console.error(err);
    setLoginError('Username/email atau password salah.');
  }
}

function toggleLoginPassword() {
  var input = document.getElementById('login-password');
  var button = document.querySelector('.login-eye');
  if (!input) return;
  var isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  if (button) button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
}

function completeLogin(user) {
  document.body.classList.remove('is-login');
  currentUser = user;
  sessionStorage.setItem('pos_current_user', JSON.stringify(currentUser));
  currentPage = 'pos';
  hasTransactionHistoryLoaded = false;
  setSyncing(true, 'Menyambungkan akun ke database...');
  render();
  syncPageData('Menyambungkan akun ke database...');
}
function logout() { currentUser = null; sessionStorage.removeItem('pos_current_user'); showLoginScreen(); }

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
function getProductDisplayName(product) { return (product && product.displayName) || (product && product.name) || ''; }
function getProductDisplayDesc(product) { return (product && product.displayDesc) || (product && product.desc) || ''; }
function getProductSizeOptions(product) {
  var source = product && product.sizeOptions ? product.sizeOptions : [];
  var options = [];
  for (var i = 0; i < source.length; i++) {
    var optionProduct = findProduct(source[i].productId);
    if (!optionProduct) continue;
    options.push({
      label: source[i].label,
      productId: optionProduct.id,
      name: optionProduct.name,
      price: optionProduct.price
    });
  }
  return options;
}
function getProductPriceLabel(product) {
  var options = getProductSizeOptions(product);
  if (!options.length) return rp(product.price);
  var min = options[0].price, max = options[0].price;
  for (var i = 1; i < options.length; i++) {
    if (options[i].price < min) min = options[i].price;
    if (options[i].price > max) max = options[i].price;
  }
  return min === max ? rp(min) : rp(min) + ' - ' + rp(max);
}
function getProductSearchText(product) {
  var parts = [product.name, getProductDisplayName(product), product.desc || '', getProductDisplayDesc(product)];
  var options = getProductSizeOptions(product);
  for (var i = 0; i < options.length; i++) parts.push(options[i].label, options[i].name);
  return parts.join(' ').toLowerCase();
}
function getFilteredProducts() {
  var list = PRODUCTS.filter(isPosProduct);
  if (currentCategory !== 'Semua') list = list.filter(function (p) { return p.category === currentCategory; });
  if (searchQuery) {
    var q = searchQuery.toLowerCase();
    list = list.filter(function (p) {
      return getProductSearchText(p).indexOf(q) !== -1;
    });
  }
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
  document.body.classList.remove('is-login');
  var app = document.getElementById('app');
  if (isSyncing) { app.innerHTML = renderLoadingState() + (isAppReady ? renderBottomNav() : ''); return; }
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
  var ct = '', categories = getCategoryTabs();
  for (var i = 0; i < categories.length; i++) {
    var c = categories[i];
    ct += '<button class="cat-tab ' + (currentCategory === c ? 'active' : '') + '" onclick="setCategory(\'' + escapeJsString(c) + '\')">' +
      '<span class="tab-icon">' + escapeHtml(getCategoryIcon(c)) + '</span>' + escapeHtml(c) + '</button>';
  }
  var ph = '';
  if (!f.length) ph = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Produk tidak ditemukan</p></div>';
  else { ph = '<div class="product-grid" id="product-grid">'; for (var j = 0; j < f.length; j++) ph += renderProductCard(f[j]); ph += '</div>'; }
  return '<div class="page-enter"><div class="app-header"><div class="header-left">' +
    '<div class="header-greeting">Halo, ' + escapeHtml(getUserDisplayName(currentUser)) + '</div>' +
    '<div class="header-title">POS Uteru F&B</div></div><div class="header-right">' +
    '<button class="icon-btn" onclick="openCartModal()">🛒' + (cartCount() ? '<span class="badge">' + cartCount() + '</span>' : '') + '</button></div></div>' +
    '<div class="search-bar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' +
    '<input type="text" id="search-input" placeholder="Cari produk..." value="' + escapeHtml(searchQuery) + '" oninput="handleSearch(this.value)" /></div>' +
    '<div class="category-tabs">' + ct + '</div><div class="section-title" id="section-title">' + escapeHtml(cl) + '</div>' + ph +
    (cart.length ? renderBottomCart() : '') + '</div>';
}
function renderProductCard(p) {
  var safeName = escapeHtml(getProductDisplayName(p));
  var safeDesc = escapeHtml(getProductDisplayDesc(p));
  var safeIcon = escapeHtml(p.icon || '');
  var dImg = p.image ? '<img src="' + escapeHtml(p.image) + '" alt="' + safeName + '" class="real-product-img" onerror="this.style.display=\'none\'" />' + safeIcon : safeIcon;
  var sizeOptions = getProductSizeOptions(p);
  if (p.isCustomPrice) return '<div class="product-card" id="card-' + p.id + '"><div class="product-img">' + dImg + '</div><div class="product-body"><div class="product-name">' + safeName + '</div><div class="product-desc">' + safeDesc + '</div><div class="custom-input-group"><div class="custom-input-row"><input type="text" id="cprice-' + p.id + '" placeholder="Harga (Rp)" inputmode="numeric" oninput="formatCurrency(this)" onclick="event.stopPropagation()" /></div><button class="custom-add-full-btn" onclick="event.stopPropagation(); addCustomToCart(' + p.id + ')">+ Tambah</button></div></div></div>';
  if (sizeOptions.length) return '<div class="product-card" onclick="openSizeModal(' + p.id + ')"><div class="product-img">' + dImg + '</div><div class="product-body"><div class="product-name">' + safeName + '</div><div class="product-desc">Pilih ukuran & jumlah</div><div class="product-footer"><span class="product-price">' + getProductPriceLabel(p) + '</span><button class="add-btn">...</button></div></div></div>';
  if (p.hasVariant) return '<div class="product-card" onclick="openVariantModal(' + p.id + ')"><div class="product-img">' + dImg + '</div><div class="product-body"><div class="product-name">' + safeName + '</div><div class="product-desc">Pilih varian & jumlah</div><div class="product-footer"><span class="product-price">' + rp(p.price) + '</span><button class="add-btn">...</button></div></div></div>';
  return '<div class="product-card" onclick="addToCart(' + p.id + ')"><div class="product-img">' + dImg + '</div><div class="product-body"><div class="product-name">' + safeName + '</div><div class="product-desc">' + safeDesc + '</div><div class="product-footer"><span class="product-price">' + rp(p.price) + '</span><button class="add-btn">+</button></div></div></div>';
}
function renderBottomCart() {
  return '<div class="bottom-cart"><div class="cart-info"><div class="cart-count">' + cartCount() + ' item</div><div class="cart-total">' + rp(cartTotal()) + '</div></div><button class="checkout-btn" onclick="openCartModal()">Lihat Keranjang</button></div>';
}

// ===== SIZE MODAL =====
var sizeOptionQty = 1, selectedSizeProductId = null;
function openSizeModal(id) {
  closeModal('size-modal'); sizeOptionQty = 1;
  var p = findProduct(id); if (!p) return;
  var options = getProductSizeOptions(p); if (!options.length) return;
  selectedSizeProductId = options[0].productId;
  var vb = '';
  for (var v = 0; v < options.length; v++) {
    vb += '<button class="variant-pill size-pill ' + (v === 0 ? 'active' : '') + '" onclick="selectSizeOption(this,' + options[v].productId + ')">' +
      '<span class="variant-pill-main">' + escapeHtml(options[v].label) + '</span>' +
      '<span class="variant-pill-sub">' + rp(options[v].price) + '</span></button>';
  }
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'size-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('size-modal') };
  o.innerHTML = '<div class="modal-sheet variant-sheet"><div class="handle"></div><div class="variant-header"><span class="variant-icon">' + escapeHtml(p.icon) + '</span><div><h2 style="text-align:left;margin:0">' + escapeHtml(getProductDisplayName(p)) + '</h2><p style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">' + escapeHtml(getProductDisplayDesc(p)) + '</p></div></div><div class="form-row"><label>Pilih Ukuran</label><div class="variant-pills">' + vb + '</div></div><div class="form-row"><label>Jumlah</label><div class="qty-selector"><button class="qty-btn-lg" onclick="changeSizeQty(-1)">-</button><span class="qty-display" id="size-qty">1</span><button class="qty-btn-lg" onclick="changeSizeQty(1)">+</button></div></div><button class="btn btn-primary btn-block" id="size-add-btn" onclick="addSizeToCart(' + id + ')" style="margin-top:16px">+ Tambah - ' + rp(options[0].price) + '</button></div>';
  document.body.appendChild(o);
}
function selectSizeOption(el, productId) {
  selectedSizeProductId = productId;
  var ps = document.querySelectorAll('#size-modal .variant-pill');
  for (var i = 0; i < ps.length; i++) ps[i].classList.remove('active');
  el.classList.add('active');
  updateSizeAddButton();
}
function changeSizeQty(d) {
  sizeOptionQty = Math.max(1, sizeOptionQty + d);
  var qtyEl = document.getElementById('size-qty');
  if (qtyEl) qtyEl.textContent = sizeOptionQty;
  updateSizeAddButton();
}
function updateSizeAddButton() {
  var p = findProduct(selectedSizeProductId);
  var btn = document.getElementById('size-add-btn');
  if (btn && p) btn.textContent = '+ Tambah - ' + rp(p.price);
}
function addSizeToCart(id) {
  var p = findProduct(selectedSizeProductId); if (!p) return;
  var key = 'size-' + p.id;
  var ex = null; for (var j = 0; j < cart.length; j++) { if (cart[j].cartKey === key) { ex = cart[j]; break; } }
  if (ex) ex.qty += sizeOptionQty; else cart.push({ id: p.id, name: p.name, price: p.price, qty: sizeOptionQty, cartKey: key });
  closeModal('size-modal'); selectedSizeProductId = null; sizeOptionQty = 1; render();
}

// ===== VARIANT MODAL =====
var variantQty = 1, selectedVariant = 'Gula Putih';
function openVariantModal(id) {
  closeModal('variant-modal'); variantQty = 1; selectedVariant = 'Gula Putih';
  var p = findProduct(id); if (!p) return;
  var vb = ''; for (var v = 0; v < VARIANTS.length; v++) vb += '<button class="variant-pill ' + (v === 0 ? 'active' : '') + '" onclick="selectVariant(this,\'' + VARIANTS[v] + '\')">' + VARIANTS[v] + '</button>';
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'variant-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('variant-modal') };
  o.innerHTML = '<div class="modal-sheet variant-sheet"><div class="handle"></div><div class="variant-header"><span class="variant-icon">' + escapeHtml(p.icon) + '</span><div><h2 style="text-align:left;margin:0">' + escapeHtml(p.name) + '</h2><p style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">' + rp(p.price) + ' per pcs</p></div></div><div class="form-row"><label>Pilih Varian</label><div class="variant-pills">' + vb + '</div></div><div class="form-row"><label>Jumlah</label><div class="qty-selector"><button class="qty-btn-lg" onclick="changeVariantQty(-1)">-</button><span class="qty-display" id="variant-qty">1</span><button class="qty-btn-lg" onclick="changeVariantQty(1)">+</button></div></div><button class="btn btn-primary btn-block" onclick="addVariantToCart(' + id + ')" style="margin-top:16px">+ Tambah - ' + rp(p.price) + '</button></div>';
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
function navigate(p) {
  currentPage = p;
  hasTransactionHistoryLoaded = false;
  // Show loading state while fetching fresh data from server
  setSyncing(true, 'Memuat data terbaru...');
  render();
  syncPageData('Memuat data terbaru...');
}
function addToCart(id) {
  var p = findProduct(id); if (!p || p.isCustomPrice || p.hasVariant || getProductSizeOptions(p).length) return;
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
    ih += '<div class="cart-item-row"><div class="cart-item-info"><div class="cart-item-name">' + escapeHtml(it.name) + '</div><div class="cart-item-price">' + rp(it.price) + ' x ' + it.qty + ' = ' + rp(it.price * it.qty) + '</div></div><div class="cart-item-qty"><button class="qty-btn" onclick="changeQty(' + i + ',-1)">-</button><span class="qty-num">' + it.qty + '</span><button class="qty-btn" onclick="changeQty(' + i + ',1)">+</button></div></div>';
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
  var cName = currentUser.name || currentUser.username || 'Kasir';
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
  ov.innerHTML = '<div class="check-icon">✅</div><h2>Transaksi Berhasil!</h2><p>' + rp(total) + ' via ' + escapeHtml(selectedPayment) + '</p><p style="font-size:0.75rem;opacity:0.7;margin-top:8px">' + escapeHtml(txId) + ' - ' + escapeHtml(getUserDisplayName(currentUser)) + '</p>';
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
    ih += '<div class="receipt-item"><div class="receipt-item-left"><span class="receipt-item-name">' + escapeHtml(it.name) + '</span><span class="receipt-item-detail">' + it.qty + ' x ' + rp(it.price) + '</span></div><span class="receipt-item-total">' + rp(it.price * it.qty) + '</span></div>';
  }
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'receipt-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('receipt-modal') };
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><div class="receipt-header"><div class="receipt-logo">🧾</div><h2 style="margin:0">RESI PENJUALAN</h2><p class="receipt-id">' + escapeHtml(tx.id || '-') + '</p></div>' +
    '<div class="receipt-meta"><div class="receipt-meta-row"><span>Tanggal</span><span>' + escapeHtml(ds) + '</span></div><div class="receipt-meta-row"><span>Waktu</span><span>' + escapeHtml(ts) + '</span></div><div class="receipt-meta-row"><span>Kasir</span><span>' + escapeHtml(tx.cashier || '-') + '</span></div><div class="receipt-meta-row"><span>Pembayaran</span><span class="receipt-badge">' + (tx.method === 'CASH' ? '💵' : tx.method === 'QRIS' ? '📱' : '🏦') + ' ' + escapeHtml(tx.method) + '</span></div></div>' +
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
      '<div class="stock-name">' + escapeHtml(p.icon) + ' ' + escapeHtml(p.name) + '</div>' +
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
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><h2>' + escapeHtml(p.icon) + ' ' + escapeHtml(p.name) + '</h2>' +
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
    ih += '<div class="stock-input-row"><div class="stock-input-label"><span class="stock-input-icon">' + escapeHtml(p.icon) + '</span><div><div class="stock-input-name">' + escapeHtml(p.name) + '</div><div class="stock-input-info">1 plastik = ' + p.pcsPerPack + ' pcs' + (existing ? ' (sudah diisi)' : '') + '</div></div></div>' +
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
    h += '<div class="stock-card"><div class="stock-info"><div class="stock-name">' + escapeHtml(s.product) + '</div>' +
      '<div class="stock-detail">' + formatPlastikPcs(tp, pp) + ' (' + tp + ' pcs)' + (s.staff ? ' - ' + escapeHtml(s.staff) : '') + '</div></div></div>';
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
      topMenuHtml += '<div class="report-row"><div class="report-row-left"><div class="report-row-name">' + medal + ' ' + escapeHtml(m.name) + '</div>' +
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
        stockHtml += '<div class="report-row clickable" onclick="showStockDetail(' + df.morning + ',' + df.night + ',' + df.used + ',' + df.pcsPerPack + ',\'' + escapeJsString(df.product) + '\')">' +
          '<div class="report-row-left"><div class="report-row-name">' + escapeHtml(df.product) + '</div><div class="report-row-sub">Terpakai: ' + formatPlastikPcs(df.used, df.pcsPerPack) + '</div></div>' +
          '<div class="report-row-right"><div class="stock-diff used">-' + df.used + '</div><div class="report-row-arrow">></div></div></div>';
      }
    }
  }

  // Transaction list
  var lh = '';
  if (!filtered.length) {
    var emptyMessage = syncErrorMessage || ('Belum ada transaksi ' + (reportTab === 'daily' ? 'pada tanggal ini' : 'di rentang ini'));
    var emptyHint = '';
    if (!syncErrorMessage && reportTab === 'daily') {
      emptyHint = '<p style="font-size:0.78rem;color:var(--text-muted)">Coba ubah tanggal atau buka tab Mingguan/Bulanan untuk melihat riwayat lama.</p>';
    }
    lh = '<div class="empty-state"><div class="empty-icon">📋</div><p>' + emptyMessage + '</p>' + emptyHint + '</div>';
  } else {
    for (var r = 0; r < filtered.length; r++) {
      var h = filtered[r], di = new Date(h.date);
      var time = di.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      var ds = di.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      var sum = h.items.map(function (x) { return x.qty + 'x ' + (x.name || 'Produk'); }).join(', ');
      if (sum.length > 35) sum = sum.substring(0, 35) + '...';
      var ri = hist.indexOf(h);
      lh += '<div class="report-row clickable" onclick="openReceipt(' + ri + ')"><div class="report-row-left"><div class="report-row-name">' + escapeHtml(sum) + '</div><div class="report-row-sub">' + escapeHtml(ds) + ' ' + escapeHtml(time) + ' - ' + escapeHtml(h.method) + (h.cashier ? ' - ' + escapeHtml(h.cashier) : '') + '</div></div><div class="report-row-right"><div class="report-row-value">' + rp(h.total) + '</div><div class="report-row-arrow">></div></div></div>';
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
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><h2>📦 ' + escapeHtml(product) + '</h2><div class="receipt-meta">' +
    '<div class="receipt-meta-row"><span>Stok Pagi</span><span>' + formatPlastikPcs(morning, pcsPerPack) + ' (' + morning + ' pcs)</span></div>' +
    '<div class="receipt-meta-row"><span>Stok Malam</span><span>' + formatPlastikPcs(night, pcsPerPack) + ' (' + night + ' pcs)</span></div>' +
    '<div class="receipt-meta-row"><span><strong>Terpakai</strong></span><span><strong>' + formatPlastikPcs(used, pcsPerPack) + ' (' + used + ' pcs)</strong></span></div>' +
    '<div class="receipt-meta-row"><span>1 Plastik</span><span>' + pcsPerPack + ' pcs</span></div></div>' +
    '<button class="btn btn-outline btn-block" onclick="closeModal(\'stock-detail-modal\')" style="margin-top:16px">Tutup</button></div>';
  document.body.appendChild(o);
}

// ===== PROFILE =====
function renderProfilePage() {
  var ownerTools = isOwner()
    ? '<div style="padding:20px 20px 0"><button class="btn btn-profile-add btn-block" onclick="openCreateProfileModal()"><span>+</span> Tambah Profile</button></div>'
    : '';
  return '<div class="stock-page page-enter profile-page"><div class="app-header"><div><div class="header-greeting">Profil</div><div class="header-title">' + escapeHtml(getUserDisplayName(currentUser)) + '</div></div></div>' +
    '<div class="receipt-meta" style="margin:0 20px"><div class="receipt-meta-row"><span>Nama</span><span>' + escapeHtml(getUserDisplayName(currentUser)) + '</span></div><div class="receipt-meta-row"><span>Role</span><span class="receipt-badge">' + (isOwner() ? '👑 Owner' : '👤 Staff') + '</span></div></div>' +
    ownerTools +
    '<div style="padding:20px"><button class="btn btn-danger btn-block" onclick="logout()">Logout</button></div></div>';
}

function openCreateProfileModal() {
  closeModal('create-profile-modal');
  var o = document.createElement('div'); o.className = 'modal-overlay'; o.id = 'create-profile-modal';
  o.onclick = function (e) { if (e.target === o) closeModal('create-profile-modal') };
  o.innerHTML = '<div class="modal-sheet"><div class="handle"></div><h2>Tambah Profile</h2>' +
    '<div class="form-row"><label>Nama</label><input id="profile-name" type="text" placeholder="Nama kasir" /></div>' +
    '<div class="form-row"><label>Username</label><input id="profile-username" type="text" placeholder="staff3" autocomplete="off" /></div>' +
    '<div class="form-row"><label>Email</label><input id="profile-email" type="email" placeholder="staff3@uteru.local" autocomplete="off" /></div>' +
    '<div class="form-row"><label>Password</label><input id="profile-password" type="password" placeholder="Password" autocomplete="new-password" /></div>' +
    '<div class="form-row"><label>Role</label><select id="profile-role"><option value="staff">Staff</option><option value="owner">Owner</option></select></div>' +
    '<div class="form-row"><label>Avatar</label><input id="profile-avatar" type="text" maxlength="4" placeholder="S" /></div>' +
    '<div id="profile-create-error" style="color:var(--danger);text-align:center;font-size:0.85rem;display:none;margin-top:-8px;margin-bottom:16px"></div>' +
    '<div class="btn-row"><button class="btn btn-outline" onclick="closeModal(\'create-profile-modal\')">Batal</button>' +
    '<button class="btn btn-primary" onclick="createProfile()">Simpan</button></div></div>';
  document.body.appendChild(o);
}

async function createProfile() {
  var name = document.getElementById('profile-name').value.trim();
  var username = document.getElementById('profile-username').value.trim();
  var email = document.getElementById('profile-email').value.trim();
  var password = document.getElementById('profile-password').value;
  var role = document.getElementById('profile-role').value;
  var avatar = document.getElementById('profile-avatar').value.trim();
  var error = document.getElementById('profile-create-error');

  if (!name || !username || !password) {
    error.textContent = 'Nama, username, dan password wajib diisi.';
    error.style.display = 'block';
    return;
  }

  try {
    await apiFetch('/auth/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, username: username, email: email, password: password, role: role, avatar: avatar })
    });
    closeModal('create-profile-modal');
    alert('Profile berhasil dibuat.');
  } catch (e) {
    console.error(e);
    error.textContent = 'Profile gagal dibuat. Username/email mungkin sudah dipakai.';
    error.style.display = 'block';
  }
}

// ===== BOTTOM NAV =====
function renderBottomNav() {
  var n = '<nav class="bottom-nav"><button class="nav-item ' + (currentPage === 'pos' ? 'active' : '') + '" onclick="navigate(\'pos\')"><span class="nav-icon">🏠</span>Kasir</button>';
  n += '<button class="nav-item ' + (currentPage === 'stock' ? 'active' : '') + '" onclick="navigate(\'stock\')"><span class="nav-icon">📦</span>Stok</button>';
  n += '<button class="nav-item ' + (currentPage === 'report' ? 'active' : '') + '" onclick="navigate(\'report\')"><span class="nav-icon">📊</span>Laporan</button>';
  n += '<button class="nav-item ' + (currentPage === 'profile' ? 'active' : '') + '" onclick="navigate(\'profile\')"><span class="nav-icon">' + escapeHtml(getUserAvatar(currentUser)) + '</span>Profil</button></nav>';
  return n;
}
function closeModal(id) { var el = document.getElementById(id); if (el) el.remove(); }

// ===== INIT =====
Object.assign(window, {
  handleLoginSubmit: handleLoginSubmit,
  clearLoginError: clearLoginError,
  toggleLoginPassword: toggleLoginPassword,
  closeModal: closeModal,
  formatCurrency: formatCurrency,
  setCategory: setCategory,
  handleSearch: handleSearch,
  openCartModal: openCartModal,
  openSizeModal: openSizeModal,
  selectSizeOption: selectSizeOption,
  changeSizeQty: changeSizeQty,
  addSizeToCart: addSizeToCart,
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
  openCreateProfileModal: openCreateProfileModal,
  createProfile: createProfile,
  logout: logout
});
render();
bootstrapApp();

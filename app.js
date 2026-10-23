/* ============================================================
   GLUCO-CONTROL — app.js
   Tienda simulada: catálogo, carrito, favoritos, cuenta,
   checkout de demostración y detalles de interfaz.
   ============================================================ */

'use strict';

/* ============================================================
   DATOS
   ============================================================ */
const PRODUCTS = [
  {
    id: 'original',
    name: 'Gluco-Control Original',
    variant: 'Zero',
    flag: 'El más puro',
    kicker: 'Zero · 150 g',
    tagline: 'Original · Zero · 150 g',
    short: 'El yogurt de nopal en su forma más pura. Sin endulzantes añadidos, con el máximo contenido de fibra y un sabor natural a nopal y canela.',
    desc: 'La versión más honesta del prototipo: solo leche, mucílago de nopal, cultivo vivo y canela. Sin azúcar añadida y con la mayor concentración de fibra soluble de las tres variantes.',
    price: 45,
    compare: 55,
    tint: '#E9F0D8',
    tint2: '#F6FAEC',
    label: '#DCE7C4',
    labelDeep: '#C3D5A4',
    dot: '#5C7F45',
    badges: ['Sin azúcar añadida', 'Máx. fibra', 'Probióticos'],
    benefits: [
      'Sin azúcares añadidos',
      'Máximo contenido de fibra',
      'Probióticos activos',
      'Ideal para dietas bajas en azúcar'
    ],
    ingredients: 'Leche entera, mucílago de nopal, cultivo láctico vivo y canela.'
  },
  {
    id: 'endulzado',
    name: 'Gluco-Control Endulzado',
    variant: 'Estevia',
    flag: 'Nuevo',
    kicker: 'Estevia o miel · 150 g',
    tagline: 'Endulzado · Estevia · 150 g',
    short: 'La misma fórmula funcional con un toque de estevia o miel natural. Para cuidarte sin renunciar al sabor.',
    desc: 'Pensado para quienes quieren un perfil más dulce sin salir del marco funcional. Se endulza con estevia —o miel natural, a elección— y conserva la fibra del nopal.',
    price: 48,
    compare: 58,
    tint: '#F7EDD5',
    tint2: '#FCF6E8',
    label: '#F0DDB2',
    labelDeep: '#E3C784',
    dot: '#C49A3F',
    badges: ['Endulzante natural', 'Bajo índice glucémico', 'Fibra'],
    benefits: [
      'Endulzado con estevia o miel',
      'Bajo índice glucémico',
      'Textura cremosa',
      'Fibra soluble'
    ],
    ingredients: 'Leche entera, mucílago de nopal, estevia (o miel), cultivo láctico vivo y canela.'
  },
  {
    id: 'afrutado',
    name: 'Gluco-Control Afrutado',
    variant: 'Temporada',
    flag: 'Favorito',
    kicker: 'Fruta de temporada · 150 g',
    tagline: 'Afrutado · Temporada · 150 g',
    short: 'Combinado con fruta natural de temporada. Una explosión de sabor con todos los beneficios del nopal y vitaminas extra.',
    desc: 'La variante más fresca: fresa, mango o guayaba de temporada se integran a la base de nopal. Color y aroma naturales, sin colorantes añadidos.',
    price: 52,
    compare: 65,
    tint: '#F9E5E3',
    tint2: '#FDF1EF',
    label: '#F2D0CD',
    labelDeep: '#E2AEAA',
    dot: '#C06B67',
    badges: ['Fruta natural', 'Antioxidantes', 'Sin colorantes'],
    benefits: [
      'Fruta natural de temporada',
      'Vitaminas extra',
      'Sin colorantes añadidos',
      'Doble aporte antioxidante'
    ],
    ingredients: 'Leche entera, mucílago de nopal, fruta de temporada, estevia y cultivo láctico vivo.'
  }
];

const STORE_KEY = 'gc_v2_state';
const moneyFmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});
const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
const money = (n) => moneyFmt.format(n);

const state = {
  cart: [],
  favorites: [],
  users: [],
  orders: [],
  user: null,
  lastAddress: null,
  modalProduct: null,
  modalQty: 1
};

/* ============================================================
   UTILIDADES
   ============================================================ */
const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function digits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return;
    if (Array.isArray(raw.cart)) {
      state.cart = raw.cart
        .filter((item) => item && PRODUCTS.some((p) => p.id === item.id))
        .map((item) => ({ id: item.id, qty: Math.min(20, Math.max(1, Number(item.qty) || 1)) }));
    }
    if (Array.isArray(raw.favorites)) {
      state.favorites = raw.favorites.filter((id) => PRODUCTS.some((p) => p.id === id));
    }
    if (Array.isArray(raw.users)) state.users = raw.users;
    if (Array.isArray(raw.orders)) state.orders = raw.orders;
    if (raw.user && typeof raw.user === 'object' && raw.user.email) state.user = raw.user;
    if (raw.lastAddress && typeof raw.lastAddress === 'object') state.lastAddress = raw.lastAddress;
  } catch (err) {
    console.warn('No se pudo leer el almacenamiento local.', err);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      cart: state.cart,
      favorites: state.favorites,
      users: state.users,
      orders: state.orders,
      user: state.user,
      lastAddress: state.lastAddress
    }));
  } catch (err) {
    console.warn('No se pudo guardar el estado.', err);
  }
}

const productById = (id) => PRODUCTS.find((p) => p.id === id);
const cartCount = () => state.cart.reduce((sum, item) => sum + item.qty, 0);
const cartTotal = () => state.cart.reduce((sum, item) => {
  const p = productById(item.id);
  return sum + (p ? p.price * item.qty : 0);
}, 0);

function cartDetailed() {
  return state.cart
    .map((item) => ({ ...item, product: productById(item.id) }))
    .filter((item) => item.product);
}

/* ============================================================
   ENVASE SVG
   ============================================================ */
function jarSVG(p) {
  const uid = 'j' + Math.random().toString(36).slice(2, 9);
  return `
  <svg class="jar" viewBox="0 0 240 300" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="body-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset=".42" stop-color="#fdfaf3"/>
        <stop offset="1" stop-color="#e8ddc8"/>
      </linearGradient>
      <linearGradient id="label-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.label}"/>
        <stop offset="1" stop-color="${p.labelDeep}"/>
      </linearGradient>
    </defs>

    <ellipse cx="120" cy="279" rx="74" ry="11" fill="#16241B" opacity=".11"/>

    <rect x="56" y="46" width="128" height="31" rx="10" fill="${p.lid || '#1B3325'}"/>
    <rect x="62" y="53" width="116" height="4" rx="2" fill="#ffffff" opacity=".16"/>
    <rect x="64" y="77" width="112" height="14" rx="4" fill="#EDE3CF" stroke="#DCD1BA" stroke-width="1"/>

    <path d="M58 88 h124 l-9 154 c-.6 11-8.6 17-19.6 17H86.6c-11 0-19-6-19.6-17Z"
          fill="url(#body-${uid})" stroke="#DCD1BA" stroke-width="1.4"/>

    <path d="M80 100 l-7 130" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".55"/>
    <path d="M165 100 l6 128" stroke="#16241B" stroke-width="10" stroke-linecap="round" opacity=".05"/>

    <rect x="72" y="130" width="96" height="112" rx="9" fill="url(#label-${uid})"/>
    <rect x="72" y="130" width="96" height="112" rx="9" fill="none" stroke="#16241B" stroke-opacity=".08"/>

    <g transform="translate(110 138)" stroke="#16241B" stroke-width="1.5" fill="none"
       stroke-linecap="round" stroke-linejoin="round" opacity=".55">
      <path d="M10 19V7"/>
      <path d="M10 13.5c0-3.2 1.9-5 4.1-5 1.3 0 2 .9 2 1.9 0 2.4-2.2 4.3-6.1 4.3"/>
      <path d="M9.7 16c0-2.6-1.6-4-3.5-4-1.1 0-1.8.7-1.8 1.7 0 2.1 1.8 3.8 5.3 3.8"/>
    </g>

    <text x="120" y="176" text-anchor="middle" font-family="Fraunces, Georgia, serif"
          font-size="16.5" font-weight="700" letter-spacing="1" fill="#16241B">GLUCO</text>
    <text x="120" y="193" text-anchor="middle" font-family="Fraunces, Georgia, serif"
          font-size="16.5" font-weight="700" letter-spacing="1.2" fill="#16241B">CONTROL</text>

    <path d="M96 201h48" stroke="#16241B" stroke-opacity=".28" stroke-width="1"/>
    <text x="120" y="213" text-anchor="middle" font-family="Manrope, sans-serif"
          font-size="5.4" font-weight="700" letter-spacing="1.5" fill="#16241B" fill-opacity=".72">YOGURT DE NOPAL</text>
    <text x="120" y="228" text-anchor="middle" font-family="Manrope, sans-serif"
          font-size="7" font-weight="800" letter-spacing=".6" fill="#16241B" fill-opacity=".8">150 g</text>

    <circle cx="154" cy="232" r="3.6" fill="${p.dot}"/>

    <text x="120" y="264" text-anchor="middle" font-family="Manrope, sans-serif"
          font-size="4.4" font-weight="700" letter-spacing="1.2" fill="#16241B" fill-opacity=".32">LOTE PILOTO · 001</text>
  </svg>`;
}

/* ============================================================
   CATÁLOGO
   ============================================================ */
function renderProducts() {
  const grid = $('productGrid');
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map((p) => {
    const fav = state.favorites.includes(p.id);
    const off = Math.round(((p.compare - p.price) / p.compare) * 100);
    return `
    <article class="product-card" style="--tint:${p.tint};--tint-2:${p.tint2}">
      <div class="product-visual">
        <span class="product-flag">${esc(p.flag)}</span>
        <button class="fav-btn ${fav ? 'is-fav' : ''}" type="button"
                data-fav="${p.id}" aria-pressed="${fav}"
                aria-label="${fav ? 'Quitar' : 'Agregar'} ${esc(p.name)} ${fav ? 'de' : 'a'} favoritos">
          <svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg>
        </button>
        ${jarSVG(p)}
      </div>
      <div class="product-body">
        <p class="product-kicker">${esc(p.kicker)}</p>
        <h3>${esc(p.name)}</h3>
        <p class="product-desc">${esc(p.short)}</p>
        <div class="product-tags">${p.badges.map((b) => `<span>${esc(b)}</span>`).join('')}</div>
        <div class="product-foot">
          <div class="price-col">
            <span class="price-old">${money(p.compare)}</span>
            <span class="price-now">${money(p.price)}</span>
          </div>
          <div class="product-cta">
            <button class="link-btn" type="button" data-view="${p.id}">Ver ficha</button>
            <button class="btn btn--solid btn--sm" type="button" data-add="${p.id}">
              Añadir <span class="sr-only">${esc(p.name)} al carrito</span>
            </button>
          </div>
        </div>
      </div>
      <span class="sr-only">Descuento de demostración: ${off}%.</span>
    </article>`;
  }).join('');
}

/* ============================================================
   FAVORITOS
   ============================================================ */
function toggleFav(id) {
  if (!productById(id)) return;
  const index = state.favorites.indexOf(id);
  const added = index === -1;
  if (added) state.favorites.push(id);
  else state.favorites.splice(index, 1);
  saveState();
  renderProducts();
  syncProductModalFav();
  toast(added ? 'Guardado en favoritos' : 'Eliminado de favoritos', added ? '♥' : '♡');
}

function syncProductModalFav() {
  const btn = document.querySelector('[data-pm-fav]');
  if (!btn || !state.modalProduct) return;
  const fav = state.favorites.includes(state.modalProduct.id);
  btn.classList.toggle('is-fav', fav);
  btn.setAttribute('aria-pressed', String(fav));
  btn.setAttribute('aria-label', `${fav ? 'Quitar' : 'Agregar'} ${state.modalProduct.name} ${fav ? 'de' : 'a'} favoritos`);
  btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg>';
}

/* ============================================================
   MODAL DE PRODUCTO
   ============================================================ */
function openProduct(id) {
  const p = productById(id);
  if (!p) return;
  state.modalProduct = p;
  state.modalQty = 1;
  const fav = state.favorites.includes(p.id);
  const off = Math.round(((p.compare - p.price) / p.compare) * 100);

  $('productModalBody').innerHTML = `
    <div class="pm-visual" style="--tint:${p.tint};--tint-2:${p.tint2}">
      ${jarSVG(p)}
    </div>
    <div class="pm-info">
      <p class="pm-tag">${esc(p.tagline)}</p>
      <h2 class="pm-title" id="productModalTitle">${esc(p.name)}</h2>
      <div class="pm-price-row">
        <span class="pm-price">${money(p.price)}</span>
        <span class="pm-old">${money(p.compare)}</span>
        <span class="pm-off">-${off}% demo</span>
      </div>
      <p class="pm-desc">${esc(p.desc)}</p>
      <div class="pm-benefits">
        ${p.benefits.map((b) => `<span><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${esc(b)}</span>`).join('')}
      </div>
      <p class="pm-qty-label">Cantidad</p>
      <div class="pm-qty">
        <div class="qty-stepper">
          <button class="qty-btn" type="button" data-pm-minus aria-label="Quitar una unidad">
            <svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg>
          </button>
          <span class="qty-value" id="pmQty" aria-live="polite">1</span>
          <button class="qty-btn" type="button" data-pm-plus aria-label="Añadir una unidad">
            <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>
          </button>
        </div>
        <span class="pm-total">Total <strong id="pmTotal">${money(p.price)}</strong></span>
      </div>
      <div class="pm-actions">
        <button class="btn btn--solid" type="button" data-pm-add>Agregar al carrito</button>
        <button class="pm-fav ${fav ? 'is-fav' : ''}" type="button" data-pm-fav
                aria-pressed="${fav}" aria-label="${fav ? 'Quitar' : 'Agregar'} ${esc(p.name)} ${fav ? 'de' : 'a'} favoritos">
          <svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg>
        </button>
      </div>
      <p class="pm-ingredients"><strong>Ingredientes:</strong> ${esc(p.ingredients)}</p>
    </div>`;

  openModal('productModal');
}

function updateModalQty(delta) {
  state.modalQty = Math.min(20, Math.max(1, state.modalQty + delta));
  const qtyEl = $('pmQty');
  const totalEl = $('pmTotal');
  if (qtyEl) qtyEl.textContent = state.modalQty;
  if (totalEl && state.modalProduct) totalEl.textContent = money(state.modalProduct.price * state.modalQty);
}

/* ============================================================
   CARRITO
   ============================================================ */
function updateCartCount() {
  const count = cartCount();
  const badge = $('cartCount');
  badge.textContent = count;
  badge.hidden = count === 0;
  const btn = $('cartBtn');
  if (btn) {
    btn.setAttribute('aria-label', count
      ? `Abrir carrito de compras, ${count} ${count === 1 ? 'artículo' : 'artículos'}`
      : 'Abrir carrito de compras');
  }
  const head = $('cartHeadCount');
  if (head) head.textContent = `(${count})`;
}

function bumpCart() {
  const btn = $('cartBtn');
  btn.classList.remove('is-bumping');
  void btn.offsetWidth;
  btn.classList.add('is-bumping');
}

function addToCart(id, qty = 1) {
  const p = productById(id);
  if (!p) return;
  const item = state.cart.find((entry) => entry.id === id);
  if (item) item.qty = Math.min(20, item.qty + qty);
  else state.cart.push({ id, qty: Math.min(20, Math.max(1, qty)) });

  saveState();
  updateCartCount();
  renderCart();
  bumpCart();
  toast(`${p.name} añadido al carrito`);

  if (!$('productModal').hidden) closeModal($('productModal'));
  openCart();
}

function setCartQty(id, delta) {
  const item = state.cart.find((entry) => entry.id === id);
  if (!item) return;
  item.qty = Math.min(20, Math.max(1, item.qty + delta));
  saveState();
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((entry) => entry.id !== id);
  saveState();
  updateCartCount();
  renderCart();
  toast('Producto eliminado del carrito', '–');
}

function renderCart() {
  const body = $('cartItems');
  const foot = $('cartFoot');
  if (!body || !foot) return;

  updateCartCount();

  if (state.cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon"><svg class="icon" aria-hidden="true"><use href="#i-cart"/></svg></div>
        <p>Tu carrito está vacío.<br />Prueba una de las tres variantes.</p>
        <button class="btn btn--solid btn--sm" type="button" data-close-drawer>Ver productos</button>
      </div>`;
    foot.innerHTML = `<p class="cart-note">Los pedidos de este sitio son una simulación académica.</p>`;
    return;
  }

  body.innerHTML = cartDetailed().map(({ product: p, qty }) => `
    <div class="cart-item">
      <div class="ci-thumb" style="--tint:${p.tint}">${jarSVG(p)}</div>
      <div class="ci-info">
        <p class="ci-name">${esc(p.name)}</p>
        <p class="ci-variant">${esc(p.variant)} · 150 g</p>
        <div class="ci-qty">
          <button class="ci-qty-btn" type="button" data-qty="${p.id}" data-delta="-1" aria-label="Quitar una unidad de ${esc(p.name)}">
            <svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg>
          </button>
          <span class="ci-qty-num">${qty}</span>
          <button class="ci-qty-btn" type="button" data-qty="${p.id}" data-delta="1" aria-label="Añadir una unidad de ${esc(p.name)}">
            <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>
          </button>
        </div>
      </div>
      <div class="ci-right">
        <span class="ci-price">${money(p.price * qty)}</span>
        <button class="ci-remove" type="button" data-remove="${p.id}" aria-label="Eliminar ${esc(p.name)} del carrito">
          <svg class="icon" aria-hidden="true"><use href="#i-trash"/></svg>
        </button>
      </div>
    </div>`).join('');

  foot.innerHTML = `
    <div class="cart-subtotal"><span>Subtotal (${cartCount()} ${cartCount() === 1 ? 'envase' : 'envases'})</span><strong>${money(cartTotal())}</strong></div>
    <p class="cart-note">Envío y pago se confirman en el siguiente paso. Checkout de demostración: no se procesan cargos.</p>
    <button class="btn btn--solid btn--block" type="button" data-checkout>Finalizar compra</button>
    <button class="link-btn cart-foot-link" type="button" data-close-drawer>Seguir explorando</button>`;
}

/* ============================================================
   CAPAS: DRAWER + MODALES + FOCO
   ============================================================ */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
let activeModal = null;
let lastFocused = null;

function syncScrollLock() {
  const modalOpen = !!document.querySelector('.modal-overlay:not([hidden])');
  const drawerOpen = $('cartDrawer').classList.contains('is-open');
  document.body.classList.toggle('no-scroll', modalOpen || drawerOpen);
}

function openModal(id) {
  const overlay = $(id);
  if (!overlay) return;
  lastFocused = document.activeElement;
  overlay.hidden = false;
  activeModal = overlay;
  syncScrollLock();
  const target = overlay.querySelector('input:not([type="radio"]):not([type="hidden"]), textarea')
    || overlay.querySelector('.modal-close');
  if (target) setTimeout(() => target.focus({ preventScroll: true }), 60);
}

function closeModal(overlay) {
  if (!overlay) return;
  overlay.hidden = true;
  if (activeModal === overlay) activeModal = null;
  syncScrollLock();
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus({ preventScroll: true });
  }
}

function openCart() {
  renderCart();
  lastFocused = document.activeElement;
  $('cartDrawer').classList.add('is-open');
  $('cartDrawer').setAttribute('aria-hidden', 'false');
  $('drawerOverlay').classList.add('is-open');
  syncScrollLock();
  setTimeout(() => {
    const closeBtn = $('cartDrawer').querySelector('[data-close-drawer]');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }, 80);
}

function closeCart() {
  $('cartDrawer').classList.remove('is-open');
  $('cartDrawer').setAttribute('aria-hidden', 'true');
  $('drawerOverlay').classList.remove('is-open');
  syncScrollLock();
  if (lastFocused && typeof lastFocused.focus === 'function' && !document.querySelector('.modal-overlay:not([hidden])')) {
    lastFocused.focus({ preventScroll: true });
  }
}

/* ============================================================
   CUENTA
   ============================================================ */
async function hashPass(password) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('Hash no disponible, usando respaldo local.', err);
  }
  let h = 2166136261;
  for (let i = 0; i < password.length; i += 1) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'fb' + (h >>> 0).toString(16);
}

function setAuthTab(tab) {
  $$('.auth-tab').forEach((btn) => {
    const active = btn.dataset.authTab === tab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  $('loginForm').hidden = tab !== 'login';
  $('registerForm').hidden = tab !== 'register';
}

function updateAuthUI() {
  const logged = !!state.user;
  $('accountBtn').classList.toggle('is-auth', logged);
  $('accountBtn').setAttribute('aria-label', logged ? `Mi cuenta: ${state.user.name}` : 'Mi cuenta');
}

function openAuth(tab = 'login') {
  if (state.user) {
    openProfile();
    return;
  }
  setAuthTab(tab);
  $('loginError').hidden = true;
  $('registerError').hidden = true;
  openModal('authModal');
}

function setFieldError(el, message) {
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}

function prefillShipName() {
  if (!state.user) return;
  const field = $('shipName');
  if (field && !field.value) field.value = `${state.user.name} ${state.user.last || ''}`.trim();
}

function openProfile() {
  if (!state.user) {
    openAuth('login');
    return;
  }
  const u = state.user;
  const initials = `${(u.name || 'U')[0] || ''}${(u.last || '')[0] || ''}`.toUpperCase();
  const favs = PRODUCTS.filter((p) => state.favorites.includes(p.id));
  const orders = state.orders
    .filter((o) => o.email === u.email)
    .slice()
    .reverse();

  $('profileBody').innerHTML = `
    <div class="profile-head">
      <div class="profile-avatar">${esc(initials || 'G')}</div>
      <h3 class="profile-name">${esc(u.name)} ${esc(u.last || '')}</h3>
      <p class="profile-mail">${esc(u.email)}</p>
      <span class="profile-since">Miembro desde ${dateFmt.format(new Date(u.createdAt || Date.now()))}</span>
    </div>

    <div class="profile-section">
      <h4>Favoritos (${favs.length})</h4>
      ${favs.length ? favs.map((p) => `
        <div class="profile-fav">
          ${jarSVG(p)}
          <strong>${esc(p.name)}</strong>
          <span>${money(p.price)}</span>
        </div>`).join('') : '<p class="profile-empty">Aún no has guardado favoritos.</p>'}
    </div>

    <div class="profile-section">
      <h4>Pedidos de demostración (${orders.length})</h4>
      ${orders.length ? orders.map((o) => {
        const qty = o.items.reduce((s, i) => s + i.qty, 0);
        return `
        <div class="profile-order">
          <strong>#${esc(o.id)}</strong>
          <small>${dateFmt.format(new Date(o.date))} · ${qty} ${qty === 1 ? 'envase' : 'envases'}</small>
          <span class="order-amount">${money(o.total)}</span>
        </div>`;
      }).join('') : '<p class="profile-empty">Todavía no hay pedidos guardados.</p>'}
    </div>

    <div class="profile-actions">
      <button class="btn btn--solid btn--block" type="button" data-profile-cart>Ver mi carrito</button>
      <button class="btn btn--ghost btn--block" type="button" data-profile-logout>Cerrar sesión</button>
    </div>`;

  openModal('profileModal');
}

/* ============================================================
   CHECKOUT
   ============================================================ */
function showCheckoutStep(n) {
  $('stepAddress').hidden = n !== 1;
  $('stepPayment').hidden = n !== 2;
  $('stepSuccess').hidden = n !== 3;
  $$('[data-step-dot]').forEach((dot) => {
    dot.classList.toggle('is-active', Number(dot.dataset.stepDot) === n);
  });
  const modal = $('checkoutModal').querySelector('.modal');
  if (modal) modal.scrollTop = 0;
}

function setPaymentMethod(method) {
  $('cardFields').hidden = method !== 'card';
  $('transferInfo').hidden = method !== 'transfer';
  $('cashInfo').hidden = method !== 'cash';
}

function openCheckout() {
  if (state.cart.length === 0) {
    toast('Tu carrito está vacío', '!');
    return;
  }
  if (!state.user) {
    closeCart();
    toast('Inicia sesión para continuar con la compra', '!');
    openAuth('login');
    return;
  }

  closeCart();
  $('addressError').hidden = true;
  $('payError').hidden = true;
  setPaymentMethod('card');
  const cardRadio = document.querySelector('input[name="payMethod"][value="card"]');
  if (cardRadio) cardRadio.checked = true;
  showCheckoutStep(1);

  if (state.lastAddress) {
    const a = state.lastAddress;
    $('shipPhone').value = a.phone || '';
    $('shipStreet').value = a.street || '';
    $('shipColony').value = a.colony || '';
    $('shipZip').value = a.zip || '';
    $('shipCity').value = a.city || 'Coatzacoalcos';
    $('shipState').value = a.state || 'Veracruz';
    $('shipRef').value = a.ref || '';
  }
  prefillShipName();
  openModal('checkoutModal');
}

function renderOrderSummary() {
  const items = cartDetailed();
  if (!items.length) return;
  $('orderBox').innerHTML = `
    <h4>Resumen del pedido</h4>
    ${items.map(({ product: p, qty }) => `
      <div class="order-row">
        <span>${esc(p.name.replace('Gluco-Control ', ''))} × ${qty}</span>
        <span>${money(p.price * qty)}</span>
      </div>`).join('')}
    <div class="order-row"><span>Envío</span><span>Gratis (demo)</span></div>
    <div class="order-total"><span>Total</span><strong>${money(cartTotal())}</strong></div>`;
}

function luhnCheck(number) {
  const nums = digits(number).split('').reverse().map(Number);
  let sum = 0;
  nums.forEach((num, i) => {
    let n = num;
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  });
  return nums.length >= 13 && sum % 10 === 0;
}

function validatePayment() {
  const method = document.querySelector('input[name="payMethod"]:checked')?.value || 'card';
  if (method !== 'card') return { ok: true, method };

  const num = digits($('cardNumber').value);
  const name = $('cardName').value.trim();
  const expiry = $('cardExpiry').value.trim();
  const cvv = digits($('cardCVV').value);

  if (!luhnCheck(num)) return { ok: false, message: 'El número de tarjeta no es válido. Usa una tarjeta de prueba (por ejemplo, 4242 4242 4242 4242).' };
  if (name.length < 3) return { ok: false, message: 'Escribe el nombre del titular como aparece en la tarjeta.' };

  const match = expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) return { ok: false, message: 'La fecha debe tener el formato MM/AA.' };
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return { ok: false, message: 'El mes de vencimiento no es válido.' };
  const now = new Date();
  const expires = new Date(year, month, 1);
  if (expires <= new Date(now.getFullYear(), now.getMonth(), 1)) {
    return { ok: false, message: 'La tarjeta está vencida.' };
  }
  if (cvv.length < 3 || cvv.length > 4) return { ok: false, message: 'El CVV debe tener 3 o 4 dígitos.' };

  return { ok: true, method };
}

function placeOrder(method) {
  const total = cartTotal();
  const order = {
    id: 'GC-' + Date.now().toString(36).toUpperCase().slice(-6),
    date: new Date().toISOString(),
    email: state.user.email,
    items: cartDetailed().map(({ product: p, qty }) => ({
      id: p.id, name: p.name, qty, price: p.price
    })),
    total,
    payment: method,
    address: { ...state.lastAddress }
  };

  state.orders.push(order);
  state.cart = [];
  saveState();
  updateCartCount();
  renderCart();

  const labels = { card: 'Tarjeta (demo)', transfer: 'Transferencia SPEI (demo)', cash: 'Efectivo OXXO (demo)' };
  const addr = order.address;
  $('successDetails').innerHTML = `
    <h4>Pedido #${esc(order.id)}</h4>
    <div class="order-row"><span>Total</span><span>${money(order.total)}</span></div>
    <div class="order-row"><span>Método</span><span>${labels[method] || method}</span></div>
    <div class="order-row"><span>Envío</span><span>${esc(addr.street)}, ${esc(addr.colony)}<br />${esc(addr.city)}, ${esc(addr.state)}</span></div>
    <div class="order-row"><span>Contacto</span><span>${esc(state.user.email)}</span></div>
    <div class="order-row"><span>Fecha</span><span>${dateFmt.format(new Date(order.date))}</span></div>`;

  showCheckoutStep(3);
  toast('Pedido de demostración registrado');
}

/* ============================================================
   TABS FICHA TÉCNICA
   ============================================================ */
function setFactTab(tab) {
  $$('[data-fact-tab]').forEach((btn) => {
    const active = btn.dataset.factTab === tab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  $$('[data-fact-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.factPanel !== tab;
  });
}

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer = null;
function toast(message, icon = '✓') {
  const el = $('toast');
  el.innerHTML = `<span class="toast-ico" aria-hidden="true">${esc(icon)}</span>${esc(message)}`;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3400);
}

/* ============================================================
   INTERACCIÓN GLOBAL
   ============================================================ */
document.addEventListener('click', (event) => {
  const target = event.target;

  const add = target.closest('[data-add]');
  if (add) {
    addToCart(add.dataset.add, 1);
    return;
  }

  const view = target.closest('[data-view]');
  if (view) {
    openProduct(view.dataset.view);
    return;
  }

  const fav = target.closest('[data-fav]');
  if (fav) {
    toggleFav(fav.dataset.fav);
    return;
  }

  const qty = target.closest('[data-qty]');
  if (qty) {
    setCartQty(qty.dataset.qty, Number(qty.dataset.delta));
    return;
  }

  const remove = target.closest('[data-remove]');
  if (remove) {
    removeFromCart(remove.dataset.remove);
    return;
  }

  if (target.closest('[data-checkout]')) {
    openCheckout();
    return;
  }

  if (target.closest('[data-profile-cart]')) {
    closeModal($('profileModal'));
    openCart();
    return;
  }

  if (target.closest('[data-profile-logout]')) {
    state.user = null;
    saveState();
    updateAuthUI();
    closeModal($('profileModal'));
    toast('Sesión cerrada');
    return;
  }

  if (target.closest('[data-close-drawer]')) {
    closeCart();
    return;
  }

  const close = target.closest('[data-close]');
  if (close) {
    closeModal(close.closest('.modal-overlay'));
    return;
  }

  const open = target.closest('[data-open]');
  if (open && open.dataset.open === 'auth') {
    openAuth('login');
    return;
  }

  const authSwitch = target.closest('[data-auth-switch]');
  if (authSwitch) {
    setAuthTab(authSwitch.dataset.authSwitch);
    return;
  }

  const authTab = target.closest('[data-auth-tab]');
  if (authTab) {
    setAuthTab(authTab.dataset.authTab);
    return;
  }

  const factTab = target.closest('[data-fact-tab]');
  if (factTab) {
    setFactTab(factTab.dataset.factTab);
    return;
  }

  if (target.closest('[data-action="print"]')) {
    window.print();
    return;
  }

  const question = target.closest('.faq-q');
  if (question) {
    const item = question.closest('.faq-item');
    const isOpen = item.classList.contains('is-open');
    $$('.faq-item').forEach((el) => {
      el.classList.remove('is-open');
      el.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('is-open');
      question.setAttribute('aria-expanded', 'true');
    }
    return;
  }

  const pmMinus = target.closest('[data-pm-minus]');
  if (pmMinus) { updateModalQty(-1); return; }

  const pmPlus = target.closest('[data-pm-plus]');
  if (pmPlus) { updateModalQty(1); return; }

  const pmAdd = target.closest('[data-pm-add]');
  if (pmAdd && state.modalProduct) {
    addToCart(state.modalProduct.id, state.modalQty);
    return;
  }

  const pmFav = target.closest('[data-pm-fav]');
  if (pmFav && state.modalProduct) {
    toggleFav(state.modalProduct.id);
    return;
  }
});

/* cierre por fondo */
$$('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal(overlay);
  });
});
$('drawerOverlay').addEventListener('click', closeCart);

/* Escape + trampa de foco */
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (activeModal) {
      closeModal(activeModal);
      return;
    }
    if ($('cartDrawer').classList.contains('is-open')) {
      closeCart();
      return;
    }
    if (!$('mobilePanel').hidden) {
      setMenu(false);
    }
    return;
  }

  if (event.key !== 'Tab') return;
  const layer = activeModal || ($('cartDrawer').classList.contains('is-open') ? $('cartDrawer') : null);
  if (!layer) return;
  const focusables = $$(FOCUSABLE, layer).filter((el) => el.getClientRects().length > 0);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && (document.activeElement === first || !layer.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !layer.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
});

/* ============================================================
   FORMULARIOS
   ============================================================ */
$('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('loginEmail').value.trim().toLowerCase();
  const pass = $('loginPassword').value;
  const error = $('loginError');

  if (!email || !pass) {
    setFieldError(error, 'Completa correo y contraseña.');
    return;
  }

  const found = state.users.find((u) => u.email === email);
  if (!found) {
    setFieldError(error, 'No encontramos una cuenta con ese correo.');
    return;
  }

  const hash = await hashPass(pass);
  if (hash !== found.pass) {
    setFieldError(error, 'La contraseña no es correcta.');
    return;
  }

  state.user = { name: found.name, last: found.last, email: found.email, createdAt: found.createdAt };
  saveState();
  updateAuthUI();
  setFieldError(error, '');
  $('loginForm').reset();
  closeModal($('authModal'));
  prefillShipName();
  toast(`Hola de nuevo, ${found.name}`);
});

$('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('regName').value.trim();
  const last = $('regLastName').value.trim();
  const email = $('regEmail').value.trim().toLowerCase();
  const pass = $('regPassword').value;
  const confirm = $('regConfirm').value;
  const error = $('registerError');

  if (name.length < 2 || last.length < 2) {
    setFieldError(error, 'Escribe tu nombre y apellido.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    setFieldError(error, 'El correo no parece válido.');
    return;
  }
  if (pass.length < 6) {
    setFieldError(error, 'La contraseña debe tener al menos 6 caracteres.');
    return;
  }
  if (pass !== confirm) {
    setFieldError(error, 'Las contraseñas no coinciden.');
    return;
  }
  if (state.users.some((u) => u.email === email)) {
    setFieldError(error, 'Ese correo ya tiene una cuenta en este navegador.');
    return;
  }

  const hash = await hashPass(pass);
  const user = { name, last, email, pass: hash, createdAt: new Date().toISOString() };
  state.users.push(user);
  state.user = { name, last, email, createdAt: user.createdAt };
  saveState();
  updateAuthUI();
  setFieldError(error, '');
  $('registerForm').reset();
  closeModal($('authModal'));
  prefillShipName();
  toast(`Cuenta creada. Bienvenido, ${name}`);
});

$('accountBtn').addEventListener('click', () => openAuth('login'));
$('cartBtn').addEventListener('click', openCart);

$('addressForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const error = $('addressError');
  const address = {
    name: $('shipName').value.trim(),
    phone: $('shipPhone').value.trim(),
    street: $('shipStreet').value.trim(),
    colony: $('shipColony').value.trim(),
    zip: $('shipZip').value.trim(),
    city: $('shipCity').value.trim(),
    state: $('shipState').value.trim(),
    ref: $('shipRef').value.trim()
  };

  if (address.name.length < 3) return setFieldError(error, 'Escribe el nombre de quien recibe.');
  if (digits(address.phone).length < 10) return setFieldError(error, 'El teléfono debe tener al menos 10 dígitos.');
  if (address.street.length < 4) return setFieldError(error, 'Escribe la calle y el número.');
  if (!address.colony) return setFieldError(error, 'Escribe la colonia.');
  if (!/^\d{5}$/.test(address.zip)) return setFieldError(error, 'El código postal debe tener 5 dígitos.');
  if (!address.city || !address.state) return setFieldError(error, 'Completa ciudad y estado.');

  setFieldError(error, '');
  state.lastAddress = address;
  saveState();
  renderOrderSummary();
  showCheckoutStep(2);
});

$$('input[name="payMethod"]').forEach((radio) => {
  radio.addEventListener('change', () => setPaymentMethod(radio.value));
});

$('payBtn').addEventListener('click', () => {
  const result = validatePayment();
  if (!result.ok) {
    setFieldError($('payError'), result.message);
    return;
  }
  setFieldError($('payError'), '');
  placeOrder(result.method);
});

$('backToAddress').addEventListener('click', () => showCheckoutStep(1));
$('closeSuccess').addEventListener('click', () => {
  closeModal($('checkoutModal'));
  $('checkoutModal').querySelectorAll('input').forEach((input) => {
    if (input.type !== 'radio') input.value = '';
  });
  window.location.hash = '#producto';
});

/* formato de tarjeta */
$('cardNumber').addEventListener('input', (event) => {
  const value = digits(event.target.value).slice(0, 16);
  event.target.value = (value.match(/.{1,4}/g) || []).join(' ');
});
$('cardExpiry').addEventListener('input', (event) => {
  let value = digits(event.target.value).slice(0, 4);
  if (value.length >= 3) value = `${value.slice(0, 2)}/${value.slice(2)}`;
  event.target.value = value;
});
$('cardCVV').addEventListener('input', (event) => {
  event.target.value = digits(event.target.value).slice(0, 4);
});

/* contacto */
$('contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('contactName').value.trim();
  const email = $('contactEmail').value.trim();
  const message = $('contactMessage').value.trim();
  const error = $('contactError');

  if (name.length < 2) return setFieldError(error, 'Escribe tu nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setFieldError(error, 'El correo no parece válido.');
  if (message.length < 10) return setFieldError(error, 'Cuéntanos un poco más (mínimo 10 caracteres).');

  setFieldError(error, '');
  $('contactForm').reset();
  toast('Mensaje registrado. Te contactaríamos pronto.');
});

/* ============================================================
   MENÚ MÓVIL
   ============================================================ */
function setMenu(open) {
  $('menuBtn').setAttribute('aria-expanded', String(open));
  $('menuBtn').setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  $('mobilePanel').hidden = !open;
}

$('menuBtn').addEventListener('click', () => {
  setMenu($('mobilePanel').hidden);
});

$('mobilePanel').addEventListener('click', (event) => {
  if (event.target.closest('a, button')) setMenu(false);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 860 && !$('mobilePanel').hidden) setMenu(false);
});

/* ============================================================
   SCROLL: header, progreso, scrollspy
   ============================================================ */
const header = $('siteHeader');
const progress = $('scrollProgress');
let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', y > 6);
    const height = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = height > 0 ? `${Math.min(100, (y / height) * 100)}%` : '0%';
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* scrollspy */
const navLinks = $$('[data-nav]');
const navMap = new Map(navLinks.map((link) => [link.dataset.nav, link]));
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.remove('is-active'));
      navMap.get(entry.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-42% 0px -52% 0px', threshold: 0 });
  $$('main section[id]').forEach((section) => {
    if (navMap.has(section.id)) spy.observe(section);
  });
}

/* ============================================================
   REVEAL
   ============================================================ */
function initReveal() {
  const elements = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  elements.forEach((el) => observer.observe(el));
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  loadState();
  document.body.classList.add('reveal-ready');

  $('heroJar').innerHTML = jarSVG(PRODUCTS[0]);
  renderProducts();
  updateCartCount();
  renderCart();
  updateAuthUI();
  prefillShipName();

  $('year').textContent = new Date().getFullYear();
  $('checkoutModal').querySelectorAll('input[name="payMethod"]')[0].checked = true;
  setPaymentMethod('card');

  initReveal();
}

init();

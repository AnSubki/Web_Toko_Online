/* ---------- Putaran tanpa henti ---------- */
// Menggandakan isi baris sampai lebih lebar dari layar, lalu digeser terus tanpa putus.
function makeLoop(el, html, { speed = 50, reverse = false } = {}) {
  const track = document.createElement("div");
  track.className = "loop-track";
  el.innerHTML = "";
  el.appendChild(track);
  if (reverse) el.classList.add("reverse");

  const copy = (hidden) => {
    const c = document.createElement("div");
    c.className = "loop-copy";
    c.innerHTML = html;
    if (hidden) {
      c.setAttribute("aria-hidden", "true");
      c.inert = true;
    }
    return c;
  };

  track.appendChild(copy(false));
  const unit = Math.max(track.firstChild.offsetWidth, 1);
  const need = Math.max(
    1,
    Math.ceil((Math.max(window.innerWidth, screen.width) * 1.1) / unit),
  );
  for (let i = 1; i < need * 2; i++) track.appendChild(copy(true));
  track.style.setProperty("--dur", (unit * need) / speed + "s"); // speed = piksel per detik
}

const discount = (p) =>
  p.oldPrice > p.price
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
    : 0;

/* ---------- Slider banner ---------- */
const slides = [
  {
    productId: 2,
    tag: "Smartphone",
    title: "Pilihan smartphone untuk keseharianmu",
    sub: "Temukan perangkat Samsung Galaxy dan iPhone 17 untuk komunikasi, foto, serta hiburan.",
    cta: "Lihat smartphone",
    href: "shop.html?cat=Smartphone",
    bg: "var(--hero-gradient)",
  },
  {
    productId: 4,
    tag: "Mouse",
    title: "Ruang kerja lebih tenang dengan mouse nirkabel",
    sub: "Asus MW103 hadir dengan klik senyap dan beberapa pilihan warna.",
    cta: "Lihat mouse",
    href: "product.html?id=4",
    bg: "var(--hero-gradient)",
  },
  {
    productId: 5,
    tag: "Gaming",
    title: "Kendali presisi untuk sesi bermain",
    sub: "Razer DeathAdder Essential dengan lima tombol dan sensor optik 6.400 DPI.",
    cta: "Lihat Razer",
    href: "product.html?id=5",
    bg: "var(--hero-gradient)",
  },
  {
    productId: 6,
    tag: "Pilihan merek",
    title: "Temukan perangkat yang cocok untukmu",
    sub: "Bandingkan pilihan smartphone dan mouse dari merek favorit.",
    cta: "Lihat semua produk",
    href: "shop.html",
    bg: "var(--hero-gradient)",
  },
  {
    productId: 7,
    tag: "Pilihan merek",
    title: "Temukan perangkat yang cocok untukmu",
    sub: "Bandingkan pilihan favorit.",
    cta: "Lihat semua produk",
    href: "shop.html",
    bg: "var(--hero-gradient)",
  },
  {
    productId: 8,
    tag: "Pilihan merek",
    title: "Temukan perangkat yang cocok untukmu",
    sub: "Bandingkan pilihan merek favorit.",
    cta: "Lihat semua produk",
    href: "shop.html",
    bg: "var(--hero-gradient)",
  },
];

const viewport = document.getElementById("slider");
const track = document.getElementById("slider-track");
const dotsBox = document.getElementById("slider-dots");
let index = 0,
  timer = null,
  pointerOver = false,
  focusWithin = false;

track.innerHTML = slides
  .map((s, i) => {
    const p = findProduct(s.productId);
    const savedPercent = discount(p);
    const badge =
      p.sold >= 100
        ? "Terlaris"
        : savedPercent
          ? `Diskon spesial ${savedPercent}%`
          : "Pilihan Mita";
    const proof = p.sold > 0 ? `${p.sold} terjual` : `${p.stock} stok tersedia`;
    return `<article class="slide" role="group" aria-roledescription="slide" style="background:${s.bg}" aria-label="Banner ${i + 1} dari ${slides.length}">
    <div class="slide-text">
      <small>${esc(s.tag)}</small>
      <h2>${esc(s.title)}</h2>
      <p>${esc(s.sub)}</p>
      <a href="${esc(s.href)}" class="btn btn-light">${esc(s.cta)}</a>
    </div>
    <div class="slide-art">
      <a class="hero-product-card" href="product.html?id=${p.id}" aria-label="Lihat ${esc(p.name)}, ${formatRupiah(p.price)}">
        <div class="hero-product-image">
          <img src="${esc(productImage(p))}" alt="${esc(p.name)}">
          <span class="hero-product-badge">${esc(badge)}</span>
        </div>
        <div class="hero-product-info">
          <strong class="hero-product-name">${esc(p.name)}</strong>
          <span class="hero-product-trust"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h11v9H3zM14 11h4l3 3v3h-7z"/><circle cx="7" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/></svg>Gratis ongkir min. Rp500rb</span>
          <div class="hero-product-price-row">
            <span><small class="hero-product-price-label">Harga spesial</small><b class="hero-product-price">${formatRupiah(p.price)}</b></span>
            <span class="hero-product-saving">${savedPercent ? `Hemat ${savedPercent}%` : "Pilihan toko"}</span>
          </div>
          <div class="hero-product-bottom">
            <span class="hero-product-proof">${esc(proof)}</span>
            <span class="hero-product-cta">Detail produk <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></span>
          </div>
        </div>
      </a>
    </div>
  </article>`;
  })
  .join("");
dotsBox.innerHTML = slides
  .map(
    (_, i) =>
      `<button type="button" aria-label="Ke banner ${i + 1}" aria-controls="slider-track" aria-current="false"></button>`,
  )
  .join("");

function position() {
  const els = [...track.children];
  if (!els.length) return;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
  const w = els[0].offsetWidth;
  const x = viewport.clientWidth / 2 - w / 2 - index * (w + gap);
  track.style.transform = `translateX(${x}px)`;
  els.forEach((el, i) => {
    const active = i === index;
    el.classList.toggle("active", active);
    el.setAttribute("aria-hidden", String(!active));
    el.inert = !active;
  });
  [...dotsBox.children].forEach((dot, i) => {
    const active = i === index;
    dot.classList.toggle("on", active);
    dot.setAttribute("aria-current", String(active));
  });
}
function go(i) {
  index = (i + slides.length) % slides.length;
  position();
  restart();
}
function pause() {
  clearInterval(timer);
  timer = null;
}
function restart() {
  pause();
  if (
    document.hidden ||
    pointerOver ||
    focusWithin ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  timer = setInterval(() => go(index + 1), 5000);
}

document
  .getElementById("slide-prev")
  .addEventListener("click", () => go(index - 1));
document
  .getElementById("slide-next")
  .addEventListener("click", () => go(index + 1));
dotsBox.addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (!button) return;
  const i = [...dotsBox.children].indexOf(button);
  if (i >= 0) go(i);
});
viewport.addEventListener("pointerenter", () => {
  pointerOver = true;
  pause();
});
viewport.addEventListener("pointerleave", () => {
  pointerOver = false;
  restart();
});
viewport.addEventListener("focusin", () => {
  focusWithin = [...viewport.querySelectorAll(":focus-visible")].length > 0;
  if (focusWithin) pause();
});
viewport.addEventListener("focusout", () => {
  requestAnimationFrame(() => {
    focusWithin = [...viewport.querySelectorAll(":focus-visible")].length > 0;
    if (!focusWithin) restart();
  });
});
document.addEventListener("visibilitychange", restart);
let startX = 0;
viewport.addEventListener(
  "touchstart",
  (e) => {
    pointerOver = false;
    pause();
    startX = e.touches[0].clientX;
  },
  { passive: true },
);
viewport.addEventListener(
  "touchend",
  (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    else restart();
  },
  { passive: true },
);
viewport.addEventListener("touchcancel", restart, { passive: true });
window.addEventListener("resize", position);
window.addEventListener("load", position);
position();
restart();

/* ---------- Pintasan kategori ---------- */
const quickIcons = {
  laptop:
    '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="11" rx="1.5"/><path d="M3 18h18l-1.5 2h-15L3 18Z"/></svg>',
  mouse:
    '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 3v5m-6 1h12"/></svg>',
  smartphone:
    '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 6h4m-3 12h2"/></svg>',
  gaming:
    '<svg viewBox="0 0 24 24"><path d="M6 9h12a4 4 0 0 1 3.8 5l-1 3.2a2 2 0 0 1-3.1.9L14 16h-4l-3.7 2.1a2 2 0 0 1-3.1-.9L2.2 14A4 4 0 0 1 6 9Z"/><path d="M8 11v4m-2-2h4m7-1h.01m2 2h.01"/></svg>',
  deals:
    '<svg viewBox="0 0 24 24"><path d="m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0L3 13V4h9l8.6 8.6a.6.6 0 0 1 0 .8Z"/><circle cx="7.5" cy="8.5" r="1.25"/></svg>',
  catalog:
    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
};
const quickItems = [
  ["laptop", "Laptop", "Kerja & produktivitas", "shop.html?cat=Laptop"],
  ["mouse", "Mouse", "Nirkabel & gaming", "shop.html?cat=Mouse"],
  ["smartphone", "Smartphone", "Ponsel & gadget", "shop.html?cat=Smartphone"],
  ["gaming", "Gaming Gear", "Mouse, keyboard & headset", "shop.html?cat=Mouse"],
  ["deals", "Diskon Spesial", "Promo pilihan", "shop.html?deal=1"],
  ["catalog", "Semua Produk", "Lihat katalog", "shop.html"],
];
document.getElementById("quick-categories").innerHTML = quickItems
  .map(
    ([icon, label, description, href]) => `
      <a href="${href}" class="quick-item">
        <span class="quick-icon" aria-hidden="true">${quickIcons[icon]}</span>
        <span class="quick-copy">
          <span class="quick-label">${esc(label)}</span>
          <span class="quick-description">${esc(description)}</span>
        </span>
      </a>`,
  )
  .join("");

/* ---------- Pilihan untuk kamu ---------- */
const bySold = [...PRODUCTS].sort((a, b) => b.sold - a.sold);
const categoryProducts = document.getElementById("category-products");
categoryProducts.innerHTML = bySold.slice(0, 8).map(productCardHTML).join("");
bindAddButtons(categoryProducts);

const pickRow = document.getElementById("pick-row");
pickRow.innerHTML = bySold
  .map((p) => {
    const d = discount(p);
    return `<article class="pick-card">
    <a href="product.html?id=${p.id}" class="pick-link">
      <span class="pick-badge">${p.sold >= 100 ? "Terlaris" : "Pilihan"}</span>
      <div class="pick-img"><img src="${esc(productImage(p))}" alt="${esc(p.name)}" loading="lazy"></div>
      <h3>${esc(p.name)}</h3>
      <small class="sku">${esc(p.sku)}</small>
      <strong class="price">${formatRupiah(p.price)}</strong>
      ${d ? `<div class="pick-disc"><em>${d}%</em><s>${formatRupiah(p.oldPrice)}</s></div>` : ""}
      <small class="sold">Terjual ${p.sold}</small>
    </a>
    <button type="button" class="pick-add" data-add="${p.id}">+ Keranjang</button>
  </article>`;
  })
  .join("");
bindAddButtons(pickRow);
document
  .getElementById("pick-prev")
  .addEventListener("click", () => pickRow.scrollBy({ left: -440 }));
document
  .getElementById("pick-next")
  .addEventListener("click", () => pickRow.scrollBy({ left: 440 }));

/* ---------- Baru dilihat ---------- */
const recentSection = document.getElementById("recently-viewed");
const recentProducts = Viewed.get()
  .map(findProduct)
  .filter(Boolean)
  .slice(0, 4);
if (recentProducts.length) {
  recentSection.hidden = false;
  const recentGrid = document.getElementById("recent-products");
  recentGrid.innerHTML = recentProducts.map(productCardHTML).join("");
  bindAddButtons(recentGrid);
}

/* ---------- Paling sering dicari (berputar) ---------- */
makeLoop(
  document.getElementById("hot-loop"),
  bySold
    .map(
      (p) => `<a href="product.html?id=${p.id}" class="hot-card">
    <span class="hot-trend" aria-hidden="true">↑</span>
    <div class="hot-img"><img src="${esc(productImage(p))}" alt="${esc(p.name)}" loading="lazy"></div>
    <h3>${esc(p.name)}</h3>
  </a>`,
    )
    .join(""),
  { speed: 50 },
);

/* ---------- Tab rekomendasi ---------- */
const tabs = [
  ["Rekomendasi Kami", ""],
  ["Smartphone", "Smartphone"],
  ["Mouse", "Mouse"],
];
const tabsEl = document.getElementById("home-tabs");
const tabPanel = document.getElementById("tab-products");
let activeTab = 0;

function renderTabs() {
  tabsEl.innerHTML = tabs
    .map(
      ([label], i) =>
        `<button type="button" role="tab" class="tab ${i === activeTab ? "active" : ""}" data-tab="${i}" aria-selected="${i === activeTab}">${label}</button>`,
    )
    .join("");
  const cat = tabs[activeTab][2];
  const list = (
    cat ? PRODUCTS.filter((p) => p.category === cat) : bySold
  ).slice(0, 8);
  tabPanel.innerHTML = list.map(productCardHTML).join("");
}
tabsEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (!b) return;
  activeTab = Number(b.dataset.tab);
  renderTabs();
});
bindAddButtons(tabPanel);
renderTabs();

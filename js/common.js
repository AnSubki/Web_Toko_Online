/* ==========================================================
  MitaElektronik — fungsi bersama (storage, header, footer, toast)
========================================================== */
document.documentElement.classList.add("js");
const KEYS = {
  cart: "sukiCart",
  users: "sukiUsers",
  session: "sukiSession",
  remember: "sukiRemember",
  orders: "sukiOrders",
  viewed: "sukiRecentlyViewed",
  inventory: "mitaInventory",
};

const Store = {
  read(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const Wish = {
  get() {
    const w = Store.read("sukiWish", []);
    return Array.isArray(w) ? w : [];
  },
  has(id) {
    return this.get().includes(Number(id));
  },
  toggle(id) {
    id = Number(id);
    const w = this.get();
    const on = !w.includes(id);
    Store.write("sukiWish", on ? [...w, id] : w.filter((x) => x !== id));
    return on;
  },
};

const Viewed = {
  get() {
    const ids = Store.read(KEYS.viewed, []);
    return Array.isArray(ids)
      ? ids.map(Number).filter((id) => Number.isFinite(id) && findProduct(id))
      : [];
  },
  add(id) {
    id = Number(id);
    if (findProduct(id)) {
      Store.write(
        KEYS.viewed,
        [id, ...this.get().filter((viewedId) => viewedId !== id)].slice(0, 8),
      );
    }
  },
};

const findProduct = (id) => PRODUCTS.find((p) => p.id === Number(id));

function normalizeSearchQuery(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function productSearchText(product) {
  return normalizeSearchQuery(
    [
      product.name,
      product.category,
      product.sku,
      product.description,
      ...(Array.isArray(product.colors) ? product.colors : []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function productMatches(product, query) {
  const normalizedQuery = normalizeSearchQuery(query);
  return !normalizedQuery || productSearchText(product).includes(normalizedQuery);
}

const Inventory = {
  get() {
    const inventory = Store.read(KEYS.inventory, {});
    return inventory &&
      typeof inventory === "object" &&
      !Array.isArray(inventory)
      ? inventory
      : {};
  },
  apply() {
    const inventory = this.get();
    PRODUCTS.forEach((product) => {
      const stock = inventory[product.id];
      if (Number.isSafeInteger(stock) && stock >= 0) product.stock = stock;
    });
  },
  setMany(updates) {
    const inventory = this.get();
    for (const { id, stock } of updates) {
      if (!findProduct(id) || !Number.isSafeInteger(stock) || stock < 0)
        throw new TypeError("Invalid inventory update.");
      inventory[Number(id)] = stock;
    }
    Store.write(KEYS.inventory, inventory);
    this.apply();
  },
};
Inventory.apply();

/* ---------- Keranjang ---------- */
const Cart = {
  get() {
    const c = Store.read(KEYS.cart, []);
    return Array.isArray(c)
      ? c
          .filter((item) => {
            const product = item && findProduct(item.id);
            return product && Number.isSafeInteger(item.qty) && item.qty > 0;
          })
          .map((item) => ({
            ...item,
            id: Number(item.id),
            name: findProduct(item.id).name,
            price: findProduct(item.id).price,
            image: productImage(findProduct(item.id)),
          }))
      : [];
  },
  save(c) {
    const normalized = [];
    for (const item of Array.isArray(c) ? c : []) {
      const product = item && findProduct(item.id);
      if (!product || !Number.isSafeInteger(item.qty) || item.qty <= 0)
        continue;
      const current = normalized.find((row) => row.id === product.id);
      if (current)
        current.qty = Math.min(product.stock, current.qty + item.qty);
      else
        normalized.push({
          id: product.id,
          qty: Math.min(product.stock, item.qty),
          price: product.price,
          name: product.name,
          image: productImage(product),
        });
    }
    Store.write(
      KEYS.cart,
      normalized.filter((item) => item.qty > 0),
    );
    updateCartBadge();
  },
  count() {
    return this.get().reduce((s, i) => s + (Number(i.qty) || 0), 0);
  },
  subtotal() {
    return this.get().reduce((s, i) => {
      const product = findProduct(i.id);
      return s + (product ? product.price * i.qty : 0);
    }, 0);
  },
  shipping(subtotal) {
    return subtotal === 0 || subtotal >= 500000 ? 0 : 20000;
  },
  add(id, quantity = 1) {
    const p = findProduct(id);
    if (!p) {
      toast("Produk tidak ditemukan.", "error");
      return false;
    }
    quantity = Number(quantity);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      toast("Jumlah produk tidak valid.", "error");
      return false;
    }
    if (p.stock <= 0) {
      toast(`Stok ${p.name} habis.`, "error");
      return false;
    }
    const cart = this.get();
    const row = cart.find((i) => i.id === p.id);
    const currentQty = row ? row.qty : 0;
    if (currentQty + quantity > p.stock) {
      toast(`Stok ${p.name} hanya ${p.stock}.`, "error");
      return false;
    }
    if (row) row.qty += quantity;
    else cart.push({ id: p.id, qty: quantity, price: p.price });
    this.save(cart);
    toast(`${quantity} × ${p.name} masuk ke keranjang.`);
    return true;
  },
  setQty(id, qty) {
    const productId = Number(id);
    let cart = this.get();
    const p = findProduct(productId);
    qty = Number.isSafeInteger(qty) ? Math.min(qty, p ? p.stock : 0) : 0;
    cart =
      qty <= 0
        ? cart.filter((i) => i.id !== productId)
        : cart.map((i) =>
            i.id === productId ? { ...i, qty, price: p.price } : i,
          );
    this.save(cart);
  },
  remove(id) {
    this.save(this.get().filter((i) => i.id !== id));
  },
  clear() {
    Store.remove(KEYS.cart);
    updateCartBadge();
  },
};

/* ---------- Akun ---------- */
const Auth = {
  users() {
    const u = Store.read(KEYS.users, []);
    return Array.isArray(u) ? u : [];
  },
  current() {
    return Store.read(KEYS.session, null);
  },
  // Hash sederhana untuk demo.
  hash(text) {
    let h = 5381;
    for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
    return "h" + h.toString(16);
  },
  logout() {
    Store.remove(KEYS.session);
  },
};

/* ---------- Toast ---------- */
function toast(message, type = "success") {
  let box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 250);
  }, 2600);
}

/* ---------- Badge keranjang & favorit ---------- */
function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    const n = Cart.count();
    const changed = el.textContent !== String(n);
    el.textContent = n;
    el.hidden = n === 0;
    if (changed && n > 0) {
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  });
}

function updateWishBadge() {
  document.querySelectorAll("[data-wish-count]").forEach((el) => {
    const n = Wish.get().length;
    el.textContent = n;
    el.hidden = n === 0;
  });
}

/* ---------- Pencarian dengan saran ---------- */
const RECENT_KEY = "sukiRecent";
const POPULAR_SEARCH = [
  "smartphone",
  "mouse",
  "Samsung",
  "iPhone 17",
  "Asus",
  "Razer",
];
const STOP_WORDS = new Set(["inch", "dan", "the"]);

const getRecent = () => {
  const r = Store.read(RECENT_KEY, []);
  return Array.isArray(r) ? r : [];
};
const addRecent = (q) => {
  q = String(q || "")
    .trim()
    .toLowerCase();
  if (!q) return;
  Store.write(
    RECENT_KEY,
    [q, ...getRecent().filter((x) => x !== q)].slice(0, 5),
  );
};

function keywordPool() {
  const set = new Set();
  PRODUCTS.forEach((p) => {
    normalizeSearchQuery(
      [
        p.category,
        p.name,
        p.sku,
        ...(Array.isArray(p.colors) ? p.colors : []),
      ]
        .filter(Boolean)
        .join(" "),
    )
      .split(/\s+/)
      .forEach((w) => {
        if (w.length >= 3 && /[a-z]/.test(w) && !STOP_WORDS.has(w)) set.add(w);
      });
  });
  return [...set];
}

function highlight(text, q) {
  const t = esc(text);
  if (!q) return t;
  return normalizeSearchQuery(q)
    .split(/\s+/)
    .filter(Boolean)
    .reduce((result, term) => {
      const safe = esc(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return result.replace(
        new RegExp("(" + safe + ")", "ig"),
        "<mark>$1</mark>",
      );
    }, t);
}

function initSearch() {
  const form = document.getElementById("header-search");
  const input = document.getElementById("header-search-input");
  const box = document.getElementById("suggest");
  if (!form || !input || !box) return;

  let items = [];
  let active = -1;

  const kwItem = (k, q) =>
    `<a class="sg-item" role="option" href="shop.html?q=${encodeURIComponent(k)}" data-q="${esc(k)}"><span class="sg-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg></span><span>${highlight(k, q)}</span></a>`;

  function render(raw) {
    const q = normalizeSearchQuery(raw);
    let html = "";

    if (!q) {
      const rec = getRecent();
      if (rec.length)
        html +=
          `<div class="sg-title">Terakhir dicari <button type="button" data-clear>Hapus</button></div>` +
          rec.map((k) => kwItem(k, "")).join("");
      html +=
        `<div class="sg-title">Pencarian populer</div>` +
        POPULAR_SEARCH.map((k) => kwItem(k, "")).join("");
    } else {
      const pool = keywordPool();
      const kws = [
        ...pool.filter((k) => k.startsWith(q)),
        ...pool.filter((k) => !k.startsWith(q) && k.includes(q)),
      ].slice(0, 5);
      const prods = PRODUCTS.filter((p) => productMatches(p, q)).slice(0, 4);
      const cats = [...new Set(PRODUCTS.map((p) => p.category))].filter((c) =>
        normalizeSearchQuery(c).includes(q),
      );

      if (kws.length)
        html +=
          `<div class="sg-title">Pencarian</div>` +
          kws.map((k) => kwItem(k, q)).join("");
      if (cats.length)
        html +=
          `<div class="sg-title">Kategori</div>` +
          cats
            .map(
              (c) =>
                `<a class="sg-item" role="option" href="shop.html?cat=${encodeURIComponent(c)}"><span class="sg-ic">▦</span><span>${highlight(c, q)}<small>kategori</small></span></a>`,
            )
            .join("");
      if (prods.length)
        html +=
          `<div class="sg-title">Produk</div>` +
          prods
            .map(
              (p) =>
                `<a class="sg-item sg-prod" role="option" href="product.html?id=${p.id}"><img src="${esc(productImage(p))}" alt=""><span class="sg-main"><b>${highlight(p.name, q)}</b><small>${esc(p.category)}</small></span><span class="sg-price">${formatRupiah(p.price)}</span></a>`,
            )
            .join("");
      if (!kws.length && !cats.length && !prods.length)
        html += `<div class="sg-empty" role="status">Produk tidak ditemukan untuk “${esc(raw.trim())}”. Coba kata kunci lain.</div>`;
      html += `<a class="sg-foot" href="shop.html?q=${encodeURIComponent(raw.trim())}" data-q="${esc(raw.trim())}">Lihat semua hasil untuk “${esc(raw.trim())}”</a>`;
    }

    box.innerHTML = html;
    items = [...box.querySelectorAll(".sg-item")];
    items.forEach((item, i) => {
      item.id = `sg-option-${i}`;
      item.setAttribute("aria-selected", "false");
    });
    active = -1;
  }

  function open() {
    render(input.value);
    box.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  function close() {
    box.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }
  function mark(i) {
    items.forEach((el, n) => {
      const selected = n === i;
      el.classList.toggle("active", selected);
      el.setAttribute("aria-selected", String(selected));
    });
    if (items[i]) input.setAttribute("aria-activedescendant", items[i].id);
    if (items[i]) items[i].scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("focus", open);
  input.addEventListener("input", () => {
    open();
    document.dispatchEvent(
      new CustomEvent("mita:search", {
        detail: { query: input.value.trim() },
      }),
    );
  });
  input.addEventListener("keydown", (e) => {
    if (box.hidden && (e.key === "ArrowDown" || e.key === "ArrowUp")) open();
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      active = (active + 1) % items.length;
      mark(active);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      active = (active - 1 + items.length) % items.length;
      mark(active);
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      e.preventDefault();
      items[active].click();
    } else if (e.key === "Escape") {
      close();
    }
  });

  box.addEventListener("mousedown", (e) => e.preventDefault()); // jaga fokus input
  box.addEventListener("click", (e) => {
    if (e.target.closest("[data-clear]")) {
      Store.remove(RECENT_KEY);
      render(input.value);
      return;
    }
    const a = e.target.closest("[data-q]");
    if (a) addRecent(a.dataset.q);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) close();
  });

  const q = new URLSearchParams(location.search).get("q");
  if (q) input.value = q;
  document.dispatchEvent(
    new CustomEvent("mita:search", {
      detail: { query: input.value.trim() },
    }),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value.trim();
    addRecent(v);
    location.href = "shop.html" + (v ? "?q=" + encodeURIComponent(v) : "");
  });
}

/* ---------- Header & Footer ---------- */
function renderLayout() {
  const user = Auth.current();

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
  <header class="site-header">
    <div class="container hdr-inner">
      <a href="index.html" class="logo logo-light">Mita Techno</a>
      <button id="cat-toggle" class="cat-btn" aria-label="Buka kategori" aria-expanded="false" aria-controls="cat-menu"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg></button>

      <div class="search-wrap">
        <form class="search" id="header-search" role="search">
          <input type="search" id="header-search-input" placeholder="Cari produk di MitaElektronik" aria-label="Cari produk" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggest">
          <button type="submit" aria-label="Cari"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg></button>
        </form>
        <div class="suggest" id="suggest" role="listbox" hidden></div>
      </div>

      <div class="hdr-actions">
        <a href="shop.html?fav=1" class="icon-link" aria-label="Produk favorit"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.2 8.8c0 5-8.2 10.1-8.2 10.1S3.8 13.8 3.8 8.8a4.3 4.3 0 0 1 8.2-1.6 4.3 4.3 0 0 1 8.2 1.6Z"/></svg><span class="badge" data-wish-count hidden>0</span></a>
        <a href="cart.html" class="icon-link" aria-label="Buka keranjang"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span class="badge" data-cart-count hidden>0</span></a>
        ${
          user
            ? `<a href="profile.html" class="user-chip" title="Profil saya"><span class="avatar-sm">${esc(user.name.charAt(0).toUpperCase())}</span><span class="user-name">${esc(user.name.split(" ")[0])}</span></a>`
            : `<a href="login.html" class="btn btn-ghost btn-sm">Masuk</a><a href="register.html" class="btn btn-primary btn-sm">Daftar</a>`
        }
      </div>

      <div class="mega" id="cat-menu" hidden>
        <h3>Cari di kategori</h3>
        <div class="mega-cols">
          <div>
            <a class="mega-h" href="shop.html?cat=Smartphone">Smartphone</a>
            <a href="shop.html?q=Samsung">Samsung</a>
            <a href="shop.html?q=iPhone%2017">iPhone 17</a>
          </div>
          <div>
            <a class="mega-h" href="shop.html?cat=Mouse">Mouse</a>
            <a href="shop.html?q=Asus">Asus</a>
            <a href="shop.html?q=Razer">Razer</a>
          </div>
        </div>
        <h3>Lainnya</h3>
        <div class="mega-more">
          <a href="index.html">Beranda</a>
          <a href="shop.html">Semua Produk</a>
          <a href="shop.html?fav=1">♥ Favorit</a>
          <a href="cart.html">Keranjang</a>
          <a href="${user ? "profile.html" : "login.html"}">${user ? "Akun saya" : "Masuk"}</a>
      </div>
    </div>
  </header>`;
  }

  const footer = document.getElementById("site-footer");
  if (footer)
    footer.innerHTML = `
  <footer class="ft">
    <div class="ft-info">
      <div class="container ft-info-grid">
        <div><h4>Metode Pembayaran</h4><div class="ft-chips">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>Transfer Bank</span>
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 6h4M11 18h2"/></svg>E-Wallet</span>
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4zM3 4h18v4H3zM12 8v12"/></svg>COD</span>
        </div></div>
        <div><h4>Keamanan Transaksi</h4><div class="ft-chips">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11V8a7 7 0 0 1 14 0v3M4 11h16v10H4z"/></svg>Checkout aman</span>
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 3v5.5c0 4.5-3.1 7.8-8 9.5-4.9-1.7-8-5-8-9.5V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>Data terjaga</span>
        </div></div>
        <div><h4>Pengiriman</h4><div class="ft-chips">
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/></svg>Reguler</span>
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13.5 2.8-8 10h6l-1 8.4 8-11h-6l1-7.4Z"/></svg>Ekspres</span>
          <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h16v12H4zM2.8 4h18.4v4.5H2.8zM12 4v16.5"/></svg>Gratis ongkir</span>
        </div></div>
      </div>
    </div>
    <div class="ft-blue">
      <div class="container ft-blue-grid">
        <div>
          <a href="index.html" class="logo logo-light">MitaElektronik</a>
          <p style="margin-top:12px">Pilihan smartphone dan mouse untuk kebutuhan digital sehari-hari.</p>
          <div class="ft-social" aria-label="Media sosial"><span aria-label="Facebook">f</span><span aria-label="X">X</span><span aria-label="Instagram">ig</span><span aria-label="YouTube">yt</span><span aria-label="TikTok">tt</span></div>
        </div>
        <div><h4>Layanan Pelanggan</h4><p>Setiap hari 09.00 – 22.00 WIB</p><p style="margin-top:8px">cs@mitaelektronik.example</p></div>
        <div><h4>Belanja</h4><ul><li><a href="shop.html">Semua produk</a></li><li><a href="shop.html?cat=Smartphone">Smartphone</a></li><li><a href="shop.html?cat=Mouse">Mouse</a></li></ul></div>
        <div><h4>Akun</h4><ul><li><a href="login.html">Masuk</a></li><li><a href="register.html">Daftar</a></li><li><a href="profile.html">Profil</a></li><li><a href="cart.html">Keranjang</a></li></ul></div>
      </div>
      <div class="container ft-copy">© ${new Date().getFullYear()} MitaElektronik. Proyek belajar web, data disimpan di browser kamu.</div>
    </div>
  </footer>`;

  // Menu kategori
  const toggle = document.getElementById("cat-toggle");
  const menu = document.getElementById("cat-menu");
  if (toggle && menu) {
    const setOpen = (open) => {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", open);
      toggle.innerHTML = open
        ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>';
    };
    toggle.addEventListener("click", () => setOpen(menu.hidden));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", (e) => {
      if (
        !menu.hidden &&
        !e.target.closest(".mega") &&
        !e.target.closest("#cat-toggle")
      )
        setOpen(false);
    });
  }

  initSearch();
  updateCartBadge();
  updateWishBadge();

  // Semua tautan internal dibuka di tab yang sama
  document.querySelectorAll("a[href]").forEach((a) => {
    const h = a.getAttribute("href");
    if (h && !/^(https?:|mailto:|#)/.test(h)) a.target = "_self";
  });

  // Bayangan header saat di-scroll
  const hdr = document.querySelector(".site-header");
  const onScroll = () =>
    hdr && hdr.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Muncul pelan saat di-scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12 },
    );
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add("in"));
}

/* ---------- Kartu produk (beranda, produk, detail) ---------- */
function productCardHTML(p) {
  const out = p.stock === 0;
  return `
  <article class="product-card">
    <div class="product-image"><a href="product.html?id=${p.id}" aria-label="Lihat ${esc(p.name)}"><img src="${esc(productImage(p))}" alt="${esc(p.name)}" loading="lazy"></a><button type="button" class="wish ${Wish.has(p.id) ? "on" : ""}" data-wish="${p.id}" aria-label="Simpan ke favorit" aria-pressed="${Wish.has(p.id)}">${Wish.has(p.id) ? "♥" : "♡"}</button></div>
    <div class="product-info">
      <span class="tag">${esc(p.category)}</span>
      <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
      <p class="product-desc">${esc(p.description)}</p>
      <div class="product-meta">
        <strong class="price">${formatRupiah(p.price)}</strong>
        <span class="stock ${p.stock <= 5 && !out ? "low" : ""}">${out ? "Habis" : p.stock <= 5 ? `Stok hampir habis · sisa ${p.stock}` : `Stok ${p.stock}`}</span>
      </div>
      <button type="button" class="btn btn-primary btn-block" data-add="${p.id}" ${out ? "disabled" : ""}>${out ? "Stok habis" : "Tambah ke keranjang"}</button>
    </div>
  </article>`;
}

function bindAddButtons(root = document) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (btn) {
      if (Cart.add(btn.dataset.add)) {
        const old = btn.textContent;
        btn.textContent = "✓ Ditambahkan";
        btn.classList.add("done");
        setTimeout(() => {
          btn.textContent = old;
          btn.classList.remove("done");
        }, 1100);
      }
      return;
    }
    const w = e.target.closest("[data-wish]");
    if (w) {
      const on = Wish.toggle(w.dataset.wish);
      w.classList.toggle("on", on);
      w.textContent = on ? "♥" : "♡";
      w.setAttribute("aria-pressed", on);
      updateWishBadge();
      toast(on ? "Disimpan ke favorit." : "Dihapus dari favorit.");
    }
  });
}

document.addEventListener("DOMContentLoaded", renderLayout);

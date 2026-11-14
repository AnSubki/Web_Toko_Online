const $ = (id) => document.getElementById(id);
const form = $("checkout-form");
const user = Auth.current();

const EXPRESS_FEE = 15000;
const FREE_SHIP_MIN = 500000;
const DELIVERY = {
  regular: { name: "Reguler", days: [3, 5] },
  express: { name: "Ekspres", days: [1, 2] },
};
const PAY = {
  transfer: {
    name: "Transfer Bank",
    hint: "Pilih transfer bank, lalu bayar ke rekening toko setelah pesanan dibuat.",
  },
  ewallet: {
    name: "E-Wallet",
    hint: "Bayar lewat aplikasi e-wallet setelah pesanan dibuat.",
  },
  cod: {
    name: "Bayar di tempat (COD)",
    hint: "Bayar tunai ke kurir saat pesanan sampai. Siapkan uang pas ya.",
  },
};
const PROMOS = {
  HEMAT10: "Diskon 10% (maksimal Rp100.000)",
  GRATISONGKIR: "Gratis ongkir",
};
let promo = null;

if (user) {
  $("name").value = user.name;
  $("login-note").hidden = true;
}

const lines = () =>
  Cart.get()
    .filter((i) => findProduct(i.id))
    .map((i) => ({ p: findProduct(i.id), qty: i.qty }));

function calc() {
  const items = lines();
  const sub = items.reduce((s, l) => s + l.p.price * l.qty, 0);
  const base = Cart.shipping(sub);
  const prices = { regular: base, express: sub ? base + EXPRESS_FEE : 0 };
  const method = form.shipping.value || "regular";
  const normalShip = prices[method];
  const ship = promo === "GRATISONGKIR" ? 0 : normalShip;
  const discount =
    promo === "HEMAT10" ? Math.min(Math.round(sub * 0.1), 100000) : 0;
  const saved = items.reduce(
    (s, l) => s + ((l.p.oldPrice || l.p.price) - l.p.price) * l.qty,
    0,
  );
  return {
    items,
    sub,
    prices,
    method,
    normalShip,
    ship,
    discount,
    saved,
    total: sub + ship - discount,
  };
}

function render() {
  const c = calc();
  if (!c.items.length) {
    $("checkout-layout").hidden = true;
    $("co-bar").hidden = true;
    $("checkout-empty").hidden = false;
    return false;
  }

  $("co-count").textContent =
    c.items.reduce((s, l) => s + l.qty, 0) + " barang";
  $("co-items").innerHTML = c.items
    .map(
      ({ p, qty }) => `<div class="co-item">
        <img src="${esc(productImage(p))}" alt="">
        <div><b>${esc(p.name)}</b><small>${qty} × ${formatRupiah(p.price)}</small></div>
        <strong>${formatRupiah(p.price * qty)}</strong>
      </div>`,
    )
    .join("");

  $("price-regular").textContent =
    c.prices.regular === 0 ? "Gratis" : formatRupiah(c.prices.regular);
  $("price-express").textContent = formatRupiah(c.prices.express);

  $("co-sub").textContent = formatRupiah(c.sub);
  $("co-ship").innerHTML =
    c.ship === 0
      ? c.normalShip > 0
        ? `<s>${formatRupiah(c.normalShip)}</s>Gratis`
        : "Gratis"
      : formatRupiah(c.ship);
  $("row-disc").hidden = !c.discount;
  $("co-disc").textContent = "− " + formatRupiah(c.discount);
  $("co-total").textContent = formatRupiah(c.total);
  $("bar-total").textContent = formatRupiah(c.total);

  const left = Math.max(0, FREE_SHIP_MIN - c.sub);
  $("free-fill").style.width =
    Math.min(100, (c.sub / FREE_SHIP_MIN) * 100) + "%";
  $("free-text").textContent = left
    ? `Belanja ${formatRupiah(left)} lagi untuk gratis ongkir reguler`
    : "Kamu dapat gratis ongkir reguler";

  const saving = c.saved + c.discount;
  $("co-saving").hidden = saving <= 0;
  $("co-saving-amt").textContent = formatRupiah(saving);
  return true;
}

function applyPromo(raw) {
  const code = raw.trim().toUpperCase();
  const msg = $("promo-msg");
  if (!code) {
    promo = null;
    msg.textContent = "";
    msg.className = "promo-msg";
  } else if (!PROMOS[code]) {
    promo = null;
    msg.textContent = "Kode promo tidak ditemukan.";
    msg.className = "promo-msg err";
  } else {
    promo = code;
    msg.textContent = "✓ " + PROMOS[code] + " dipakai";
    msg.className = "promo-msg ok";
    toast("Kode promo dipakai.");
  }
  render();
}
$("promo-apply").addEventListener("click", () => applyPromo($("promo").value));
$("promo").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    applyPromo(e.target.value);
  }
});
document.querySelectorAll("[data-code]").forEach((b) =>
  b.addEventListener("click", () => {
    $("promo").value = b.dataset.code;
    applyPromo(b.dataset.code);
  }),
);

form.addEventListener("change", (e) => {
  if (e.target.name === "shipping") render();
  if (e.target.name === "payment") {
    const hint = $("pay-hint");
    hint.textContent = PAY[e.target.value].hint;
    hint.hidden = false;
    setError("payment", "", $("pay-group"));
  }
});

/* ---------- Validasi ---------- */
function setError(key, msg, el) {
  const t = document.querySelector(`[data-error="${key}"]`);
  if (t) t.textContent = msg;
  if (el) el.classList.toggle("invalid", Boolean(msg));
  return !msg;
}

/* ---------- Confetti ---------- */
function confetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#047857", "#10b981", "#065f46", "#ecfdf5", "#e2e8f0"];
  for (let i = 0; i < 48; i++) {
    const s = document.createElement("i");
    s.className = "confetti";
    s.style.left = Math.random() * 100 + "vw";
    s.style.background = colors[i % colors.length];
    s.style.setProperty("--x", Math.random() * 160 - 80 + "px");
    s.style.setProperty("--r", Math.random() * 720 - 360 + "deg");
    s.style.setProperty("--t", 1.8 + Math.random() * 1.6 + "s");
    s.style.animationDelay = Math.random() * 0.4 + "s";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 4200);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const c = calc();
  if (!c.items.length) return toast("Keranjang masih kosong.", "error");

  const name = $("name").value.trim();
  const phone = $("phone").value.trim().replace(/[\s-]/g, "");
  const address = $("address").value.trim();
  const note = $("note").value.trim();
  const payment = form.payment.value;

  const ok = [
    setError(
      "name",
      name.length < 3 ? "Nama minimal 3 karakter." : "",
      $("name"),
    ),
    setError(
      "phone",
      /^(\+62|62|0)8\d{8,12}$/.test(phone)
        ? ""
        : "Gunakan nomor HP Indonesia, contoh 081234567890.",
      $("phone"),
    ),
    setError(
      "address",
      address.length < 10
        ? "Alamat minimal 10 karakter, lengkap dengan kota."
        : "",
      $("address"),
    ),
    setError(
      "payment",
      payment ? "" : "Pilih metode pembayaran.",
      $("pay-group"),
    ),
  ].every(Boolean);
  if (!ok) {
    const first = document.querySelector(".invalid");
    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      if (first.focus && first.tagName !== "DIV")
        first.focus({ preventScroll: true });
    }
    return;
  }

  const over = c.items.find(
    (l) => !Number.isSafeInteger(l.qty) || l.qty <= 0 || l.qty > l.p.stock,
  );
  if (over)
    return toast(
      `Stok ${over.p.name} hanya ${over.p.stock}. Ubah jumlah di keranjang.`,
      "error",
    );

  const order = {
    id: "ME-" + Date.now().toString().slice(-8),
    email: user ? user.email : null,
    customer: { name, phone, address },
    note,
    payment: PAY[payment].name,
    shippingMethod: DELIVERY[c.method].name,
    promo,
    items: c.items.map((l) => ({
      id: l.p.id,
      name: l.p.name,
      qty: l.qty,
      price: l.p.price,
    })),
    subtotal: c.sub,
    shipping: c.ship,
    discount: c.discount,
    total: c.total,
    createdAt: new Date().toISOString(),
    stockReserved: true,
  };
  const orders = Store.read(KEYS.orders, []);
  if (!Array.isArray(orders))
    return toast("Data pesanan tidak dapat dibaca. Coba lagi.", "error");
  const inventoryBefore = c.items.map(({ p }) => ({
    id: p.id,
    stock: p.stock,
  }));
  try {
    Inventory.setMany(
      c.items.map(({ p, qty }) => ({ id: p.id, stock: p.stock - qty })),
    );
    orders.unshift(order);
    Store.write(KEYS.orders, orders);
  } catch (error) {
    try {
      Inventory.setMany(inventoryBefore);
    } catch (rollbackError) {
      console.error(
        "Gagal memulihkan stok setelah checkout gagal.",
        rollbackError,
      );
    }
    console.error("Gagal menyimpan pesanan checkout.", error);
    return toast("Pesanan tidak dapat disimpan. Silakan coba lagi.", "error");
  }
  Cart.clear();

  const addDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };
  const fmt = (d) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const [a, b] = DELIVERY[c.method].days;

  $("order-id").textContent = order.id;
  $("order-total").textContent = formatRupiah(order.total);
  $("ok-ship").textContent = order.shippingMethod;
  $("ok-eta").textContent = `${fmt(addDays(a))} – ${fmt(addDays(b))}`;
  $("ok-pay").textContent = order.payment;
  $("success-profile").hidden = !user;
  $("co-bar").hidden = true;
  $("success-modal").hidden = false;
  confetti();
});

render();

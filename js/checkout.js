const $ = (id) => document.getElementById(id);
const form = $("checkout-form");

const EXPRESS_FEE = 15000;
const PAY = {
  transfer: {
    name: "Transfer Bank",
    hint:
      "Simulasi: pilih transfer bank, lalu bayar ke rekening toko setelah pesanan dibuat.",
  },
  ewallet: {
    name: "E-Wallet",
    hint: "Simulasi: pembayaran E-Wallet dicatat setelah pesanan dibuat.",
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

const lines = () =>
  Cart.get()
    .filter((i) => findProduct(i.id))
    .map((i) => ({ p: findProduct(i.id), qty: i.qty }));

function calc() {
  const items = lines();
  const sub = items.reduce((s, l) => s + l.p.price * l.qty, 0);
  const prices = { regular: 0, express: sub ? EXPRESS_FEE : 0 };
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

  $("free-fill").style.width = "100%";
  $("free-text").textContent = "Kamu dapat gratis ongkir reguler";

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
  }
});

window.getCheckoutCalculation = () => ({ ...calc(), promo });

render();

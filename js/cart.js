const listEl = document.getElementById("cart-list");
const summaryEl = document.getElementById("cart-summary");

function render() {
  const cart = Cart.get().filter((i) => findProduct(i.id));
  if (cart.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg></div><h3>Keranjang masih kosong</h3><p>Pilih produk yang kamu butuhkan, lalu kembali ke sini untuk checkout.</p><a href="shop.html" class="btn btn-primary">Lihat produk</a></div>`;
    summaryEl.hidden = true;
    return;
  }
  summaryEl.hidden = false;
  listEl.innerHTML = cart
    .map((i) => {
      const p = findProduct(i.id);
      return `<div class="cart-item">
      <img src="${esc(productImage(p))}" alt="${esc(p.name)}">
      <div class="cart-info">
        <h3>${esc(p.name)}</h3>
        <p class="muted">${formatRupiah(p.price)} · ${esc(p.category)}</p>
        <button type="button" class="link-danger" data-remove="${p.id}">Hapus</button>
      </div>
      <div class="qty" role="group" aria-label="Jumlah ${esc(p.name)}">
        <button type="button" data-dec="${p.id}" aria-label="Kurangi jumlah ${esc(p.name)}">−</button>
        <span>${i.qty}</span>
        <button type="button" data-inc="${p.id}" aria-label="Tambah jumlah ${esc(p.name)}" ${i.qty >= p.stock ? "disabled" : ""}>+</button>
      </div>
      <strong class="line-total">${formatRupiah(p.price * i.qty)}</strong>
    </div>`;
    })
    .join("");

  const sub = Cart.subtotal(),
    ship = Cart.shipping(sub);
  document.getElementById("sum-items").textContent = Cart.count();
  document.getElementById("sum-sub").textContent = formatRupiah(sub);
  document.getElementById("sum-ship").textContent =
    ship === 0 ? "Gratis" : formatRupiah(ship);
  document.getElementById("sum-total").textContent = formatRupiah(sub + ship);
  document.getElementById("ship-hint").textContent =
    ship === 0
      ? "Kamu dapat gratis ongkir."
      : `Belanja ${formatRupiah(500000 - sub)} lagi untuk gratis ongkir.`;
}

listEl.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const row = (id) => Cart.get().find((i) => i.id === Number(id));
  if (t.dataset.inc) {
    const item = row(t.dataset.inc);
    if (!item) return;
    Cart.setQty(Number(t.dataset.inc), item.qty + 1);
  } else if (t.dataset.dec) {
    const item = row(t.dataset.dec);
    if (!item) return;
    Cart.setQty(Number(t.dataset.dec), item.qty - 1);
  }
  else if (t.dataset.remove) {
    Cart.remove(Number(t.dataset.remove));
    toast("Produk dihapus dari keranjang.");
  } else return;
  render();
});
render();

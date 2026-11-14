/* ==========================================================
  MitaElektronik — halaman detail produk
========================================================== */
const params = new URLSearchParams(location.search);
const p = findProduct(params.get("id"));
const $ = (id) => document.getElementById(id);

if (!p) {
  $("pd-layout").hidden = true;
  $("pd-related").hidden = true;
  $("pd-missing").hidden = false;
  $("crumbs").innerHTML =
    `<a href="index.html">Beranda</a><span>›</span><b>Produk tidak ditemukan</b>`;
} else {
  Viewed.add(p.id);
  const oldPrice = p.oldPrice || p.price;
  const disc =
    oldPrice > p.price
      ? Math.round(((oldPrice - p.price) / oldPrice) * 100)
      : 0;

  document.title = `${p.name} — MitaElektronik`;
  $("crumbs").innerHTML =
    `<a href="index.html">Beranda</a><span>›</span>` +
    `<a href="shop.html?cat=${encodeURIComponent(p.category)}">${esc(p.category)}</a><span>›</span><b>${esc(p.name)}</b>`;

  const images = productImages(p);
  const mainImage = $("pd-img");
  const thumbnailList = $("pd-thumbs");
  thumbnailList.hidden = images.length < 2;
  thumbnailList.innerHTML = images
    .map(
      (_, index) =>
        `<button type="button" class="${index === 0 ? "active" : ""}" data-image-index="${index}" aria-label="Lihat foto ${index + 1} produk ${esc(p.name)}" aria-pressed="${index === 0}"><img src="${esc(images[index])}" alt="" loading="lazy"></button>`,
    )
    .join("");

  function showImage(index) {
    const image = images[index];
    if (!image) return;
    mainImage.src = image;
    mainImage.alt = `Foto ${index + 1} ${p.name}`;
    thumbnailList.querySelectorAll("[data-image-index]").forEach((button) => {
      const selected = Number(button.dataset.imageIndex) === index;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  thumbnailList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-image-index]");
    if (button) showImage(Number(button.dataset.imageIndex));
  });
  if (images.length) showImage(0);

  $("pd-name").textContent = p.name;
  $("pd-sku").textContent = p.sku || "";
  $("pd-sold").textContent = `Terjual ${p.sold ?? 0}`;
  $("pd-price").textContent = formatRupiah(p.price);
  $("pd-disc").innerHTML = disc
    ? `<s>${formatRupiah(oldPrice)}</s><span class="tag-red">Diskon ${disc}%</span><span class="tag-save">Hemat ${formatRupiah(oldPrice - p.price)}</span>`
    : "";

  $("pd-dl").innerHTML =
    `<dt>Kategori</dt><dd>${esc(p.category)}</dd>` +
    `<dt>Kode produk</dt><dd>${esc(p.sku || "-")}</dd>` +
    `<dt>Stok</dt><dd>${p.stock <= 0 ? "Habis" : p.stock <= 5 ? `Hampir habis · tersisa ${p.stock} unit` : `${p.stock} unit`}</dd>` +
    `<dt>Terjual</dt><dd>${p.sold ?? 0}</dd>`;
  $("pd-desc").textContent = p.description;
  $("pd-stock-dl").innerHTML =
    `<dt>Status</dt><dd>${p.stock <= 0 ? "Habis" : p.stock <= 5 ? "Stok hampir habis" : "Tersedia"}</dd>` +
    `<dt>Jumlah stok</dt><dd>${p.stock} unit</dd>` +
    `<dt>Ongkir</dt><dd>${formatRupiah(20000)} (gratis untuk belanja di atas Rp500.000)</dd>`;

  // Tab
  document.querySelectorAll("[data-pdtab]").forEach((b) =>
    b.addEventListener("click", () => {
      document
        .querySelectorAll("[data-pdtab]")
        .forEach((x) => x.classList.toggle("active", x === b));
      $("pd-spec").hidden = b.dataset.pdtab !== "spec";
      $("pd-stock").hidden = b.dataset.pdtab !== "stock";
    }),
  );

  // Jumlah
  let qty = 1;
  const syncQty = () => {
    $("pd-qty").textContent = qty;
    $("qty-dec").disabled = qty <= 1;
    $("qty-inc").disabled = qty >= p.stock;
  };
  $("qty-dec").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    syncQty();
  });
  $("qty-inc").addEventListener("click", () => {
    qty = Math.min(p.stock, qty + 1);
    syncQty();
  });
  syncQty();

  function addToCart() {
    return Cart.add(p.id, qty);
  }

  if (p.stock <= 0) {
    $("btn-cart").disabled = true;
    $("btn-buy").disabled = true;
    $("btn-buy").textContent = "Stok habis";
  }
  $("btn-cart").addEventListener("click", addToCart);
  $("btn-buy").addEventListener("click", () => {
    if (addToCart()) location.href = "checkout.html";
  });

  // Wishlist & share
  const wishBtn = $("btn-wish");
  const syncWish = () =>
    (wishBtn.textContent = (Wish.has(p.id) ? "♥" : "♡") + " Wishlist");
  wishBtn.addEventListener("click", () => {
    const on = Wish.toggle(p.id);
    syncWish();
    updateWishBadge();
    toast(on ? "Disimpan ke favorit." : "Dihapus dari favorit.");
  });
  syncWish();

  $("btn-share").addEventListener("click", () => {
    const url = location.href;
    if (navigator.share)
      navigator.share({ title: p.name, url }).catch(() => {});
    else if (navigator.clipboard)
      navigator.clipboard
        .writeText(url)
        .then(() => toast("Tautan produk disalin."));
    else toast("Salin tautan dari address bar.", "error");
  });

  // Produk lain
  const same = PRODUCTS.filter(
    (x) => x.id !== p.id && x.category === p.category,
  );
  const others = PRODUCTS.filter(
    (x) => x.id !== p.id && x.category !== p.category,
  );
  const rel = $("related-products");
  rel.innerHTML = [...same, ...others]
    .slice(0, 4)
    .map(productCardHTML)
    .join("");
  bindAddButtons(rel);
}

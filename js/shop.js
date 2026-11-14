const grid = document.getElementById("product-container");
const searchInput = document.getElementById("search-product");
const sortSelect = document.getElementById("sort-product");
const colorSelect = document.getElementById("color-filter");
const chips = document.getElementById("category-chips");
const totalText = document.getElementById("product-total");
const emptyBox = document.getElementById("empty-product");

const params = new URLSearchParams(location.search);
const requestedCategory = params.get("cat");
const categories = [
  "Semua",
  ...new Set([
    ...PRODUCTS.map((p) => p.category),
    ...(requestedCategory ? [requestedCategory] : []),
  ]),
];
const colors = [
  ...new Set(
    PRODUCTS.flatMap((p) => (Array.isArray(p.colors) ? p.colors : [])),
  ),
].sort((a, b) => a.localeCompare(b, "id"));
let activeCat = requestedCategory || "Semua";
let activeColor = params.get("color") || "";
if (!colors.includes(activeColor)) activeColor = "";
const favOnly = params.get("fav") === "1";
const dealOnly = params.get("deal") === "1";
const maxPrice = Number(params.get("max")) || 0; // contoh: shop.html?max=500000
searchInput.value = params.get("q") || "";

function renderChips() {
  chips.innerHTML = categories
    .map(
      (c) =>
        `<button type="button" class="chip ${c === activeCat ? "active" : ""}" data-cat="${esc(c)}" aria-pressed="${c === activeCat}">${esc(c)}</button>`,
    )
    .join("");
}

function renderColors() {
  colorSelect.innerHTML =
    `<option value="">Semua warna</option>` +
    colors
      .map((color) => `<option value="${esc(color)}">${esc(color)}</option>`)
      .join("");
  colorSelect.value = activeColor;
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  let list = PRODUCTS.filter(
    (p) =>
      (activeCat === "Semua" || p.category === activeCat) &&
      (!activeColor ||
        (Array.isArray(p.colors) && p.colors.includes(activeColor))) &&
      (!favOnly || Wish.has(p.id)) &&
      (!dealOnly || p.oldPrice > p.price) &&
      (!maxPrice || p.price <= maxPrice) &&
      productMatches(p, q),
  );

  const sort = sortSelect.value;
  if (sort === "low") list.sort((a, b) => a.price - b.price);
  if (sort === "high") list.sort((a, b) => b.price - a.price);
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

  grid.innerHTML = list.map(productCardHTML).join("");
  emptyBox.hidden = list.length > 0;
  const notes = [];
  if (activeColor) notes.push("warna " + activeColor);
  if (favOnly) notes.push("favorit");
  if (dealOnly) notes.push("diskon");
  if (maxPrice) notes.push("harga sampai " + formatRupiah(maxPrice));
  totalText.textContent = `${list.length} produk ditemukan${
    notes.length ? " (" + notes.join(", ") + ")" : ""
  }`;
}

chips.addEventListener("click", (e) => {
  const b = e.target.closest("[data-cat]");
  if (!b) return;
  activeCat = b.dataset.cat;
  renderChips();
  render();
});
document.getElementById("reset-filter").addEventListener("click", () => {
  location.href = "shop.html";
});
searchInput.addEventListener("input", render);
document.addEventListener("mita:search", (event) => {
  searchInput.value = event.detail.query;
  render();
});
sortSelect.addEventListener("change", render);
colorSelect.addEventListener("change", () => {
  activeColor = colorSelect.value;
  render();
});
bindAddButtons(grid);
renderChips();
renderColors();
render();

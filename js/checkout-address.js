(() => {
  const KEY = "mitaAddresses";
  const list = document.getElementById("checkout-address-list");
  const loginNote = document.getElementById("login-note");
  const user = Auth.current();
  let addresses = [];

  if (user) loginNote.hidden = true;

  function readAddresses() {
    if (!user || !user.email) return [];
    const saved = Store.read(KEY, {});
    const rows =
      saved && typeof saved === "object" && !Array.isArray(saved)
        ? saved[user.email]
        : [];
    return Array.isArray(rows) ? rows : [];
  }

  function render(preferredId) {
    addresses = readAddresses();
    const selected =
      addresses.find((address) => String(address.id) === String(preferredId)) ||
      addresses.find((address) => address.main) ||
      addresses[0];

    if (!selected) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">📍</div>
        <h3>Belum ada alamat tersimpan</h3>
        <p>Tambahkan alamat di profil sebelum membuat pesanan.</p>
        <a href="profile.html#alamat" class="btn btn-primary">Tambah alamat</a>
      </div>`;
      return;
    }

    list.innerHTML = addresses
      .map(
        (address) => `<label class="co-address-option">
          <input type="radio" name="saved-address" value="${esc(address.id)}" ${
            String(address.id) === String(selected.id) ? "checked" : ""
          }>
          <span class="co-address-card">
            <span class="co-address-top">
              <span class="tag">${esc(address.label || "Alamat")}</span>
              ${address.main ? '<span class="co-address-main">★ Utama</span>' : ""}
            </span>
            <b>${esc(address.recipient)}</b>
            <span class="muted">${esc(address.phone)}</span>
            <span class="co-address-detail">${esc(address.address)}</span>
          </span>
        </label>`,
      )
      .join("");
  }

  list.addEventListener("change", (event) => {
    if (event.target.name === "saved-address") {
      list.querySelectorAll(".co-address-card").forEach((card) => {
        card.classList.toggle(
          "selected",
          card.previousElementSibling.checked,
        );
      });
    }
  });

  window.getSelectedAddress = () => {
    const checked = list.querySelector('input[name="saved-address"]:checked');
    const address =
      checked &&
      addresses.find((row) => String(row.id) === String(checked.value));
    return address
      ? {
          name: address.recipient,
          phone: address.phone,
          detail: address.address,
          label: address.label,
        }
      : null;
  };

  window.addEventListener("storage", (event) => {
    if (event.key === KEY || event.key === null) {
      const current = list.querySelector('input[name="saved-address"]:checked');
      render(current ? current.value : null);
    }
  });

  render();
})();

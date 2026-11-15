(function () {
  const me = Auth.current();
  if (!me) {
    location.replace("login.html?next=profile.html");
    return;
  }

  const $ = (id) => document.getElementById(id);
  const SPEED = 1; // ubah ke 600 untuk demo cepat: status pesanan berganti ±600x lebih cepat
  const PHONE_RE = /^(\+62|62|0)8\d{8,12}$/;
  const STEPS = ["Diproses", "Dikemas", "Dikirim", "Selesai"];
  const PAYMENT_STATUSES = [
    "Diproses (bayar di tempat)",
    "Menunggu pembayaran",
    "Dibayar",
  ];
  const TRACKING_STEPS = [
    "Pesanan Diproses",
    "Kurir Menjemput Paket",
    "Kurir Dalam Perjalanan",
    "Pesanan Tiba",
  ];
  const TRACKING_MILESTONES = [0, 0.08, 0.24, 1];
  const TRACKING_DURATION = 30000;
  const FILTERS = ["Semua", ...STEPS, ...PAYMENT_STATUSES, "Dibatalkan"];
  const TABS = ["ringkasan", "pesanan", "favorit", "alamat", "akun"];
  const COLORS = [
    "var(--hero-gradient)",
    "linear-gradient(135deg,var(--primary),var(--primary-hover))",
    "linear-gradient(135deg,var(--ink-black),var(--primary))",
    "linear-gradient(135deg,var(--primary-hover),var(--primary))",
    "linear-gradient(135deg,var(--ink-black),var(--primary-hover))",
  ];
  const LEVELS = [
    { n: "Bronze", min: 0 },
    { n: "Silver", min: 1000000 },
    { n: "Gold", min: 5000000 },
  ];
  const LEVEL_ICON =
    '<svg class="pf-level-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="9" r="5.5"/><path d="m9.2 14-1 6 3.8-2 3.8 2-1-6M12 6.7l.7 1.5 1.7.2-1.2 1.1.3 1.6-1.5-.8-1.5.8.3-1.6-1.2-1.1 1.7-.2z"/></svg>';
  const VOUCHERS = [
    {
      code: "HEMAT10",
      icon: "🏷️",
      title: "Diskon 10%",
      desc: "Maksimal Rp100.000, pakai di halaman checkout",
    },
    {
      code: "GRATISONGKIR",
      icon: "🚚",
      title: "Gratis ongkir",
      desc: "Berlaku untuk semua pesanan",
    },
  ];

  /* ---------- Bantuan ---------- */
  const arr = (v) => (Array.isArray(v) ? v : []);
  const getUser = () => Auth.users().find((u) => u.email === me.email);
  const getOrders = () =>
    arr(Store.read(KEYS.orders, [])).filter((o) => o.email === me.email);
  const dateText = (iso) =>
    new Date(iso).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  function statusOf(o) {
    if (
      o.status === "Dibatalkan" ||
      o.status === "Selesai" ||
      PAYMENT_STATUSES.includes(o.status)
    )
      return o.status;
    const hours =
      ((Date.now() - new Date(o.createdAt).getTime()) / 36e5) * SPEED;
    return hours < 1 ? "Diproses" : hours < 24 ? "Dikemas" : "Dikirim";
  }
  function setStatus(id, status) {
    const all = arr(Store.read(KEYS.orders, []));
    const o = all.find((x) => x.id === id);
    if (o) {
      o.status = status;
      Store.write(KEYS.orders, all);
    }
  }
  function copy(text, okMsg) {
    if (navigator.clipboard)
      navigator.clipboard
        .writeText(text)
        .then(() => toast(okMsg))
        .catch(() => toast("Gagal menyalin.", "error"));
    else toast("Salin manual: " + text, "error");
  }
  function note(el, text, type) {
    el.textContent = text;
    el.className = "pf-msg" + (text ? " show " + type : "");
  }
  const empty = (icon, title, text, link) =>
    `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p>${link || ""}</div>`;

  const spentTotal = () =>
    getOrders()
      .filter((o) => statusOf(o) !== "Dibatalkan")
      .reduce((s, o) => s + (Number(o.total) || 0), 0);

  function levelOf(spent) {
    let i = 0;
    LEVELS.forEach((l, n) => {
      if (spent >= l.min) i = n;
    });
    return { cur: LEVELS[i], next: LEVELS[i + 1] || null };
  }

  /* ---------- Alamat (disimpan per email) ---------- */
  const ADDR_KEY = "mitaAddresses";
  const VOUCHER_KEY = "mitaClaimedVouchers";
  const getAddr = () => arr((Store.read(ADDR_KEY, {}) || {})[me.email]);
  function getClaimedVouchers() {
    const claims = Store.read(VOUCHER_KEY, {});
    return claims && typeof claims === "object" && !Array.isArray(claims)
      ? arr(claims[me.email])
      : [];
  }
  function saveAddr(list) {
    const all = Store.read(ADDR_KEY, {}) || {};
    all[me.email] = list;
    Store.write(ADDR_KEY, all);
  }

  function renderVouchers() {
    const claimed = new Set(getClaimedVouchers());
    const available = VOUCHERS.filter((voucher) => !claimed.has(voucher.code));
    $("voucher-list").innerHTML = available.length
      ? available
          .map(
            (v) => `<div class="vch"><div class="vch-l">${v.icon}</div>
              <div class="vch-m"><b>${v.title}</b><small>${v.desc}</small><br><code>${v.code}</code></div>
              <button type="button" data-claim="${v.code}">Klaim</button></div>`,
          )
          .join("")
      : `<p class="muted">Semua voucher sudah diklaim.</p>`;
  }

  function claimVoucher(code) {
    if (!VOUCHERS.some((voucher) => voucher.code === code)) return;
    const claims = Store.read(VOUCHER_KEY, {});
    const all =
      claims && typeof claims === "object" && !Array.isArray(claims)
        ? claims
        : {};
    const claimed = arr(all[me.email]);
    if (claimed.includes(code)) return;
    all[me.email] = [...claimed, code];
    try {
      Store.write(VOUCHER_KEY, all);
    } catch (error) {
      console.error("Gagal menyimpan klaim voucher.", error);
      toast("Voucher tidak dapat diklaim. Silakan coba lagi.", "error");
      return;
    }
    renderVouchers();
    toast("Voucher " + code + " berhasil diklaim.");
  }

  /* ---------- Kepala halaman ---------- */
  const account = getUser();
  const avatar = $("avatar");
  avatar.textContent = me.name.charAt(0).toUpperCase();
  avatar.style.background =
    COLORS[(account && account.color) || 0] || COLORS[0];
  $("greet-name").textContent = me.name.split(" ")[0];
  $("profile-email").textContent = me.email;

  /* ---------- Tab ---------- */
  function showTab(t) {
    if (!TABS.includes(t)) t = "ringkasan";
    document.querySelectorAll("[data-tab]").forEach((b) => {
      const on = b.dataset.tab === t;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });
    document
      .querySelectorAll("[data-panel]")
      .forEach((p) => (p.hidden = p.dataset.panel !== t));
    document.querySelectorAll(".ord-detail").forEach((detail) => {
      if (detail._trackingStop) detail._trackingStop();
      detail._trackingStop = null;
      if (!detail.hidden && detail.closest("[data-panel]")?.dataset.panel === t)
        detail._trackingStop = runTracking(detail);
    });
  }
  function goTab(t) {
    history.replaceState(null, "", "#" + t);
    showTab(t);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab], [data-goto]");
    if (b) goTab(b.dataset.tab || b.dataset.goto);
  });
  window.addEventListener("hashchange", () => showTab(location.hash.slice(1)));

  /* ---------- Penghitung di menu ---------- */
  function refreshCounts() {
    [
      ["n-orders", getOrders().length],
      ["n-fav", Wish.get().length],
      ["n-addr", getAddr().length],
    ].forEach(([id, n]) => {
      $(id).textContent = n;
      $(id).hidden = n === 0;
    });
  }

  /* ---------- Ringkasan ---------- */
  function renderSummary() {
    const os = getOrders();
    const spent = spentTotal();
    const stats = [
      ["📦", "Pesanan", os.length, "pesanan", "var(--primary-soft)"],
      ["💰", "Total belanja", formatRupiah(spent), "pesanan", "var(--surface)"],
      ["♥", "Favorit", Wish.get().length, "favorit", "var(--primary-soft)"],
      ["🛒", "Isi keranjang", Cart.count() + " barang", "", "var(--surface)"],
    ];
    $("pf-stats").innerHTML = stats
      .map(([ic, label, val, go, bg]) => {
        const open = go
          ? `button type="button" data-goto="${go}"`
          : `a href="cart.html"`;
        const close = go ? "button" : "a";
        return `<${open} class="pf-stat"><i style="background:${bg}">${ic}</i><div><b>${val}</b><span>${label}</span></div></${close}>`;
      })
      .join("");

    const { cur, next } = levelOf(spent);
    $("level-chip").innerHTML = `${LEVEL_ICON}<span>Member ${cur.n}</span>`;
    const pct = next
      ? Math.min(
          100,
          Math.round(((spent - cur.min) / (next.min - cur.min)) * 100),
        )
      : 100;
    $("level-card").innerHTML = `
      <div class="lv-top"><div class="lv-ic">${LEVEL_ICON}</div><div><small>Level member</small><h2>${cur.n}</h2></div></div>
      <p>Total belanja <b>${formatRupiah(spent)}</b></p>
      <div class="lv-track"><div class="lv-fill" style="width:${pct}%"></div></div>
      <span class="lv-note">${
        next
          ? `Belanja ${formatRupiah(next.min - spent)} lagi untuk naik ke ${LEVEL_ICON} ${next.n}`
          : "Kamu sudah di level tertinggi."
      }</span>`;

    renderVouchers();

    $("recent-orders").innerHTML = os.length
      ? os.slice(0, 2).map(orderCard).join("")
      : empty(
          "📦",
          "Belum ada pesanan",
          "Pesanan yang kamu buat saat login akan muncul di sini.",
          `<a href="shop.html" class="btn btn-primary">Mulai belanja</a>`,
        );
  }

  /* ---------- Pesanan ---------- */
  let filter = "Semua";

  function orderItemName(item) {
    const product = item && findProduct(item.id);
    return product
      ? product.name
      : item && item.name
        ? item.name
        : "Produk tidak tersedia";
  }

  function orderCard(o) {
    const st = statusOf(o);
    const items = arr(o.items);
    const sub = o.subtotal ?? items.reduce((s, i) => s + i.price * i.qty, 0);
    const ship = o.shipping ?? 0;
    const disc = o.discount ?? 0;
    const thumbs = items
      .slice(0, 3)
      .map((i) => {
        const p = findProduct(i.id);
        return p ? `<img src="${esc(productImage(p))}" alt="">` : "";
      })
      .join("");
    const names = items.length
      ? esc(orderItemName(items[0])) +
        (items.length > 1 ? ` +${items.length - 1} produk lain` : "")
      : "-";
    const idx = PAYMENT_STATUSES.includes(st) ? 0 : STEPS.indexOf(st);
    const tl =
      st === "Dibatalkan"
        ? `<p class="ord-cancel">Pesanan ini dibatalkan.</p>`
        : `<ol class="tl">${STEPS.map(
            (s, n) =>
              `<li class="${n <= idx ? "on" : ""}"><span>${n < idx || st === "Selesai" ? "✓" : n + 1}</span><em>${s}</em></li>`,
          ).join("")}</ol>`;
    const tracking =
      st === "Dibatalkan"
        ? ""
        : `<section class="tracking-demo" aria-label="Simulasi pelacakan pesanan">
            <div class="tracking-heading">
              <div><h4>Live Maps Tracking</h4><span class="tracking-demo-tag">SIMULASI</span></div>
              <p class="tracking-current" role="status" aria-live="polite">${TRACKING_STEPS[0]}</p>
            </div>
            <div class="tracking-map" role="img" aria-label="Peta simulasi dari toko ke alamat tujuan">
              <svg class="tracking-svg" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true">
                <path class="tracking-road" d="M22 236 L128 236 Q160 236 183 211 L245 143 Q262 124 290 124 L383 124 Q408 124 428 105 L500 39 Q520 21 546 21 L590 21" />
                <path class="tracking-route" d="M58 236 L128 236 Q160 236 183 211 L245 143 Q262 124 290 124 L383 124 Q408 124 428 105 L500 39 Q520 21 546 21 L565 21" />
                <g class="tracking-place tracking-store" transform="translate(58 236)">
                  <circle r="19"></circle><text y="6" text-anchor="middle">T</text>
                  <text class="tracking-place-label" x="0" y="-29" text-anchor="middle">Toko</text>
                </g>
                <g class="tracking-place tracking-home" transform="translate(565 21)">
                  <circle r="19"></circle><text y="6" text-anchor="middle">R</text>
                  <text class="tracking-place-label" x="-4" y="39" text-anchor="end">Tujuan</text>
                </g>
                <g class="tracking-courier" transform="translate(58 236)">
                  <circle r="18"></circle><text y="7" text-anchor="middle">K</text>
                </g>
              </svg>
            </div>
            <ol class="tracking-progress">${TRACKING_STEPS.map(
              (step, n) => `<li><span>${n + 1}</span><em>${step}</em></li>`,
            ).join("")}</ol>
            <div class="tracking-footer">
              <span>Kurir sedang menuju alamat penerima</span>
              <button type="button" class="pf-btn" data-act="restart-tracking">Ulangi simulasi</button>
            </div>
          </section>`;
    const id = esc(o.id);
    const acts = [
      `<button type="button" class="pf-btn" data-act="detail" data-id="${id}">Detail</button>`,
      `<button type="button" class="pf-btn" data-act="again" data-id="${id}">Pesan lagi</button>`,
    ];
    if (
      st === "Diproses" ||
      st === "Diproses (bayar di tempat)" ||
      st === "Dikemas"
    )
      acts.push(
        `<button type="button" class="pf-btn danger" data-act="cancel" data-id="${id}">Batalkan</button>`,
      );
    if (st === "Dikirim")
      acts.push(
        `<button type="button" class="pf-btn primary" data-act="receive" data-id="${id}">Pesanan diterima</button>`,
      );

    const info = [
      ["Penerima", o.customer && o.customer.name],
      ["Telepon", o.customer && o.customer.phone],
      ["Alamat", o.customer && o.customer.address],
      ["Pengiriman", o.shippingMethod],
      ["Pembayaran", o.payment],
      ["Catatan", o.note],
      ["Kode promo", o.promo],
      ["Alasan pembatalan", o.cancellationReason],
      ["Waktu pembatalan", o.cancelledAt && dateText(o.cancelledAt)],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`)
      .join("");

    return `<article class="ord" data-oid="${id}">
      <div class="ord-top">
        <div><b>${id} <button type="button" class="pf-link" data-act="copyid" data-id="${id}" aria-label="Salin nomor pesanan">salin</button></b><span class="muted">${dateText(o.createdAt)}</span></div>
        <span class="st st-${PAYMENT_STATUSES.includes(st) ? "Diproses" : st}">${st}</span>
      </div>
      <div class="ord-items"><div class="ord-thumbs">${thumbs}</div><span class="ord-names">${names}</span></div>
      <div class="ord-foot"><strong>${formatRupiah(o.total)}</strong><div class="ord-acts">${acts.join("")}</div></div>
      <div class="ord-detail" hidden>
        ${tracking}
        ${tl}
        <h4>Produk</h4>
        <ul>${items.map((i) => `<li class="row"><span>${esc(orderItemName(i))} <span class="muted">× ${i.qty}</span></span><b>${formatRupiah(i.price * i.qty)}</b></li>`).join("")}</ul>
        <h4>Pengiriman &amp; pembayaran</h4>
        <dl>${info}</dl>
        <div class="ord-sum">
          <div class="row"><span>Subtotal</span><span>${formatRupiah(sub)}</span></div>
          <div class="row"><span>Ongkir</span><span>${ship ? formatRupiah(ship) : "Gratis"}</span></div>
          ${disc ? `<div class="row"><span>Diskon promo</span><span>− ${formatRupiah(disc)}</span></div>` : ""}
          <div class="row t"><span>Total</span><span>${formatRupiah(o.total)}</span></div>
        </div>
      </div>
    </article>`;
  }

  function runTracking(detail) {
    const map = detail.querySelector(".tracking-map");
    const route = detail.querySelector(".tracking-route");
    const courier = detail.querySelector(".tracking-courier");
    const current = detail.querySelector(".tracking-current");
    const steps = detail.querySelectorAll(".tracking-progress li");
    if (!map || !route || !courier || !current) return;

    let frame = 0;
    const started = performance.now();
    const routeLength = route.getTotalLength();
    const tick = (now) => {
      if (detail.hidden || !detail.isConnected) return;
      const progress = Math.min((now - started) / TRACKING_DURATION, 1);
      const point = route.getPointAtLength(routeLength * progress);
      courier.setAttribute("transform", `translate(${point.x} ${point.y})`);
      const stage = TRACKING_MILESTONES.reduce(
        (active, milestone, index) => (progress >= milestone ? index : active),
        0,
      );
      current.textContent = TRACKING_STEPS[stage];
      steps.forEach((step, index) => {
        step.classList.toggle("on", index <= stage);
        if (index === stage) step.setAttribute("aria-current", "step");
        else step.removeAttribute("aria-current");
      });
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }

  function renderOrders() {
    const all = getOrders();
    const activeOrders = all.filter((o) => statusOf(o) !== "Dibatalkan");
    $("order-filter").innerHTML = FILTERS.map((f) => {
      const n =
        f === "Semua"
          ? activeOrders.length
          : all.filter((o) => statusOf(o) === f).length;
      return `<button type="button" class="chip ${f === filter ? "active" : ""}" data-filter="${f}">${f} (${n})</button>`;
    }).join("");
    const shown =
      filter === "Semua"
        ? activeOrders
        : all.filter((o) => statusOf(o) === filter);
    $("orders-list").innerHTML = shown.length
      ? shown.map(orderCard).join("")
      : empty(
          "📦",
          "Tidak ada pesanan",
          filter === "Semua"
            ? "Pesanan yang kamu buat saat login akan muncul di sini."
            : "Belum ada pesanan dengan status ini.",
          `<a href="shop.html" class="btn btn-primary">Mulai belanja</a>`,
        );
  }

  function reorder(id) {
    const o = getOrders().find((x) => x.id === id);
    if (!o) return;
    const cart = Cart.get();
    let added = 0;
    arr(o.items).forEach((i) => {
      const p = findProduct(i.id);
      if (!p || p.stock <= 0) return;
      const row = cart.find((c) => c.id === p.id);
      const before = row ? row.qty : 0;
      const qty = Math.min(p.stock, before + i.qty);
      if (row) row.qty = qty;
      else cart.push({ id: p.id, qty, price: p.price });
      added += qty - before;
    });
    if (!added)
      return toast("Produk pada pesanan ini sudah tidak tersedia.", "error");
    Cart.save(cart);
    toast("Produk dimasukkan ke keranjang.");
    setTimeout(() => (location.href = "cart.html"), 600);
  }

  function onOrderClick(e) {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === "detail") {
      const detail = btn.closest(".ord").querySelector(".ord-detail");
      detail.hidden = !detail.hidden;
      btn.textContent = detail.hidden ? "Detail" : "Tutup";
      if (detail.hidden) {
        const stop = detail._trackingStop;
        if (stop) stop();
        detail._trackingStop = null;
      } else {
        detail._trackingStop = runTracking(detail);
      }
    } else if (act === "restart-tracking") {
      const detail = btn.closest(".ord-detail");
      const stop = detail._trackingStop;
      if (stop) stop();
      detail._trackingStop = runTracking(detail);
    } else if (act === "copyid") copy(id, "Nomor pesanan disalin.");
    else if (act === "again") reorder(id);
    else if (act === "cancel") {
      openCancelDialog(id, btn);
    } else if (act === "receive") {
      setStatus(id, "Selesai");
      toast("Terima kasih! Pesanan ditandai selesai.");
      renderAll();
    }
  }
  const cancelModal = $("cancel-modal");
  let pendingCancelId = null;
  let cancelTrigger = null;

  function closeCancelDialog() {
    cancelModal.hidden = true;
    pendingCancelId = null;
    $("cancel-form").reset();
    $("cancel-note-group").hidden = true;
    $("cancel-msg").className = "pf-msg";
    if (cancelTrigger && cancelTrigger.isConnected) cancelTrigger.focus();
    cancelTrigger = null;
  }

  function openCancelDialog(id, trigger) {
    const order = getOrders().find((item) => item.id === id);
    if (
      !order ||
      ![
        "Diproses",
        "Diproses (bayar di tempat)",
        "Dikemas",
      ].includes(statusOf(order))
    ) {
      toast("Pesanan ini sudah tidak dapat dibatalkan.", "error");
      return;
    }
    pendingCancelId = id;
    cancelTrigger = trigger;
    $("cancel-order-label").textContent = "Nomor pesanan " + id;
    cancelModal.hidden = false;
    $("cancel-reason").focus();
  }

  $("cancel-reason").addEventListener("change", () => {
    const other = $("cancel-reason").value === "other";
    $("cancel-note-group").hidden = !other;
    $("cancel-note").required = other;
    if (!other) $("cancel-note").value = "";
  });
  $("cancel-close").addEventListener("click", closeCancelDialog);
  cancelModal.addEventListener("click", (e) => {
    if (e.target === cancelModal) closeCancelDialog();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !cancelModal.hidden) closeCancelDialog();
  });
  $("cancel-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const selected = $("cancel-reason").value;
    const detail = $("cancel-note").value.trim();
    const reason = selected === "other" ? detail : selected;
    if (!reason) {
      $("cancel-msg").textContent =
        selected === "other"
          ? "Jelaskan alasan pembatalan."
          : "Pilih alasan pembatalan.";
      $("cancel-msg").className = "pf-msg show error";
      return;
    }
    cancelOrder(pendingCancelId, reason);
  });

  function cancelOrder(id, reason) {
    const all = arr(Store.read(KEYS.orders, []));
    const order = all.find((item) => item.id === id && item.email === me.email);
    if (
      !order ||
      ![
        "Diproses",
        "Diproses (bayar di tempat)",
        "Dikemas",
      ].includes(statusOf(order))
    ) {
      toast("Pesanan ini sudah tidak dapat dibatalkan.", "error");
      closeCancelDialog();
      return;
    }

    const inventoryBefore = [];
    if (order.stockReserved) {
      arr(order.items).forEach((item) => {
        const product = findProduct(item.id);
        if (!product) return;
        const existing = inventoryBefore.find((row) => row.id === product.id);
        if (existing) existing.stock += item.qty;
        else
          inventoryBefore.push({
            id: product.id,
            stock: product.stock + item.qty,
          });
      });
    }

    const previousStatus = order.status;
    const previousCancellation = {
      reason: order.cancellationReason,
      cancelledAt: order.cancelledAt,
      stockReserved: order.stockReserved,
    };
    order.status = "Dibatalkan";
    order.cancellationReason = reason;
    order.cancelledAt = new Date().toISOString();
    order.stockReserved = false;
    let inventoryUpdated = false;
    try {
      if (inventoryBefore.length) {
        Inventory.setMany(inventoryBefore);
        inventoryUpdated = true;
      }
      Store.write(KEYS.orders, all);
    } catch (error) {
      try {
        if (inventoryUpdated)
          Inventory.setMany(
            inventoryBefore.map((row) => ({
              id: row.id,
              stock:
                row.stock -
                arr(order.items)
                  .filter((item) => Number(item.id) === row.id)
                  .reduce((sum, item) => sum + item.qty, 0),
            })),
          );
      } catch (rollbackError) {
        console.error(
          "Gagal memulihkan stok setelah pembatalan gagal.",
          rollbackError,
        );
      }
      order.status = previousStatus;
      order.cancellationReason = previousCancellation.reason;
      order.cancelledAt = previousCancellation.cancelledAt;
      order.stockReserved = previousCancellation.stockReserved;
      console.error("Gagal menyimpan pembatalan pesanan.", error);
      toast("Pembatalan tidak dapat disimpan. Silakan coba lagi.", "error");
      return;
    }
    closeCancelDialog();
    toast("Pesanan dibatalkan dan stok telah diperbarui.");
    renderAll();
  }
  $("orders-list").addEventListener("click", onOrderClick);
  $("recent-orders").addEventListener("click", onOrderClick);
  $("order-filter").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if (!b) return;
    filter = b.dataset.filter;
    renderOrders();
  });

  /* ---------- Voucher ---------- */
  $("voucher-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-claim]");
    if (b) claimVoucher(b.dataset.claim);
  });

  /* ---------- Favorit ---------- */
  function renderFavs() {
    const items = Wish.get().map(findProduct).filter(Boolean);
    $("fav-list").innerHTML = items.length
      ? `<div class="fav-grid">${items
          .map(
            (p) => `<article class="fav">
              <a href="product.html?id=${p.id}" class="fav-img"><img src="${esc(productImage(p))}" alt="${esc(p.name)}" loading="lazy"></a>
              <div class="fav-info">
                <span class="tag">${esc(p.category)}</span>
                <h3><a href="product.html?id=${p.id}">${esc(p.name)}</a></h3>
                <strong class="price">${formatRupiah(p.price)}</strong>
                <div class="fav-act">
                  <button type="button" class="btn btn-primary btn-sm" data-fadd="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>${p.stock <= 0 ? "Habis" : "+ Keranjang"}</button>
                  <button type="button" class="btn btn-ghost btn-sm" data-fdel="${p.id}">Hapus</button>
                </div>
              </div>
            </article>`,
          )
          .join("")}</div>`
      : empty(
          "♥",
          "Belum ada favorit",
          "Tekan ikon hati pada produk untuk menyimpannya di sini.",
          `<a href="shop.html" class="btn btn-primary">Lihat produk</a>`,
        );
  }
  $("fav-list").addEventListener("click", (e) => {
    const add = e.target.closest("[data-fadd]");
    const del = e.target.closest("[data-fdel]");
    if (add) {
      Cart.add(add.dataset.fadd);
      renderSummary();
    } else if (del) {
      Wish.toggle(del.dataset.fdel);
      updateWishBadge();
      toast("Dihapus dari favorit.");
      renderAll();
    }
  });

  /* ---------- Alamat ---------- */
  const addrForm = $("addr-form");
  let editing = null;

  function openAddrForm(a) {
    editing = a ? a.id : null;
    $("addr-title").textContent = a ? "Ubah alamat" : "Tambah alamat";
    $("a-label").value = a ? a.label : "Rumah";
    $("a-recipient").value = a ? a.recipient : me.name;
    $("a-phone").value = a ? a.phone : (getUser() && getUser().phone) || "";
    $("a-address").value = a ? a.address : "";
    $("a-main").checked = a ? !!a.main : getAddr().length === 0;
    note($("addr-msg"), "", "");
    addrForm.hidden = false;
    $("a-recipient").focus();
  }
  function closeAddrForm() {
    addrForm.hidden = true;
    editing = null;
  }
  $("add-addr").addEventListener("click", () => openAddrForm(null));
  $("addr-cancel").addEventListener("click", closeAddrForm);

  addrForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const recipient = $("a-recipient").value.trim();
    const phone = $("a-phone").value.trim().replace(/[\s-]/g, "");
    const address = $("a-address").value.trim();
    const msg = $("addr-msg");
    if (recipient.length < 3)
      return note(msg, "Nama penerima minimal 3 karakter.", "error");
    if (!PHONE_RE.test(phone))
      return note(
        msg,
        "Gunakan nomor HP Indonesia, contoh 081234567890.",
        "error",
      );
    if (address.length < 10)
      return note(
        msg,
        "Alamat minimal 10 karakter, lengkap dengan kota.",
        "error",
      );

    let list = getAddr();
    const data = {
      label: $("a-label").value,
      recipient,
      phone,
      address,
      main: $("a-main").checked,
    };
    if (editing)
      list = list.map((a) => (a.id === editing ? { ...a, ...data } : a));
    else list.push({ id: Date.now(), ...data });
    if (!list.some((a) => a.main)) list[0].main = true;
    const mainId = (data.main && (editing || list[list.length - 1].id)) || null;
    if (mainId) list = list.map((a) => ({ ...a, main: a.id === mainId }));
    saveAddr(list);
    toast("Alamat disimpan.");
    closeAddrForm();
    renderAll();
  });

  function renderAddr() {
    const list = getAddr();
    $("addr-list").innerHTML = list.length
      ? `<div class="addr-grid">${list
          .map(
            (a) => `<article class="addr ${a.main ? "main" : ""}">
              <div class="addr-top"><span class="tag">${esc(a.label)}</span>${a.main ? `<span class="addr-main">★ Utama</span>` : ""}</div>
              <b>${esc(a.recipient)}</b><span class="muted">${esc(a.phone)}</span>
              <p>${esc(a.address)}</p>
              <div class="addr-act">
                ${a.main ? "" : `<button type="button" data-aact="main" data-id="${a.id}">Jadikan utama</button>`}
                <button type="button" data-aact="edit" data-id="${a.id}">Ubah</button>
                <button type="button" class="danger" data-aact="del" data-id="${a.id}">Hapus</button>
              </div>
            </article>`,
          )
          .join("")}</div>`
      : addrForm.hidden
        ? empty(
            "📍",
            "Belum ada alamat",
            "Simpan alamat agar checkout lebih cepat.",
          )
        : "";
  }
  $("addr-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-aact]");
    if (!b) return;
    const id = Number(b.dataset.id);
    let list = getAddr();
    if (b.dataset.aact === "edit") openAddrForm(list.find((a) => a.id === id));
    else if (b.dataset.aact === "main") {
      list = list.map((a) => ({ ...a, main: a.id === id }));
      saveAddr(list);
      toast("Alamat utama diubah.");
      renderAll();
    } else if (b.dataset.aact === "del") {
      if (!confirm("Hapus alamat ini?")) return;
      list = list.filter((a) => a.id !== id);
      if (list.length && !list.some((a) => a.main)) list[0].main = true;
      saveAddr(list);
      toast("Alamat dihapus.");
      renderAll();
    }
  });

  /* ---------- Akun ---------- */
  $("swatches").innerHTML = COLORS.map(
    (g, i) =>
      `<label><input type="radio" name="color" value="${i}" aria-label="Warna ${i + 1}"><span style="background:${g}"></span></label>`,
  ).join("");

  function fillAccount() {
    const u = getUser();
    $("p-name").value = me.name;
    $("p-phone").value = (u && u.phone) || "";
    $("p-email").value = me.email;
    $("p-since").value =
      u && u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("id-ID", {
            dateStyle: "long",
          })
        : "-";
    const c = (u && u.color) || 0;
    document
      .querySelectorAll('input[name="color"]')
      .forEach((r) => (r.checked = Number(r.value) === c));
  }
  document
    .querySelectorAll('input[name="color"]')
    .forEach((r) =>
      r.addEventListener(
        "change",
        () => (avatar.style.background = COLORS[Number(r.value)]),
      ),
    );

  $("acc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("p-name").value.trim();
    const phone = $("p-phone").value.trim().replace(/[\s-]/g, "");
    const color = Number(
      (document.querySelector('input[name="color"]:checked') || {}).value || 0,
    );
    const msg = $("acc-msg");
    if (name.length < 3) return note(msg, "Nama minimal 3 karakter.", "error");
    if (phone && !PHONE_RE.test(phone))
      return note(
        msg,
        "Gunakan nomor HP Indonesia, contoh 081234567890.",
        "error",
      );

    const users = Auth.users();
    const u = users.find((x) => x.email === me.email);
    if (u) {
      u.name = name;
      u.phone = phone;
      u.color = color;
      Store.write(KEYS.users, users);
    }
    Store.write(KEYS.session, { ...me, name });
    note(msg, "Perubahan tersimpan.", "success");
    toast("Profil diperbarui.");
    setTimeout(() => location.reload(), 700);
  });

  $("pw-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const oldPw = $("pw-old").value;
    const newPw = $("pw-new").value;
    const conf = $("pw-conf").value;
    const msg = $("pw-msg");
    const users = Auth.users();
    const u = users.find((x) => x.email === me.email);
    if (!u)
      return note(msg, "Akun tidak ditemukan. Silakan daftar ulang.", "error");
    if (u.password !== Auth.hash(oldPw))
      return note(msg, "Password sekarang salah.", "error");
    if (newPw.length < 6)
      return note(msg, "Password baru minimal 6 karakter.", "error");
    if (newPw !== conf)
      return note(msg, "Konfirmasi password tidak sama.", "error");
    u.password = Auth.hash(newPw);
    Store.write(KEYS.users, users);
    $("pw-form").reset();
    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
      const input = $(button.getAttribute("aria-controls"));
      input.type = "password";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `Tampilkan ${input.labels[0].textContent}`);
    });
    note(msg, "Password berhasil diganti.", "success");
    toast("Password diganti.");
  });

  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $(button.getAttribute("aria-controls"));
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      button.setAttribute("aria-pressed", String(visible));
      button.setAttribute(
        "aria-label",
        `${visible ? "Sembunyikan" : "Tampilkan"} ${input.labels[0].textContent}`,
      );
    });
  });

  $("del-acc").addEventListener("click", () => {
    if (
      !confirm(
        "Hapus akun ini beserta riwayat pesanan dan alamat? Tindakan ini tidak bisa dibatalkan.",
      )
    )
      return;
    Store.write(
      KEYS.users,
      Auth.users().filter((u) => u.email !== me.email),
    );
    Store.write(
      KEYS.orders,
      arr(Store.read(KEYS.orders, [])).filter((o) => o.email !== me.email),
    );
    const addr = Store.read(ADDR_KEY, {}) || {};
    delete addr[me.email];
    Store.write(ADDR_KEY, addr);
    const claims = Store.read(VOUCHER_KEY, {});
    if (claims && typeof claims === "object" && !Array.isArray(claims)) {
      delete claims[me.email];
      Store.write(VOUCHER_KEY, claims);
    }
    Auth.logout();
    location.href = "index.html";
  });

  $("logout-btn").addEventListener("click", () => {
    Auth.logout();
    location.href = "index.html";
  });

  /* ---------- Mulai ---------- */
  function renderAll() {
    renderSummary();
    renderOrders();
    renderFavs();
    renderAddr();
    refreshCounts();
  }
  fillAccount();
  renderAll();
  showTab(location.hash.slice(1));
})();

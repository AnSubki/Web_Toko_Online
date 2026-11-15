(() => {
  const form = document.getElementById("checkout-form");
  const deliveryNames = { regular: "Reguler", express: "Ekspres" };
  const paymentNames = {
    transfer: "Transfer Bank",
    ewallet: "E-Wallet",
    cod: "Bayar di tempat (COD)",
  };
  let submitting = false;

  function reserveAndSaveOrder(order, items) {
    const orders = Store.read(KEYS.orders, []);
    if (!Array.isArray(orders)) {
      throw new Error("Data pesanan tidak dapat dibaca.");
    }

    const inventoryBefore = items.map(({ p }) => ({
      id: p.id,
      stock: p.stock,
    }));

    try {
      Inventory.setMany(
        items.map(({ p, qty }) => ({ id: p.id, stock: p.stock - qty })),
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
      throw error;
    }
  }

  function submitOrder(event) {
    event.preventDefault();
    if (submitting) return;

    const selectedAddress = window.getSelectedAddress();
    if (!selectedAddress) {
      return toast(
        "Pilih atau tambahkan alamat pengiriman terlebih dahulu.",
        "error",
      );
    }

    const calculation = window.getCheckoutCalculation();
    if (!calculation.items.length) {
      return toast("Keranjang masih kosong.", "error");
    }

    const payment = form.payment.value;
    const shipping = form.shipping.value;
    if (!payment || !paymentNames[payment]) {
      return toast("Pilih metode pembayaran.", "error");
    }
    if (!Object.prototype.hasOwnProperty.call(deliveryNames, shipping)) {
      return toast("Pilih metode pengiriman.", "error");
    }

    const unavailable = calculation.items.find(
      ({ p, qty }) =>
        !Number.isSafeInteger(qty) || qty <= 0 || qty > p.stock,
    );
    if (unavailable) {
      return toast(
        `Stok ${unavailable.p.name} hanya ${unavailable.p.stock}. Ubah jumlah di keranjang.`,
        "error",
      );
    }

    const user = Auth.current();
    const now = new Date().toISOString();
    const note = document.getElementById("note").value.trim();
    const order = {
      id: "MITA-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      email: user ? user.email : null,
      date: now,
      createdAt: now,
      items: calculation.items.map(({ p, qty }) => ({
        id: p.id,
        name: p.name,
        qty,
        price: p.price,
      })),
      address: selectedAddress,
      customer: {
        name: selectedAddress.name,
        phone: selectedAddress.phone,
        address: selectedAddress.detail,
      },
      note,
      courierNote: note,
      shipping: calculation.ship,
      shippingMethod: deliveryNames[shipping],
      method: paymentNames[payment],
      payment: paymentNames[payment],
      subtotal: calculation.sub,
      discount: calculation.discount,
      promo: calculation.promo,
      total: calculation.total,
      status:
        payment === "cod"
          ? "Diproses (bayar di tempat)"
          : "Menunggu pembayaran",
      stockReserved: true,
    };

    submitting = true;
    try {
      reserveAndSaveOrder(order, calculation.items);
      Cart.clear();
      location.href = "profile.html#pesanan";
    } catch (error) {
      console.error("Gagal menyimpan pesanan checkout.", error);
      submitting = false;
      toast("Pesanan tidak dapat disimpan. Silakan coba lagi.", "error");
    }
  }

  form.addEventListener("submit", submitOrder);
})();

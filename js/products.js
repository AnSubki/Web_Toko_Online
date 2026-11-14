const imageAsset = (filename) => encodeURI(`assets/images/${filename}`);

function productImages(product) {
  const images = Array.isArray(product.images)
    ? product.images.filter(
        (image) => typeof image === "string" && image.trim(),
      )
    : [];
  return images.length ? images : product.image ? [product.image] : [];
}

function productImage(product) {
  return productImages(product)[0] || "";
}

const PRODUCTS = [
  {
    id: 4,
    name: "Mouse Nirkabel Senyap Asus MW103",
    sku: "ASU-MW103-04",
    category: "Mouse",
    colors: ["Hitam", "Pink", "Hijau Muda", "Putih"],
    price: 350000,
    oldPrice: 420000,
    sold: 340,
    stock: 25,
    description:
      "Mouse nirkabel 2,4 GHz dengan klik senyap dan pilihan warna untuk meja kerja yang tetap rapi.",
    images: [
      imageAsset("WhatsApp Image 2026-11-11 at 20.51.44.jpeg"),
      imageAsset("WhatsApp Image 2026-11-11 at 20.51.44 (1).jpeg"),
      imageAsset("WhatsApp Image 2026-11-11 at 20.51.45.jpeg"),
      imageAsset("WhatsApp Image 2026-11-11 at 20.51.45 (1).jpeg"),
      imageAsset("WhatsApp Image 2026-11-11 at 20.51.45 (2).jpeg"),
    ],
  },
  {
    id: 5,
    name: "Mouse Gaming Razer DeathAdder Essential",
    sku: "RAZ-DAE-05",
    category: "Mouse",
    colors: ["Putih", "Hitam"],
    price: 350000,
    oldPrice: 420000,
    sold: 0,
    stock: 25,
    description:
      "Mouse gaming berkabel dengan lima tombol responsif dan sensor optik 6.400 DPI untuk kendali yang presisi.",
    images: [
      imageAsset("WhatsApp Image 2026-11-11 at 20.50.55.jpeg"),
      imageAsset("WhatsApp Image 2026-11-11 at 20.50.55 (1).jpeg"),
      imageAsset("WhatsApp Image 2026-11-11 at 20.50.56.jpeg"),
      imageAsset("WhatsApp Image 2026-11-11 at 20.50.56 (1).jpeg"),
      imageAsset("WhatsApp Image 2026-11-11 at 20.50.56 (2).jpeg"),
    ],
  },
  {
    id: 2,
    name: "Smartphone Samsung Galaxy",
    sku: "SAM-GAL-02",
    category: "Smartphone",
    colors: ["Lavender", "Hitam", "Biru Muda"],
    price: 3500000,
    oldPrice: 3800000,
    sold: 120,
    stock: 15,
    description:
      "Smartphone Samsung Galaxy dengan desain kamera modern dan pilihan warna untuk komunikasi, foto, serta hiburan harian.",
    images: [
      imageAsset("WhatsApp Image 2026-11-12 at 09.00.38.jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.00.39.jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.00.39 (1).jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.00.40.jpeg"),
    ],
  },
  {
    id: 6,
    name: "iPhone 17",
    sku: "IPH-17-06",
    category: "Smartphone",
    colors: ["Silver", "Putih", "Biru Muda", "Hitam", "Hijau", "Ungu"],
    price: 3500000,
    oldPrice: 3800000,
    sold: 0,
    stock: 15,
    description:
      "iPhone 17 dengan layar luas, desain khas, dan pilihan warna untuk mendukung aktivitas sehari-hari.",
    images: [
      imageAsset("WhatsApp Image 2026-11-12 at 09.16.30.jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.16.30 (1).jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.16.31.jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.16.38.jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.16.38 (1).jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.16.38 (2).jpeg"),
      imageAsset("WhatsApp Image 2026-11-12 at 09.16.39.jpeg"),
    ],
  },
];

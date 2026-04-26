const WHATSAPP_NUMBER = "27000000000";

const products = [
  {
    id: "linen-overshirt",
    name: "Linen Utility Overshirt",
    category: "Men",
    price: 899,
    featured: true,
    newArrival: true,
    sizes: ["S", "M", "L", "XL"],
    description:
      "A relaxed linen-blend overshirt with clean utility pockets, designed for layered city dressing.",
    images: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1506629905607-d9d297d12313?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "tailored-trouser",
    name: "Relaxed Tailored Trouser",
    category: "Men",
    price: 749,
    featured: true,
    newArrival: false,
    sizes: ["28", "30", "32", "34", "36"],
    description:
      "Soft drape tailoring with a straight leg, pressed front crease, and understated premium finish.",
    images: [
      "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "satin-slip-dress",
    name: "Satin Slip Dress",
    category: "Women",
    price: 1099,
    featured: true,
    newArrival: true,
    sizes: ["XS", "S", "M", "L"],
    description:
      "Bias-cut satin with a fluid silhouette, adjustable straps, and a minimal evening-ready shape.",
    images: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "cropped-blazer",
    name: "Cropped Sculpt Blazer",
    category: "Women",
    price: 1299,
    featured: true,
    newArrival: false,
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "A sharp cropped blazer with sculpted shoulders and a clean single-button closure.",
    images: [
      "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "amber-noir",
    name: "Amber Noir Eau de Parfum",
    category: "Perfumes",
    price: 699,
    featured: false,
    newArrival: true,
    sizes: [],
    description:
      "A warm fragrance built on amber, cedar, cardamom, and a soft smoky base.",
    images: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "muse-floral",
    name: "Muse Floral Eau de Parfum",
    category: "Perfumes",
    price: 729,
    featured: true,
    newArrival: false,
    sizes: [],
    description:
      "Rose, neroli, and white musk meet in a polished everyday fragrance with a clean dry-down.",
    images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1608528577891-eb055944f2e8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "structured-tote",
    name: "Structured City Tote",
    category: "Bags",
    price: 1199,
    featured: false,
    newArrival: true,
    sizes: [],
    description:
      "A structured carryall with a refined matte finish, magnetic closure, and spacious interior.",
    images: [
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "mini-shoulder-bag",
    name: "Mini Crescent Shoulder Bag",
    category: "Bags",
    price: 849,
    featured: true,
    newArrival: false,
    sizes: [],
    description:
      "A compact crescent shoulder bag with smooth hardware and enough room for daily essentials.",
    images: [
      "https://images.unsplash.com/photo-1605733513597-a8f8341084e6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "ribbed-knit-top",
    name: "Ribbed Knit Top",
    category: "Women",
    price: 499,
    featured: false,
    newArrival: true,
    sizes: ["XS", "S", "M", "L"],
    description:
      "A fitted rib knit top with a clean neckline and soft stretch for day-to-night styling.",
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1520975682031-a3e85d25d3f2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "boxy-tee",
    name: "Heavyweight Boxy Tee",
    category: "Men",
    price: 399,
    featured: false,
    newArrival: true,
    sizes: ["S", "M", "L", "XL"],
    description:
      "A heavyweight cotton tee with a boxy fit, dropped shoulder, and premium hand feel.",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "wide-leg-denim",
    name: "Wide Leg Denim",
    category: "Women",
    price: 799,
    featured: false,
    newArrival: false,
    sizes: ["26", "28", "30", "32", "34"],
    description:
      "A high-rise wide leg denim in a washed black finish with a structured but comfortable fit.",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=900&q=80",
    ],
  },
  {
    id: "minimal-crossbody",
    name: "Minimal Crossbody Bag",
    category: "Bags",
    price: 649,
    featured: false,
    newArrival: true,
    sizes: [],
    description:
      "A lightweight crossbody with an adjustable strap, clean profile, and secure zip closure.",
    images: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=900&q=80",
    ],
  },
];

const categories = [
  {
    name: "Men",
    image: "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Women",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Perfumes",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Bags",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80",
  },
];

const app = document.querySelector("#app");
const body = document.body;
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const cartPanel = document.querySelector("[data-cart-panel]");
const overlay = document.querySelector("[data-overlay]");
const productTemplate = document.querySelector("#product-card-template");
const formatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

let cart = loadCart();
let selectedSize = "";

function money(value) {
  return formatter.format(value);
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cosmic-cart")) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("cosmic-cart", JSON.stringify(cart));
  renderCart();
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function addToCart(productId, size = "") {
  const product = getProduct(productId);
  if (!product) return;

  const normalizedSize = product.sizes.length ? size || product.sizes[0] : "";
  const existing = cart.find((item) => item.id === productId && item.size === normalizedSize);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, size: normalizedSize, quantity: 1 });
  }

  saveCart();
  openCart();
}

function updateQuantity(productId, size, direction) {
  const item = cart.find((cartItem) => cartItem.id === productId && cartItem.size === size);
  if (!item) return;

  item.quantity += direction;
  if (item.quantity <= 0) {
    cart = cart.filter((cartItem) => !(cartItem.id === productId && cartItem.size === size));
  }

  saveCart();
}

function removeFromCart(productId, size) {
  cart = cart.filter((item) => !(item.id === productId && item.size === size));
  saveCart();
}

function cartTotal() {
  return cart.reduce((total, item) => {
    const product = getProduct(item.id);
    return product ? total + product.price * item.quantity : total;
  }, 0);
}

function openCart() {
  body.classList.add("cart-open");
  cartPanel.setAttribute("aria-hidden", "false");
}

function closeCart() {
  body.classList.remove("cart-open");
  cartPanel.setAttribute("aria-hidden", "true");
}

function renderCart() {
  const cartItems = document.querySelector("[data-cart-items]");
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector("[data-cart-count]").textContent = count;
  document.querySelector("[data-cart-total]").textContent = money(cartTotal());

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-state">Your cart is empty. Add a product and checkout directly through WhatsApp.</p>';
    return;
  }

  cartItems.innerHTML = cart
    .map((item) => {
      const product = getProduct(item.id);
      if (!product) return "";
      return `
        <article class="cart-item">
          <img src="${product.images[0]}" alt="${product.name}">
          <div>
            <h3>${product.name}</h3>
            <p>${item.size ? `Size ${item.size} · ` : ""}${money(product.price)}</p>
            <div class="cart-item__controls">
              <div class="qty" aria-label="Quantity controls for ${product.name}">
                <button data-qty-minus="${product.id}" data-size="${item.size}" aria-label="Decrease quantity">-</button>
                <span>${item.quantity}</span>
                <button data-qty-plus="${product.id}" data-size="${item.size}" aria-label="Increase quantity">+</button>
              </div>
              <button class="remove" data-remove="${product.id}" data-size="${item.size}">Remove</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function productCard(product) {
  const node = productTemplate.content.firstElementChild.cloneNode(true);
  const link = node.querySelector(".product-card__image-link");
  const image = node.querySelector("img");
  link.href = `#product/${product.id}`;
  image.src = product.images[0];
  image.alt = product.name;
  node.querySelector(".product-card__category").textContent = product.category;
  node.querySelector("h3").textContent = product.name;
  node.querySelector("strong").textContent = money(product.price);
  node.querySelector(".product-card__quick").addEventListener("click", () => addToCart(product.id));
  return node;
}

function renderProductGrid(items, target) {
  target.innerHTML = "";
  items.forEach((product) => target.appendChild(productCard(product)));
}

function renderHome() {
  app.innerHTML = `
    <div class="page">
      <section class="hero">
        <div class="hero__content reveal">
          <div>
            <p class="eyebrow">Online fashion department</p>
            <h1>COSMIC DEPT</h1>
            <p>Street-ready clothing, fragrances, and bags shaped around a dark premium department-store interface.</p>
            <div class="button-row">
              <a class="button button--dark" href="#shop?category=Men">Shop Men</a>
              <a class="button button--ghost-light" href="#shop?category=Women">Shop Women</a>
            </div>
          </div>
          <div class="hero__preview" aria-hidden="true">
            <div class="dept-shell">
              <div class="dept-topbar">
                <span class="dept-logo">COSMIC DEPT</span>
                <div class="dept-icons"><span></span><span></span><span></span></div>
              </div>
              <div class="dept-banner">
                <strong>Accessorize your look</strong>
                <span>New drops across clothing, perfumes, and bags</span>
              </div>
              <div class="dept-grid">
                <div class="dept-card"><span>Latest</span><b>Men</b></div>
                <div class="dept-card"><span>Trending</span><b>Women</b></div>
                <div class="dept-card"><span>Signature</span><b>Perfumes</b></div>
                <div class="dept-card"><span>Carry</span><b>Bags</b></div>
              </div>
              <div class="dept-feed">
                <p>Orders, arrivals, and WhatsApp checkout</p>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-heading">
            <h2>Featured</h2>
            <a href="#shop">View all</a>
          </div>
          <div class="product-grid" data-featured></div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-heading">
            <h2>Categories</h2>
          </div>
          <div class="category-grid">
            ${categories
              .map(
                (category) => `
                  <a class="category-card reveal" href="#shop?category=${category.name}">
                    <img src="${category.image}" alt="${category.name}" loading="lazy">
                    <span>${category.name}</span>
                  </a>
                `,
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="promo-band">
        <div class="container promo-band__inner reveal">
          <h2>Cosmic essentials.</h2>
          <p>Shop clean tailoring, streetwear layers, compact bags, and fragrances made for everyday rotation.</p>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-heading">
            <h2>New Arrivals</h2>
            <a href="#shop">Shop now</a>
          </div>
          <div class="product-grid" data-new-arrivals></div>
        </div>
      </section>
    </div>
  `;

  renderProductGrid(products.filter((product) => product.featured).slice(0, 4), document.querySelector("[data-featured]"));
  renderProductGrid(products.filter((product) => product.newArrival).slice(0, 8), document.querySelector("[data-new-arrivals]"));
  revealOnScroll();
}

function parseShopParams() {
  const [, query = ""] = location.hash.split("?");
  return new URLSearchParams(query);
}

function renderShop() {
  const params = parseShopParams();
  const activeCategory = params.get("category") || "All";
  app.innerHTML = `
    <section class="page section">
      <div class="container">
        <div class="section-heading">
          <h2>Shop</h2>
        </div>
        <div class="shop-layout">
          <form class="shop-tools" data-shop-tools>
            <div class="field">
              <label for="search">Search</label>
              <input id="search" type="search" placeholder="Search products" data-search>
            </div>
            <div class="field">
              <label for="category">Category</label>
              <select id="category" data-category>
                ${["All", "Men", "Women", "Perfumes", "Bags"]
                  .map((category) => `<option value="${category}" ${category === activeCategory ? "selected" : ""}>${category}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="range-row">
              <div class="field">
                <label for="min-price">Min</label>
                <input id="min-price" type="number" min="0" placeholder="R0" data-min>
              </div>
              <div class="field">
                <label for="max-price">Max</label>
                <input id="max-price" type="number" min="0" placeholder="R1500" data-max>
              </div>
            </div>
          </form>
          <div>
            <div class="product-grid" data-shop-grid></div>
          </div>
        </div>
      </div>
    </section>
  `;

  const controls = {
    search: document.querySelector("[data-search]"),
    category: document.querySelector("[data-category]"),
    min: document.querySelector("[data-min]"),
    max: document.querySelector("[data-max]"),
    grid: document.querySelector("[data-shop-grid]"),
  };

  function applyFilters() {
    const query = controls.search.value.trim().toLowerCase();
    const category = controls.category.value;
    const min = Number(controls.min.value) || 0;
    const max = Number(controls.max.value) || Infinity;
    const filtered = products.filter((product) => {
      const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(query);
      const matchesCategory = category === "All" || product.category === category;
      const matchesPrice = product.price >= min && product.price <= max;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (!filtered.length) {
      controls.grid.innerHTML = '<p class="empty-state">No products match these filters.</p>';
      return;
    }

    renderProductGrid(filtered, controls.grid);
    revealOnScroll();
  }

  document.querySelector("[data-shop-tools]").addEventListener("input", applyFilters);
  applyFilters();
}

function renderProductPage(id) {
  const product = getProduct(id) || products[0];
  selectedSize = product.sizes[0] || "";

  app.innerHTML = `
    <section class="page">
      <div class="container product-detail">
        <div class="gallery reveal">
          <div class="gallery__main">
            <img src="${product.images[0]}" alt="${product.name}" data-main-image>
          </div>
          <div class="gallery__thumbs">
            ${product.images
              .map(
                (image, index) => `
                  <button class="${index === 0 ? "is-active" : ""}" data-gallery-thumb="${image}" aria-label="View image ${index + 1}">
                    <img src="${image}" alt="${product.name} thumbnail ${index + 1}">
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>

        <div class="detail-copy reveal">
          <p class="eyebrow">${product.category}</p>
          <h1>${product.name}</h1>
          <strong class="price">${money(product.price)}</strong>
          <p>${product.description}</p>
          ${
            product.sizes.length
              ? `
                <div class="field">
                  <label>Size</label>
                  <div class="size-grid">
                    ${product.sizes
                      .map((size, index) => `<button class="size-option ${index === 0 ? "is-active" : ""}" data-size-option="${size}">${size}</button>`)
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
          <div class="button-row">
            <button class="button button--dark" data-add-product="${product.id}">Add to Cart</button>
            <a class="button" data-order-product href="#">Order via WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  `;

  document.querySelectorAll("[data-gallery-thumb]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector("[data-main-image]").src = button.dataset.galleryThumb;
      document.querySelectorAll("[data-gallery-thumb]").forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });

  document.querySelectorAll("[data-size-option]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedSize = button.dataset.sizeOption;
      document.querySelectorAll("[data-size-option]").forEach((sizeButton) => sizeButton.classList.remove("is-active"));
      button.classList.add("is-active");
      updateProductWhatsAppLink(product);
    });
  });

  document.querySelector("[data-add-product]").addEventListener("click", () => addToCart(product.id, selectedSize));
  updateProductWhatsAppLink(product);
  revealOnScroll();
}

function updateProductWhatsAppLink(product) {
  const link = document.querySelector("[data-order-product]");
  if (!link) return;

  const message = `Hi, I would like to order:\n- ${product.name}${selectedSize ? `, Size ${selectedSize}` : ""} x1\nTotal: ${money(product.price)}`;
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  link.target = "_blank";
  link.rel = "noreferrer";
}

function renderAbout() {
  app.innerHTML = `
    <section class="page">
      <div class="container info-page reveal">
        <p class="eyebrow">About</p>
        <h1>Minimal pieces for modern movement.</h1>
        <p>
          COSMIC DEPT is a contemporary fashion concept for men and women who want clean wardrobe
          staples, expressive accessories, and signature scents without visual noise. The brand
          focuses on neutral palettes, refined textures, and pieces that move easily from weekday
          routines to nights out.
        </p>
        <a class="button button--dark" href="#shop">Explore the collection</a>
      </div>
    </section>
  `;
  revealOnScroll();
}

function renderContact() {
  app.innerHTML = `
    <section class="page">
      <div class="container info-page reveal">
        <p class="eyebrow">Contact</p>
        <h1>Let us help with your order.</h1>
        <div class="contact-list">
          <a class="contact-link" href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" rel="noreferrer">
            <span>WhatsApp</span><strong>+27 00 000 0000</strong>
          </a>
          <a class="contact-link" href="mailto:hello@cosmicdept.example">
            <span>Email</span><strong>hello@cosmicdept.example</strong>
          </a>
          <a class="contact-link" href="#" aria-label="Instagram placeholder">
            <span>Instagram</span><strong>@cosmicdept</strong>
          </a>
          <a class="contact-link" href="#" aria-label="TikTok placeholder">
            <span>TikTok</span><strong>@cosmicdept</strong>
          </a>
        </div>
      </div>
    </section>
  `;
  revealOnScroll();
}

function checkoutWhatsApp() {
  if (!cart.length) return;

  const lines = cart
    .map((item) => {
      const product = getProduct(item.id);
      if (!product) return "";
      return `- ${product.name}${item.size ? `, Size ${item.size}` : ""} x${item.quantity}`;
    })
    .filter(Boolean);

  const message = `Hi, I would like to place an order:\n${lines.join("\n")}\n\nTotal: ${money(cartTotal())}`;
  window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function revealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  items.forEach((item) => observer.observe(item));
}

function route() {
  closeCart();
  body.classList.remove("nav-open");
  const hash = location.hash || "#home";
  const [path] = hash.slice(1).split("?");

  if (path === "shop") renderShop();
  else if (path.startsWith("product/")) renderProductPage(path.split("/")[1]);
  else if (path === "about") renderAbout();
  else if (path === "contact") renderContact();
  else renderHome();

  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navToggle.addEventListener("click", () => body.classList.toggle("nav-open"));
nav.addEventListener("click", () => body.classList.remove("nav-open"));
document.querySelector("[data-cart-open]").addEventListener("click", openCart);
document.querySelector("[data-cart-close]").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.querySelector("[data-checkout]").addEventListener("click", checkoutWhatsApp);
document.querySelector("[data-whatsapp-float]").href = `https://wa.me/${WHATSAPP_NUMBER}`;

document.addEventListener("click", (event) => {
  const plus = event.target.closest("[data-qty-plus]");
  const minus = event.target.closest("[data-qty-minus]");
  const remove = event.target.closest("[data-remove]");

  if (plus) updateQuantity(plus.dataset.qtyPlus, plus.dataset.size, 1);
  if (minus) updateQuantity(minus.dataset.qtyMinus, minus.dataset.size, -1);
  if (remove) removeFromCart(remove.dataset.remove, remove.dataset.size);
});

window.addEventListener("hashchange", route);

renderCart();
route();

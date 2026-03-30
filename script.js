// Fallback Storage Wrapper for Chrome file:/// protocol security policies
const storageConfig = {
  isAvailable: false,
  memoryStorage: {}
};

try {
  const test = '__storage_test__';
  localStorage.setItem(test, test);
  localStorage.removeItem(test);
  storageConfig.isAvailable = true;
} catch (e) {
  console.warn('LocalStorage is blocked by Chrome for local files. Falling back to temporary in-memory storage.');
}

const safeStorage = {
  getItem: function (key) {
    if (storageConfig.isAvailable) {
      return localStorage.getItem(key);
    }
    return storageConfig.memoryStorage[key] || null;
  },
  setItem: function (key, value) {
    if (storageConfig.isAvailable) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        storageConfig.memoryStorage[key] = value;
      }
    } else {
      storageConfig.memoryStorage[key] = value;
    }
  },
  removeItem: function (key) {
    if (storageConfig.isAvailable) {
      localStorage.removeItem(key);
    } else {
      delete storageConfig.memoryStorage[key];
    }
  }
};

// Safe JSON Parse Helper
function safeParse(key, defaultValue) {
  try {
    const data = safeStorage.getItem(key);
    if (!data) return defaultValue;
    const parsed = JSON.parse(data);
    
    // Type checking for specific keys
    if (key === 'products' || key === 'orders' || key === 'cart' || key === 'users') {
      if (!Array.isArray(parsed)) return defaultValue;
    }
    
    return parsed;
  } catch (e) {
    console.warn(`Error parsing ${key} from storage, resetting to default.`, e);
    return defaultValue;
  }
}

// Default Products Data
const defaultProducts = [
  { id: 1, name: 'Classic Brown Leather', price: 2500, image: 'https://sayaz.pk/cdn/shop/files/EW7A3686.jpg?v=1711052624&width=600', category: 'Classic' },
  { id: 2, name: 'Premium Black Zalmi', price: 3500, image: 'https://saqafatpk.com/cdn/shop/files/1_9c50149a-3878-4322-bf2e-bee58c8356c1.jpg?v=1692881617&width=1946', category: 'Premium' },
  { id: 3, name: 'Kaptaan Special Mustard', price: 4000, image: 'https://www.peshawarichappals.pk/cdn/shop/files/kaptaan_chappals092172.png?v=1763213511', category: 'Special' },
  { id: 4, name: 'Handcrafted Golden Thread ', price: 4500, image: 'https://www.peshawarichappals.pk/cdn/shop/files/norozi-chappal331-min-jpg-700x700.webp?v=1756893070&width=750', category: 'Premium' },
  { id: 5, name: 'Double Sole Pure Leather', price: 3000, image: 'https://lalachappal.com/cdn/shop/files/Picsart_24-08-14_22-40-32-856.jpg?v=1723717148', category: 'Classic' },
];

// Initialize Data
if (!safeStorage.getItem('products')) {
  safeStorage.setItem('products', JSON.stringify(defaultProducts));
}
if (!safeStorage.getItem('users')) {
  safeStorage.setItem('users', JSON.stringify([]));
}
if (!safeStorage.getItem('orders')) {
  safeStorage.setItem('orders', JSON.stringify([]));
}
if (!safeStorage.getItem('cart')) {
  safeStorage.setItem('cart', JSON.stringify([]));
}

// Global Variables
let currentUser = safeParse('currentUser', null);
let products = safeParse('products', []);
let cart = safeParse('cart', []);
let orders = safeParse('orders', []);

// Utility Functions
function saveCart() {
  safeStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = cart.length;
    badge.style.display = cart.length > 0 ? 'block' : 'none';
  }
}

function showNotification(message, type = 'success') {
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.style.borderLeftColor = type === 'error' ? 'var(--error)' : 'var(--primary)';
  notif.innerHTML = `<strong>${message}</strong>`;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add('show'), 100);
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function formatPrice(price) {
  return 'Rs. ' + parseInt(price).toLocaleString();
}

// UI Setup functions
function setupNavbar() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  // Don't override elements if we're in the admin panel
  if (window.location.href.includes('admin-dashboard.html')) return;

  let linksHtml = `
    <a href="index.html">Home</a>
    <a href="shop.html">Shop</a>
    <a href="#" onclick="openCart(event)" style="position:relative">
      Cart <span id="cart-badge" style="display:none">0</span>
    </a>
  `;

  if (currentUser) {
    // Find latest order
    const userOrders = orders.filter(o => o.userEmail === currentUser.email);
    let latestOrderStatus = '';
    if (userOrders.length > 0) {
      const latest = userOrders[userOrders.length - 1];
      latestOrderStatus = `<span style="font-size: 0.8rem; background: var(--primary); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;" title="Recent Order ID: ${latest.id}">Order: ${latest.status}</span>`;
    }

    linksHtml += `
      <a href="profile.html">Profile ${latestOrderStatus}</a>
      <a href="#" onclick="logout(event)">Logout (${currentUser.name})</a>
    `;
  } else {
    if (safeStorage.getItem('adminSession') === 'true') {
      linksHtml += `<a href="admin-dashboard.html" style="background:var(--secondary); color:#333; padding:0.4rem 1rem; border-radius:4px; font-weight:bold;">Return to Admin Panel</a>`;
    } else {
      linksHtml += `<a href="login.html">Login</a>`;
    }
  }

  navLinks.innerHTML = linksHtml;
  updateCartBadge();
}

function logout(e) {
  if (e) e.preventDefault();
  safeStorage.removeItem('currentUser');
  showNotification('Logged out successfully');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

// Loader dismissal function
function hideLoader() {
  const loader = document.querySelector('.loader-wrapper');
  if (loader && loader.style.display !== 'none') {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
}

// Initial loader dismissal on script load or DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  setupNavbar();
});

// Final fallback dismissal on window load (waits for all images)
window.addEventListener('load', hideLoader);

// Fail-safe timeout (in case assets take too long or script errors)
setTimeout(hideLoader, 3000);

// Add to Cart
function addToCart(productId) {
  if (!currentUser) {
    window.location.href = 'login.html?redirect=shop.html';
    return;
  }

  const sizeSelect = document.getElementById(`size-${productId}`);
  const selectedSize = sizeSelect ? sizeSelect.value : '10';

  const product = products.find(p => p.id === productId);
  if (product) {
    cart.push({ ...product, size: selectedSize, cartId: Date.now() });
    saveCart();
    showNotification('Added to Cart!');
  }
}

// Cart Modal
function openCart(e) {
  if (e) e.preventDefault();
  let modal = document.getElementById('cart-modal');
  if (!modal) {
    modal = createCartModal();
  }
  renderCartItems();
  modal.classList.add('active');
}

function closeCart() {
  const modal = document.getElementById('cart-modal');
  if (modal) modal.classList.remove('active');
}

function createCartModal() {
  const modalHtml = `
    <div class="modal-overlay" id="cart-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Your Cart</h2>
          <button class="close-btn" onclick="closeCart()">&times;</button>
        </div>
        <div id="cart-items"></div>
        <div class="cart-total" id="cart-total">Total: Rs. 0</div>
        <button class="btn btn-primary" style="width:100%; margin-top:1rem" onclick="checkout()">Checkout</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  return document.getElementById('cart-modal');
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  const totalContainer = document.getElementById('cart-total');

  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align:center; color: var(--text-light)">Your cart is empty.</p>';
    totalContainer.innerHTML = 'Total: Rs. 0';
    return;
  }

  let html = '';
  let total = 0;

  cart.forEach(item => {
    total += Number(item.price);
    html += `
      <div class="cart-item">
        <div class="cart-item-details">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div>
            <h4>${item.name}</h4>
            <p style="font-size: 0.9rem; color: var(--text-light)">Size: ${item.size || 'N/A'}</p>
            <p>${formatPrice(item.price)}</p>
          </div>
        </div>
        <button class="btn-outline" style="padding:0.2rem 0.5rem; border-color:var(--error); color:var(--error)" onclick="removeFromCart(${item.cartId})">X</button>
      </div>
    `;
  });

  container.innerHTML = html;
  totalContainer.innerHTML = `Total: ${formatPrice(total)}`;
}

function removeFromCart(cartId) {
  cart = cart.filter(item => item.cartId !== cartId);
  saveCart();
  renderCartItems();
}

let pendingCheckout = { items: [], total: 0, isCart: false };

function checkout() {
  if (cart.length === 0) {
    showNotification('Cart is empty', 'error');
    return;
  }
  let total = cart.reduce((sum, item) => sum + Number(item.price), 0);
  pendingCheckout = { items: [...cart], total: total, isCart: true };

  closeCart();
  showCheckoutFormModal();
}

function directOrder(productId) {
  if (!currentUser) {
    window.location.href = 'login.html?redirect=shop.html';
    return;
  }

  const sizeSelect = document.getElementById(`size-${productId}`);
  const selectedSize = sizeSelect ? sizeSelect.value : '10';

  const product = products.find(p => p.id === productId);
  if (product) {
    const orderItem = { ...product, size: selectedSize, cartId: Date.now() };
    pendingCheckout = { items: [orderItem], total: Number(product.price), isCart: false };
    showCheckoutFormModal();
  }
}

function showCheckoutFormModal() {
  const modalHtml = `
    <div class="modal-overlay active" id="checkout-form-modal" style="z-index: 9999; display: flex;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Complete Your Order Details</h2>
          <button class="close-btn" onclick="document.getElementById('checkout-form-modal').remove()">&times;</button>
        </div>
        <form id="details-form" onsubmit="finalizeOrder(event)">
            <p style="margin-bottom: 1rem; color: var(--primary); font-weight: bold; font-size:1.2rem;">Total Payable: Rs. ${pendingCheckout.total.toLocaleString()}</p>
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="chk-name" required value="${currentUser ? currentUser.name : ''}">
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="chk-phone" required placeholder="e.g. 0300 1234567">
            </div>
            <div class="form-group">
                <label>City</label>
                <input type="text" id="chk-city" required placeholder="e.g. Lahore">
            </div>
            <div class="form-group">
                <label>Complete Shipping Address</label>
                <textarea id="chk-address" required rows="3" style="width:100%; border:1px solid var(--border); border-radius:8px; padding:0.8rem; font-family:inherit;" placeholder="House No, Street, Area..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem">Confirm Order</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function finalizeOrder(e) {
  e.preventDefault();

  const name = document.getElementById('chk-name').value;
  const phone = document.getElementById('chk-phone').value;
  const city = document.getElementById('chk-city').value;
  const address = document.getElementById('chk-address').value;

  const order = {
    id: 'ORD' + Date.now(),
    userEmail: currentUser.email,
    date: new Date().toLocaleDateString(),
    items: pendingCheckout.items,
    total: pendingCheckout.total,
    status: 'Pending',
    shipping: { name, phone, city, address }
  };

  orders.push(order);
  safeStorage.setItem('orders', JSON.stringify(orders));

  if (pendingCheckout.isCart) {
    cart = [];
    saveCart();
  }

  document.getElementById('checkout-form-modal').remove();
  setupNavbar();
  showOrderSuccessModal(order.id);
}

function showOrderSuccessModal(orderId) {
  const modalHtml = `
    <div class="modal-overlay active" id="success-modal" style="z-index: 9999; display: flex;">
      <div class="modal-content" style="text-align: center; padding: 3rem 2rem; border: 4px solid var(--secondary);">
        <div style="font-size: 4rem; color: var(--primary); margin-bottom: 1rem;">⏳</div>
        <h2 style="color: var(--secondary); margin-bottom: 1rem;">Order Pending...</h2>
        <p style="color: var(--text-light); margin-bottom: 0.5rem;">Your Order ID is <strong>${orderId}</strong></p>
        <p style="font-size: 1.1rem; font-weight: 500; margin-bottom: 2rem; color: var(--primary);">Your order has been received and is pending. Please wait for the admin to confirm your request!</p>
        <button class="btn btn-primary" onclick="document.getElementById('success-modal').remove()">Okay</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Global hook to check if admin approved any missing notifications
document.addEventListener('DOMContentLoaded', () => {
  checkOrderNotifications();
});

function checkOrderNotifications() {
  if (!currentUser) return;

  const currentOrders = safeParse('orders', []);
  const userOrders = currentOrders.filter(o => o.userEmail === currentUser.email);
  let notifiedOrders = safeParse('notifiedOrders', []);

  userOrders.forEach(o => {
    if ((o.status === 'Confirmed' || o.status === 'Cancelled') && !notifiedOrders.includes(o.id)) {
      setTimeout(() => showStatusUpdateModal(o.id, o.status), 500);
      notifiedOrders.push(o.id);
    }
  });

  safeStorage.setItem('notifiedOrders', JSON.stringify(notifiedOrders));
}

function showStatusUpdateModal(orderId, status) {
  const isConfirmed = status === 'Confirmed';
  const color = isConfirmed ? '#15803d' : '#b91c1c';
  const emoji = isConfirmed ? '✅' : '❌';

  const modalHtml = `
      <div class="modal-overlay active" id="status-modal-${orderId}" style="z-index: 9999; display: flex;">
        <div class="modal-content" style="text-align: center; max-width: 400px; border: 3px solid ${color};">
          <div style="font-size: 4rem; margin-bottom: 1rem;">${emoji}</div>
          <h2>Order ${status}!</h2>
          <p style="margin: 1rem 0; color: var(--text-light);">Your Order <strong>${orderId}</strong> has been officially <strong>${status}</strong> by the admin.</p>
          <button class="btn btn-primary" onclick="document.getElementById('status-modal-${orderId}').remove()" style="width: 100%; background: ${color};">Got It!</button>
        </div>
      </div>
    `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Render Products Helper
function createProductCard(product) {
  return `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" onclick="window.location.href='shop.html'" style="cursor: pointer;">
      <div class="product-info">
        <div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-price">${formatPrice(product.price)}</p>
          <div style="margin-bottom: 1rem; text-align: left;">
            <label style="font-size: 0.9rem; color: var(--text-light)">Select Size:</label>
            <select id="size-${product.id}" class="filter-select" style="width: 100%; padding: 0.5rem; margin-top: 0.2rem;">
                <option value="7">Size 7</option>
                <option value="8">Size 8</option>
                <option value="9">Size 9</option>
                <option selected value="10">Size 10</option>
                <option value="11">Size 11</option>
                <option value="12">Size 12</option>
            </select>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-outline" onclick="addToCart(${product.id})" style="flex: 1; padding: 0.6rem 0.5rem; font-size: 0.9rem;">Add to Cart</button>
          <button class="btn btn-primary" onclick="directOrder(${product.id})" style="flex: 1; padding: 0.6rem 0.5rem; font-size: 0.9rem;">Buy Now</button>
        </div>
      </div>
    </div>
  `;
}

// In-Feed Ad Helper
function getInFeedAdHtml() {
  return `
    <div class="product-card" style="display: flex; align-items: center; justify-content: center; background: #fdfdfd; min-height: 400px; padding: 1rem;">
        <div style="width: 100%;">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-format="fluid"
                 data-ad-layout-key="-gw-3+1f-3d+2z"
                 data-ad-client="ca-pub-7554219557678246"
                 data-ad-slot="4705454420"></ins>
            <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
        </div>
    </div>
  `;
}

// Real-time Storage Sync (AI Feature)
window.addEventListener('storage', (e) => {
  if (e.key === 'products') {
    products = safeParse('products', []);

    // Sync Shop Page
    if (typeof filterProducts === 'function') {
      filterProducts();
    }

    // Sync Home (Index) Page
    const grid = document.getElementById('featured-products');
    if (grid) {
      const featured = products.slice(0, 4);
      let html = '';
      featured.forEach((item, index) => {
        html += createProductCard(item);
        if (index === 1) html += getInFeedAdHtml(); // Ad after 2nd product
      });
      grid.innerHTML = html;
    }

    // Sync Admin Page
    if (typeof loadAdminProducts === 'function') {
      loadAdminProducts();
    }
  }

  if (e.key === 'users') {
    // Sync Admin Dashboard for New Users
    if (typeof loadAdminUsers === 'function') {
      const oldUsers = JSON.parse(e.oldValue || '[]');
      const newUsers = JSON.parse(e.newValue || '[]');

      if (newUsers.length > oldUsers.length) {
        const latestUser = newUsers[newUsers.length - 1];
        showNotification('🚀 New User Signup: ' + latestUser.name);
      }
      loadAdminUsers();
    }
  }

  if (e.key === 'orders') {
    // Sync Admin Dashboard when an order is updated
    if (typeof loadAdminOrders === 'function') {
      loadAdminOrders();
    }
  }
});


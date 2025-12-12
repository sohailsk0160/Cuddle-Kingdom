/* script.js — Fixed full version
   - Uses picsum images (no local img folder needed)
   - Proper DOMContentLoaded, single cart storage API
   - Real-time cart count updates, working + / - / remove / clear
   - Slider uses <img> so it doesn't show blank frames
*/

(() => {
  // ---------- Data ----------
  // PRODUCTS is now loaded from products.js

  const SLIDER_IMAGES = [
    'https://picsum.photos/seed/slider-1/1200/800',
    'https://picsum.photos/seed/slider-2/1200/800',
    'https://picsum.photos/seed/slider-3/1200/800',
    'https://picsum.photos/seed/slider-4/1200/800'
  ];

  const CART_KEY = 'cuddle_cart_v1';

  // ---------- Utilities ----------
  function formatINR(n){ return '₹' + Number(n).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits:2}); }

  function getCart(){
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch(e){ console.error('Cart parse error', e); return []; }
  }
  function saveCart(cart){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // ---------- DOM Ready ----------
  document.addEventListener('DOMContentLoaded', () => {
    // DOM refs
    const productsGrid = document.getElementById('productsGrid');
    const navBtns = Array.from(document.querySelectorAll('.nav-btn'));
    const cartModal = document.getElementById('cartModal');
    const openCartBtn = document.getElementById('openCart');
    const closeCartBtn = document.getElementById('closeCart');
    const cartBackdrop = document.getElementById('cartBackdrop');
    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    const navCartCount = document.getElementById('navCartCount');
    const clearCartBtn = document.getElementById('clearCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const toast = document.getElementById('toast');

    // slider refs
    const slidesContainer = document.getElementById('slidesContainer');
    const sliderDots = document.getElementById('sliderDots');
    const sliderPrev = document.getElementById('sliderPrev');
    const sliderNext = document.getElementById('sliderNext');
    const sliderEl = document.getElementById('imageSlider');

    // state
    let cart = getCart();
    let toastTimer = null;

    // ---------- Cart helpers ----------
    function updateCartCountUI(){
      const totalQty = cart.reduce((s,i) => s + (i.qty||0), 0);
      navCartCount.textContent = totalQty;
    }

    function renderCart(){
      cartItemsEl.innerHTML = '';
      if(!cart || cart.length === 0){
        cartItemsEl.innerHTML = `<p style="color:var(--muted);text-align:center">Your cart is empty.</p>`;
        cartTotalEl.textContent = formatINR(0);
        updateCartCountUI();
        return;
      }

      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.innerHTML = `
          <img src="${item.image}" alt="${item.name}">
          <div class="cart-meta">
            <div style="font-weight:800">${item.name}</div>
            <div style="color:var(--muted);margin-top:4px">${formatINR(item.price)} each</div>
            <div style="margin-top:8px" class="cart-qty">
              <button class="qty-btn dec" data-id="${item.id}">−</button>
              <span style="min-width:36px;text-align:center;font-weight:800">${item.qty}</span>
              <button class="qty-btn inc" data-id="${item.id}">+</button>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:900">${formatINR(item.qty * item.price)}</div>
            <button class="qty-btn remove" data-id="${item.id}" style="margin-top:8px;background:#ffe8f1">Remove</button>
          </div>
        `;
        cartItemsEl.appendChild(row);
      });

      const subtotal = cart.reduce((s,i) => s + (i.price * i.qty), 0);
      cartTotalEl.textContent = formatINR(subtotal);
      updateCartCountUI();
    }

    function showToast(msg, duration=1800){
      toast.textContent = msg;
      toast.classList.add('show');
      if(toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(()=> toast.classList.remove('show'), duration);
    }

    function addToCart(productId, qty=1){
      const prod = PRODUCTS.find(p=>p.id===productId);
      if(!prod) return;
      const existing = cart.find(c => c.id === productId);
      if(existing) existing.qty = (existing.qty||0) + qty;
      else cart.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.image, qty });
      saveCart(cart);
      renderCart();
      showToast(`${prod.name} added to cart`);
    }

    function updateQty(productId, delta){
      const item = cart.find(c => c.id === productId);
      if(!item) return;
      item.qty += delta;
      if(item.qty <= 0) cart = cart.filter(c => c.id !== productId);
      saveCart(cart);
      renderCart();
    }

    function removeFromCart(productId){
      cart = cart.filter(c => c.id !== productId);
      saveCart(cart);
      renderCart();
    }

    // ---------- Render products ----------
    function renderProducts(){
      productsGrid.innerHTML = '';
      PRODUCTS.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="product-media"><img src="${p.image}" alt="${p.name}"></div>
          <div class="product-title">${p.name}</div>
          <div class="product-price">${formatINR(p.price)}</div>
          <div class="product-actions">
            <button class="add-btn" data-id="${p.id}">Add to Cart</button>
          </div>
        `;
        productsGrid.appendChild(card);
      });
    }

    productsGrid.addEventListener('click', e => {
      const btn = e.target.closest('.add-btn');
      if(!btn) return;
      const id = btn.dataset.id;
      addToCart(id, 1);
    });

    // ---------- Cart delegation ----------
    cartItemsEl.addEventListener('click', (e) => {
      const target = e.target;
      if(target.classList.contains('dec')) {
        updateQty(target.dataset.id, -1);
      } else if(target.classList.contains('inc')) {
        updateQty(target.dataset.id, 1);
      } else if(target.classList.contains('remove')) {
        removeFromCart(target.dataset.id);
      }
    });

    clearCartBtn.addEventListener('click', () => {
      if(!confirm('Clear cart?')) return;
      cart = [];
      saveCart(cart);
      renderCart();
      showToast('Cart cleared');
    });

    checkoutBtn.addEventListener('click', () => {
      if(cart.length === 0){ alert('Your cart is empty.'); return; }
      alert(`Thanks for your purchase! Total ${formatINR(cart.reduce((s,i)=>s+i.price*i.qty,0))}`);
      cart = []; saveCart(cart); renderCart(); cartModal.setAttribute('aria-hidden','true');
    });

    function openCart(){ cartModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; renderCart(); }
    function closeCart(){ cartModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

    openCartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartBackdrop.addEventListener('click', closeCart);

    document.addEventListener('keydown', e => { if(e.key==='Escape'){ closeCart(); } });

    document.querySelectorAll('.nav-scroll').forEach(btn => {
      btn.addEventListener('click', () => {
        const tgt = btn.dataset.target;
        const el = document.getElementById(tgt);
        if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });
    navBtns.forEach(b => b.addEventListener('click', () => {
      navBtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const target = b.dataset.target;
      if(target){ const el = document.getElementById(target); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }
      if(b.classList.contains('cart-toggle')) openCart();
    }));

    // ---------- Slider ----------
    let currentSlide = 0;
    let slideInterval = null;
    const SLIDE_DELAY = 3500;
    let isPaused = false;

    function buildSlider(){
      slidesContainer.innerHTML = '';
      sliderDots.innerHTML = '';
      SLIDER_IMAGES.forEach((src, i) => {
        const s = document.createElement('div');
        s.className = 'slide' + (i===0 ? ' active' : '');
        s.innerHTML = `<img src="${src}" alt="slide ${i+1}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
        slidesContainer.appendChild(s);

        const dot = document.createElement('div');
        dot.className = 'slider-dot' + (i===0 ? ' active' : '');
        dot.dataset.index = i;
        dot.addEventListener('click', ()=> goToSlide(i));
        sliderDots.appendChild(dot);
      });
    }

    function goToSlide(index){
      const slides = Array.from(slidesContainer.children);
      const dots = Array.from(sliderDots.children);
      slides.forEach((s, idx)=> s.classList.toggle('active', idx===index));
      dots.forEach((d, idx)=> d.classList.toggle('active', idx===index));
      currentSlide = index;
    }
    function nextSlide(){ goToSlide((currentSlide + 1) % SLIDER_IMAGES.length); }
    function prevSlide(){ goToSlide((currentSlide - 1 + SLIDER_IMAGES.length) % SLIDER_IMAGES.length); }

    sliderNext.addEventListener('click', ()=> { nextSlide(); resetAuto(); });
    sliderPrev.addEventListener('click', ()=> { prevSlide(); resetAuto(); });

    function startAuto(){ stopAuto(); slideInterval = setInterval(()=> { if(!isPaused) nextSlide(); }, SLIDE_DELAY); }
    function stopAuto(){ if(slideInterval) clearInterval(slideInterval); slideInterval = null; }
    function resetAuto(){ stopAuto(); startAuto(); }

    sliderEl.addEventListener('mouseenter', ()=> isPaused = true);
    sliderEl.addEventListener('mouseleave', ()=> isPaused = false);
    sliderEl.addEventListener('focusin', ()=> isPaused = true);
    sliderEl.addEventListener('focusout', ()=> isPaused = false);

    (function addSwipe(){
      let startX = 0, endX = 0, startTime = 0;
      sliderEl.addEventListener('touchstart', (e)=> { startX = e.touches[0].clientX; startTime = Date.now(); isPaused = true; }, {passive:true});
      sliderEl.addEventListener('touchmove', (e)=> { endX = e.touches[0].clientX; }, {passive:true});
      sliderEl.addEventListener('touchend', ()=> {
        isPaused = false;
        const dx = endX - startX; const dt = Date.now() - startTime;
        if(Math.abs(dx) > 40 && dt < 500){ if(dx < 0) nextSlide(); else prevSlide(); resetAuto(); }
        startX = endX = 0;
      });
    })();

    buildSlider();
    startAuto();
    renderProducts();
    renderCart();
  });
})();

// ---------- Typed.js for hero title ----------
new Typed("#typeText", {
  strings: ["Welcome to Cuddle Kingdom", "Where Cuteness Lives ❤️"],
  typeSpeed: 100,
  backSpeed: 30,
  loop: true
});

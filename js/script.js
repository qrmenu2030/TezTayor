(() => {
  // Elements
  const cartBtn = document.getElementById('cartBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCart = document.getElementById('closeCart');
  const cartItemsEl = document.getElementById('cartItems');
  const cartCountEl = document.getElementById('cartCount');
  const cartTotalItemsEl = document.getElementById('cartTotalItems');
  const cartTotalPriceEl = document.getElementById('cartTotalPrice');
  const clearCartBtn = document.getElementById('clearCart');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const orderModal = document.getElementById('orderModal');
  const closeOrder = document.getElementById('closeOrder');
  const orderForm = document.getElementById('orderForm');
  const cancelOrderBtn = document.getElementById('cancelOrder');
  const addressBlock = document.getElementById('addressBlock');
  const sendWhatsAppBtn = document.getElementById('sendWhatsApp'); // Новая кнопка

  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const contactBtn = document.getElementById('contactBtn');
  const contactModal = document.getElementById('contactModal');

  const menuItems = document.querySelectorAll('.menu-item');

  // state: cart stored as object { id: { id, name, price, img, qty } }
  let cart = JSON.parse(localStorage.getItem('cart')) || {};

  // Helpers
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function calcTotals() {
    let totalItems = 0, totalPrice = 0;
    Object.values(cart).forEach(it => {
      totalItems += it.qty;
      totalPrice += it.qty * Number(it.price);
    });
    return { totalItems, totalPrice };
  }

  function renderCart() {
    cartItemsEl.innerHTML = '';
    const items = Object.values(cart);
    if (items.length === 0) {
      cartItemsEl.innerHTML = '<p>Корзина пуста.</p>';
    } else {
      items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <img src="${it.img}" alt="${it.name}">
          <div class="title">${it.name} — ${it.price} сом</div>
          <div class="qty-controls">
            <button class="btn-qty" data-id="${it.id}" data-delta="-1" aria-label="Убавить">-</button>
            <div class="qty">${it.qty}</div>
            <button class="btn-qty" data-id="${it.id}" data-delta="1" aria-label="Прибавить">+</button>
          </div>
        `;
        cartItemsEl.appendChild(row);
      });
    }

    const totals = calcTotals();
    cartCountEl.textContent = totals.totalItems;
    cartTotalItemsEl.textContent = totals.totalItems;
    cartTotalPriceEl.textContent = totals.totalPrice;
    clearCartBtn.disabled = totals.totalItems === 0;
    checkoutBtn.disabled = totals.totalItems === 0;

    // attach handlers to +/- buttons
    const qtyBtns = cartItemsEl.querySelectorAll('.btn-qty');
    qtyBtns.forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        const delta = Number(b.dataset.delta);
        changeQty(Number(id), delta);
      });
    });

    saveCart();
  }

  function changeQty(id, delta) {
    const key = String(id);
    if (!cart[key]) return;
    cart[key].qty += delta;
    if (cart[key].qty <= 0) delete cart[key];
    renderCart();
  }

  function addToCartFromElement(el) {
    const id = String(el.dataset.id);
    const name = el.dataset.name;
    const price = Number(el.dataset.price);
    const img = el.dataset.img;
    if (!cart[id]) {
      cart[id] = { id: Number(id), name, price, img, qty: 1 };
    } else {
      cart[id].qty += 1;
    }
    renderCart();
  }

  menuItems.forEach(el => {
    const btn = el.querySelector('.add-to-cart');
    btn.addEventListener('click', () => addToCartFromElement(el));
  });

  // Cart modal open/close
  cartBtn.addEventListener('click', () => openModal(cartModal));
  closeCart.addEventListener('click', () => closeModal(cartModal));
  cartModal.addEventListener('click', (e) => { if (e.target === cartModal) closeModal(cartModal); });

  // Clear cart
  clearCartBtn.addEventListener('click', () => {
    if (confirm('Очистить корзину?')) {
      cart = {};
      renderCart();
    }
  });

  // Checkout -> open order modal
  checkoutBtn.addEventListener('click', () => {
    openModal(orderModal);
    setCartButtonsDisabled(true);
  });

  // Order modal handlers
  closeOrder.addEventListener('click', () => {
    closeModal(orderModal);
    setCartButtonsDisabled(false);
  });
  orderModal.addEventListener('click', (e) => { if (e.target === orderModal) { closeModal(orderModal); setCartButtonsDisabled(false); } });
  cancelOrderBtn.addEventListener('click', () => { closeModal(orderModal); setCartButtonsDisabled(false); });

  // Show/hide address field
  orderForm.delivery?.forEach?.(r => r.addEventListener('change', onDeliveryChange));
  function onDeliveryChange() {
    const val = orderForm.querySelector('input[name="delivery"]:checked').value;
    addressBlock.style.display = val === 'delivery' ? 'block' : 'none';
  }
  onDeliveryChange();

  // Order submit (локальное подтверждение)
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const addressInput = document.getElementById('customerAddress');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const deliveryVal = orderForm.querySelector('input[name="delivery"]:checked').value;

    if (!/^[А-Яа-яЁёA-Za-z]+$/.test(name)) { alert('Имя должно содержать только буквы.'); nameInput.focus(); return; }
    if (!/^[0-9]{9}$/.test(phone)) { alert('Телефон 9 цифр.'); phoneInput.focus(); return; }
    if (deliveryVal === 'delivery' && !addressInput.value.trim()) { alert('Укажите адрес.'); addressInput.focus(); return; }

    const totals = calcTotals();
    const totalQty = totals.totalItems;
    const totalSum = totals.totalPrice;
    const phoneFull = '+992 ' + phone;
    const deliveryText = deliveryVal === 'pickup' ? 'Самовывоз' : 'Доставка';
    const addressText = deliveryVal === 'delivery' ? addressInput.value.trim() : '-';

    alert(`Ваш заказ подтверждён!\nКоличество: ${totalQty}\nСумма: ${totalSum} сомони`);

    // Очистка корзины
    cart = {};
    saveCart();
    renderCart();
    closeModal(orderModal);
    closeModal(cartModal);
    setCartButtonsDisabled(false);
  });

  // WhatsApp кнопка
  sendWhatsAppBtn.addEventListener('click', () => {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const deliveryVal = orderForm.querySelector('input[name="delivery"]:checked').value;
    const address = document.getElementById('customerAddress').value.trim();

    if (!/^[А-Яа-яЁёA-Za-z]+$/.test(name)) { alert('Имя должно содержать только буквы.'); return; }
    if (!/^[0-9]{9}$/.test(phone)) { alert('Телефон 9 цифр.'); return; }
    if (deliveryVal === 'delivery' && !address) { alert('Укажите адрес.'); return; }

    const totals = calcTotals();
    if (totals.totalItems === 0) { alert('Корзина пуста!'); return; }

    const totalQty = totals.totalItems;
    const totalSum = totals.totalPrice;
    const phoneFull = '+992 ' + phone;
    const deliveryText = deliveryVal === 'pickup' ? 'Самовывоз' : 'Доставка';
    const addressText = deliveryVal === 'delivery' ? address : '-';

    const waNumber = '992000000000'; // заменить на реальный номер
    const waMessage = encodeURIComponent(
      `Заказ из TezTayor\n\nИмя: ${name}\nТелефон: ${phoneFull}\nТип: ${deliveryText}\nАдрес: ${addressText}\n\nКоличество блюд: ${totalQty}\nИтоговая сумма: ${totalSum} сомони`
    );
    window.open(`https://wa.me/${waNumber}?text=${waMessage}`, '_blank');
  });

  // About / Contact modals
  aboutBtn.addEventListener('click', () => openModal(aboutModal));
  contactBtn.addEventListener('click', () => openModal(contactModal));
  document.querySelectorAll('.modal .modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const closeTarget = btn.getAttribute('data-close');
      if (closeTarget) {
        const m = document.getElementById(closeTarget);
        if (m) closeModal(m);
      } else {
        let p = btn.closest('.modal');
        if (p) closeModal(p);
      }
      setCartButtonsDisabled(false);
    });
  });

  // Modal utilities
  function openModal(modal) {
    modal.setAttribute('aria-hidden', 'false');
    if (modal === orderModal) setCartButtonsDisabled(true);
  }
  function closeModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    if (modal === orderModal) setCartButtonsDisabled(false);
  }
  function setCartButtonsDisabled(state) {
    cartItemsEl.querySelectorAll('.btn-qty').forEach(b => b.disabled = state);
    clearCartBtn.disabled = state || Object.keys(cart).length === 0;
    checkoutBtn.disabled = state || Object.keys(cart).length === 0;
    document.querySelectorAll('.add-to-cart').forEach(b => b.disabled = state);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [orderModal, cartModal, aboutModal, contactModal].forEach(m => m.setAttribute('aria-hidden', 'true'));
      setCartButtonsDisabled(false);
    }
  });

  renderCart();
})();
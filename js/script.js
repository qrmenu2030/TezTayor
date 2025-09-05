/* Simple cart + modal + order handling with localStorage.
   Phone: user inputs 9 digits, prefix +992 shown separately.
   Name: only letters (Cyrillic or Latin).
   Delivery option: pickup or delivery (if delivery -> address required in confirm step).
*/

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
      b.addEventListener('click', (e) => {
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

  // Add event listeners to menu "Добавить"
  menuItems.forEach(el => {
    const btn = el.querySelector('.add-to-cart');
    btn.addEventListener('click', () => {
      addToCartFromElement(el);
    });
  });

  // Cart modal open/close
  cartBtn.addEventListener('click', () => {
    openModal(cartModal);
  });
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
    // блокируем кнопки в корзине (в модале корзины)
    setCartButtonsDisabled(true);
  });

  // Order modal handlers
  closeOrder.addEventListener('click', () => {
    closeModal(orderModal);
    setCartButtonsDisabled(false);
  });
  orderModal.addEventListener('click', (e) => { if (e.target === orderModal) { closeModal(orderModal); setCartButtonsDisabled(false); } });

  cancelOrderBtn.addEventListener('click', () => {
    // Отмена заказа — закрыть форму и вернуться в корзину
    closeModal(orderModal);
    setCartButtonsDisabled(false);
    // оставить корзину как была
  });

  // Show/hide address field based on radio
  orderForm.delivery?.forEach?.(r => {
    r.addEventListener('change', onDeliveryChange);
  });
  function onDeliveryChange() {
    const val = orderForm.querySelector('input[name="delivery"]:checked').value;
    if (val === 'delivery') addressBlock.style.display = 'block';
    else addressBlock.style.display = 'none';
  }
  // init
  onDeliveryChange();

  // Order submit
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // validate name (only letters)
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const addressInput = document.getElementById('customerAddress');
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const deliveryVal = orderForm.querySelector('input[name="delivery"]:checked').value;

    const nameValid = /^[А-Яа-яЁёA-Za-z]+$/.test(name);
    const phoneValid = /^[0-9]{9}$/.test(phone);

    if (!nameValid) {
      alert('Имя должно содержать только буквы (без пробелов и цифр).');
      nameInput.focus();
      return;
    }
    if (!phoneValid) {
      alert('Телефон должен содержать 9 цифр (без +992). Пример: 000000000');
      phoneInput.focus();
      return;
    }
    if (deliveryVal === 'delivery') {
      const addr = addressInput.value.trim();
      if (!addr) {
        alert('Пожалуйста, укажите адрес для доставки (г. Душанбе, улица, дом).');
        addressInput.focus();
        return;
      }
    }

    // Собираем итоговые данные
    const totals = calcTotals();
    const totalQty = totals.totalItems;
    const totalSum = totals.totalPrice;
    const phoneFull = '+992 ' + phone;
    const deliveryText = deliveryVal === 'pickup' ? 'Самовывоз' : 'Доставка';
    const addressText = deliveryVal === 'delivery' ? addressInput.value.trim() : '-';

    // Формируем строку подтверждения (можно заменить на отправку на сервер)
    const summary = `ПОДТВЕРЖДЕНИЕ ЗАКАЗА\n\nИмя: ${name}\nТелефон: ${phoneFull}\nТип: ${deliveryText}\nАдрес: ${addressText}\n\nКоличество блюд: ${totalQty}\nИтоговая сумма: ${totalSum} сомони\n\nНажмите OK чтобы подтвердить — после подтверждения корзина очистится.`;

    if (confirm(summary)) {
      // подтверждение: тут можно отправить на сервер; для демо — просто очищаем корзину и закрываем модалки
      cart = {};
      saveCart();
      renderCart();
      closeModal(orderModal);
      closeModal(cartModal);
      setCartButtonsDisabled(false);
      alert('Ваш заказ подтверждён. Спасибо!');
    } else {
      // если пользователь передумал — остаёмся в форме, ничего не делаем
    }
  });

  // About / Contact modals
  aboutBtn.addEventListener('click', () => openModal(aboutModal));
  contactBtn.addEventListener('click', () => openModal(contactModal));
  // close buttons
  document.querySelectorAll('.modal .modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const closeTarget = btn.getAttribute('data-close');
      if (closeTarget) {
        const m = document.getElementById(closeTarget);
        if (m) closeModal(m);
      } else {
        // find parent modal
        let p = btn.closest('.modal');
        if (p) closeModal(p);
      }
      setCartButtonsDisabled(false);
    });
  });

  // Utility: open/close modals by toggling aria-hidden
  function openModal(modal) {
    modal.setAttribute('aria-hidden', 'false');
    // if opening orderModal → also block cart controls so user can't change while form open
    if (modal === orderModal) setCartButtonsDisabled(true);
    // trap focus could be added; omitted for brevity
  }
  function closeModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    if (modal === orderModal) setCartButtonsDisabled(false);
  }

  // Disable/enable controls in cart while order form open
  function setCartButtonsDisabled(state) {
    // disable qty buttons and action buttons in cart modal
    const allQty = cartItemsEl.querySelectorAll('.btn-qty');
    allQty.forEach(b => b.disabled = state);
    clearCartBtn.disabled = state || Object.keys(cart).length === 0;
    checkoutBtn.disabled = state || Object.keys(cart).length === 0;
    // also disable add buttons on menu to prevent changes if needed
    document.querySelectorAll('.add-to-cart').forEach(b => b.disabled = state);
  }

  // Close cart when clicked outside
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // close any open modal
      [orderModal, cartModal, aboutModal, contactModal].forEach(m => m.setAttribute('aria-hidden', 'true'));
      setCartButtonsDisabled(false);
    }
  });

  // initial render
  renderCart();
})();
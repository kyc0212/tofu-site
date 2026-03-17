const STORE_ID = "tofu";
const STORE_NAME = "嘟嘟嘟嘟maxverstappen豆花店";
const INPUT_LABEL = "桌號";
const MENU_DATA_URL = "https://kyc0212.github.io/sharedmenu/menu-data.json";

const elements = {
  landingSection: document.getElementById("landingSection"),
  menuSection: document.getElementById("menuSection"),
  customerInput: document.getElementById("customerInfoInput"),
  customerDisplay: document.getElementById("customerDisplay"),
  startOrderBtn: document.getElementById("startOrderBtn"),
  backToHomeBtn: document.getElementById("backToHomeBtn"),
  categoryNav: document.getElementById("categoryNav"),
  menuGrid: document.getElementById("menuGrid"),
  scrollToMenuBtn: document.getElementById("scrollToMenuBtn"),
  cartFab: document.getElementById("cartFab"),
  cartDrawer: document.getElementById("cartDrawer"),
  closeCartBtn: document.getElementById("closeCartBtn"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  cartItems: document.getElementById("cartItems"),
  cartTotal: document.getElementById("cartTotal"),
  cartCountBadge: document.getElementById("cartCountBadge"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  paymentHint: document.getElementById("paymentHint"),
  paymentOptions: Array.from(document.querySelectorAll(".payment-option")),
  productModal: document.getElementById("productModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  modalImage: document.getElementById("modalImage"),
  modalCategory: document.getElementById("modalCategory"),
  modalName: document.getElementById("modalName"),
  modalDescription: document.getElementById("modalDescription"),
  modalPrice: document.getElementById("modalPrice"),
  standardOptionsBlock: document.getElementById("standardOptionsBlock"),
  standardOptionsList: document.getElementById("standardOptionsList"),
  drinkOptionsBlock: document.getElementById("drinkOptionsBlock"),
  sweetnessSelect: document.getElementById("sweetnessSelect"),
  iceSelect: document.getElementById("iceSelect"),
  toppingsList: document.getElementById("toppingsList"),
  itemNote: document.getElementById("itemNote"),
  itemQty: document.getElementById("itemQty"),
  increaseQtyBtn: document.getElementById("increaseQtyBtn"),
  decreaseQtyBtn: document.getElementById("decreaseQtyBtn"),
  addToCartBtn: document.getElementById("addToCartBtn"),
  completionScreen: document.getElementById("completionScreen"),
  completionBadge: document.getElementById("completionBadge"),
  completionTitle: document.getElementById("completionTitle"),
  completionMessage: document.getElementById("completionMessage"),
  summaryOrderId: document.getElementById("summaryOrderId"),
  summaryCustomerInfo: document.getElementById("summaryCustomerInfo"),
  summaryPaymentMethod: document.getElementById("summaryPaymentMethod"),
  summaryTotal: document.getElementById("summaryTotal"),
  summaryTime: document.getElementById("summaryTime"),
  summaryItems: document.getElementById("summaryItems"),
  copyOrderBtn: document.getElementById("copyOrderBtn"),
  downloadTxtBtn: document.getElementById("downloadTxtBtn"),
  downloadJsonBtn: document.getElementById("downloadJsonBtn"),
  finishBtn: document.getElementById("finishBtn"),
  toast: document.getElementById("toast")
};

const state = {
  store: null,
  categories: [],
  activeCategory: "全部",
  cart: [],
  selectedPayment: "",
  customerInfo: "",
  currentItem: null,
  currentQty: 1,
  latestOrder: null
};

async function init() {
  bindEvents();
  try {
    const data = await fetchMenuData();
    const store = data.stores.find((item) => item.storeId === STORE_ID);
    if (!store) throw new Error("找不到對應的店家資料");
    state.store = store;
    state.categories = ["全部", ...(store.categories || [])];
    renderCategoryNav();
    renderMenuGrid();
  } catch (error) {
    elements.menuGrid.innerHTML = `<div class="empty-state">菜單載入失敗。<br>請確認 MENU_DATA_URL 是否已改成你的公開 menu-data.json 網址。</div>`;
    console.error(error);
  }
}

async function fetchMenuData() {
  const response = await fetch(MENU_DATA_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("menu-data.json 載入失敗");
  return response.json();
}

function bindEvents() {
  elements.startOrderBtn.addEventListener("click", handleStartOrder);
  elements.backToHomeBtn.addEventListener("click", resetToHome);
  elements.scrollToMenuBtn.addEventListener("click", () => window.scrollTo({ top: elements.menuSection.offsetTop, behavior: "smooth" }));
  elements.cartFab.addEventListener("click", openCartDrawer);
  elements.closeCartBtn.addEventListener("click", closeCartDrawer);
  elements.drawerBackdrop.addEventListener("click", closeCartDrawer);
  elements.closeModalBtn.addEventListener("click", closeModal);
  elements.productModal.addEventListener("click", (event) => {
    if (event.target === elements.productModal) closeModal();
  });
  elements.paymentOptions.forEach((button) => {
    button.addEventListener("click", () => selectPayment(button.dataset.payment));
  });
  elements.checkoutBtn.addEventListener("click", submitOrder);
  elements.increaseQtyBtn.addEventListener("click", () => changeModalQty(1));
  elements.decreaseQtyBtn.addEventListener("click", () => changeModalQty(-1));
  elements.addToCartBtn.addEventListener("click", addCurrentItemToCart);
  elements.copyOrderBtn.addEventListener("click", copyOrderSummary);
  elements.downloadTxtBtn.addEventListener("click", () => downloadLatestOrder("txt"));
  elements.downloadJsonBtn.addEventListener("click", () => downloadLatestOrder("json"));
  elements.finishBtn.addEventListener("click", () => {
    elements.completionScreen.classList.add("hidden");
    resetToHome();
  });
}

function handleStartOrder() {
  const value = elements.customerInput.value.trim();
  if (!value) {
    showToast(`請先輸入${INPUT_LABEL}`);
    elements.customerInput.focus();
    return;
  }
  state.customerInfo = value;
  elements.customerDisplay.textContent = `${INPUT_LABEL}：${value}`;
  elements.landingSection.classList.add("hidden");
  elements.menuSection.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetToHome() {
  state.cart = [];
  state.selectedPayment = "";
  state.customerInfo = "";
  state.latestOrder = null;
  elements.customerInput.value = "";
  elements.customerDisplay.textContent = "";
  elements.menuSection.classList.add("hidden");
  elements.landingSection.classList.remove("hidden");
  closeCartDrawer();
  renderCart();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCategoryNav() {
  elements.categoryNav.innerHTML = "";
  state.categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = `category-pill ${state.activeCategory === category ? "active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      state.activeCategory = category;
      renderCategoryNav();
      renderMenuGrid();
    });
    elements.categoryNav.appendChild(button);
  });
}

function renderMenuGrid() {
  if (!state.store) return;
  const items = (state.store.menuItems || []).filter((item) =>
    state.activeCategory === "全部" ? true : item.category === state.activeCategory
  );

  if (!items.length) {
    elements.menuGrid.innerHTML = `<div class="empty-state">這個分類目前沒有商品。</div>`;
    return;
  }

  elements.menuGrid.innerHTML = items.map((item) => `
    <article class="menu-card">
      <div class="menu-card-image">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="menu-card-body">
        <div class="menu-card-header">
          <div>
            <p class="eyebrow">${item.category}</p>
            <h3>${item.name}</h3>
          </div>
          <span class="price-tag">NT$ ${item.price}</span>
        </div>
        <p>${item.description || ""}</p>
        <button class="primary-btn" data-item-id="${item.id}">查看詳情</button>
      </div>
    </article>
  `).join("");

  elements.menuGrid.querySelectorAll("[data-item-id]").forEach((button) => {
    button.addEventListener("click", () => openProductModal(button.dataset.itemId));
  });
}

function openProductModal(itemId) {
  const item = state.store.menuItems.find((entry) => entry.id === itemId);
  if (!item) return;
  state.currentItem = item;
  state.currentQty = 1;
  elements.itemQty.textContent = "1";
  elements.itemNote.value = "";
  elements.modalImage.src = item.image;
  elements.modalImage.alt = item.name;
  elements.modalCategory.textContent = item.category;
  elements.modalName.textContent = item.name;
  elements.modalDescription.textContent = item.description || "";
  elements.modalPrice.textContent = `NT$ ${item.price}`;

  const isDrink = Array.isArray(item.sweetnessOptions) || Array.isArray(item.iceOptions) || Array.isArray(item.toppings);
  elements.standardOptionsBlock.classList.toggle("hidden", isDrink);
  elements.drinkOptionsBlock.classList.toggle("hidden", !isDrink);

  if (isDrink) {
    populateSelect(elements.sweetnessSelect, item.sweetnessOptions || ["正常糖"]);
    populateSelect(elements.iceSelect, item.iceOptions || ["正常冰"]);
    elements.toppingsList.innerHTML = (item.toppings || []).map((option, index) => `
      <label class="option-chip">
        <input type="checkbox" value="${option}" data-topping-index="${index}">
        <span>${option}</span>
      </label>
    `).join("");
  } else {
    elements.standardOptionsList.innerHTML = (item.options || []).map((option, index) => `
      <label class="option-chip">
        <input type="checkbox" value="${option}" data-option-index="${index}">
        <span>${option}</span>
      </label>
    `).join("") || '<div class="empty-state">此商品目前沒有額外選項。</div>';
  }

  elements.productModal.classList.remove("hidden");
  elements.productModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  elements.productModal.classList.add("hidden");
  elements.productModal.setAttribute("aria-hidden", "true");
}

function populateSelect(target, options) {
  target.innerHTML = options.map((option) => `<option value="${option}">${option}</option>`).join("");
}

function changeModalQty(delta) {
  state.currentQty = Math.max(1, state.currentQty + delta);
  elements.itemQty.textContent = String(state.currentQty);
}

function addCurrentItemToCart() {
  if (!state.currentItem) return;

  const selectedStandardOptions = Array.from(elements.standardOptionsList.querySelectorAll('input:checked')).map((input) => input.value);
  const selectedToppings = Array.from(elements.toppingsList.querySelectorAll('input:checked')).map((input) => input.value);
  const isDrink = Array.isArray(state.currentItem.sweetnessOptions) || Array.isArray(state.currentItem.iceOptions) || Array.isArray(state.currentItem.toppings);
  const selections = {
    note: elements.itemNote.value.trim(),
    quantity: state.currentQty,
    standardOptions: selectedStandardOptions,
    sweetness: isDrink ? elements.sweetnessSelect.value : "",
    ice: isDrink ? elements.iceSelect.value : "",
    toppings: selectedToppings
  };

  const cartItem = {
    lineId: crypto.randomUUID(),
    itemId: state.currentItem.id,
    name: state.currentItem.name,
    price: state.currentItem.price,
    quantity: selections.quantity,
    note: selections.note,
    selections
  };

  state.cart.push(cartItem);
  renderCart();
  closeModal();
  openCartDrawer();
  showToast("已加入購物車");
}

function renderCart() {
  if (!state.cart.length) {
    elements.cartItems.innerHTML = `<div class="empty-state">購物車目前是空的，先去挑個想吃的吧。</div>`;
  } else {
    elements.cartItems.innerHTML = state.cart.map((item) => {
      const optionsText = buildOptionText(item.selections);
      return `
        <article class="cart-item">
          <div class="cart-item-top">
            <div>
              <strong>${item.name}</strong>
              <small>${optionsText || "無額外選項"}${item.note ? `｜備註：${item.note}` : ""}</small>
            </div>
            <strong>NT$ ${item.price * item.quantity}</strong>
          </div>
          <div class="cart-item-bottom">
            <div class="qty-inline">
              <button type="button" data-cart-action="decrease" data-line-id="${item.lineId}">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-action="increase" data-line-id="${item.lineId}">＋</button>
            </div>
            <button class="ghost-btn" data-cart-action="remove" data-line-id="${item.lineId}">刪除</button>
          </div>
        </article>
      `;
    }).join("");

    elements.cartItems.querySelectorAll("[data-cart-action]").forEach((button) => {
      button.addEventListener("click", () => updateCartItem(button.dataset.lineId, button.dataset.cartAction));
    });
  }

  const totalQuantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getCartTotal();
  elements.cartCountBadge.textContent = String(totalQuantity);
  elements.cartTotal.textContent = `NT$ ${totalPrice}`;
  elements.paymentHint.textContent = state.selectedPayment ? `已選擇：${state.selectedPayment === "cash" ? "現金結帳" : "線上結帳"}` : "請先選擇付款方式。";
}

function updateCartItem(lineId, action) {
  const target = state.cart.find((item) => item.lineId === lineId);
  if (!target) return;
  if (action === "increase") target.quantity += 1;
  if (action === "decrease") target.quantity = Math.max(1, target.quantity - 1);
  if (action === "remove") state.cart = state.cart.filter((item) => item.lineId !== lineId);
  renderCart();
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function openCartDrawer() {
  elements.cartDrawer.classList.add("open");
  elements.drawerBackdrop.classList.remove("hidden");
  elements.cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCartDrawer() {
  elements.cartDrawer.classList.remove("open");
  elements.drawerBackdrop.classList.add("hidden");
  elements.cartDrawer.setAttribute("aria-hidden", "true");
}

function selectPayment(method) {
  state.selectedPayment = method;
  elements.paymentOptions.forEach((button) => {
    button.classList.toggle("active", button.dataset.payment === method);
  });
  renderCart();
}

function submitOrder() {
  if (!state.cart.length) {
    showToast("購物車還是空的，先選幾樣甜品吧。");
    return;
  }
  if (!state.selectedPayment) {
    showToast("請先選擇付款方式。");
    return;
  }
  const order = buildOrderObject();
  state.latestOrder = order;
  showCompletion(order);
  state.cart = [];
  state.selectedPayment = "";
  renderCart();
  closeCartDrawer();
}

function buildOrderObject() {
  const now = new Date();
  return {
    orderId: `ORD-${Date.now().toString().slice(-8)}`,
    storeId: STORE_ID,
    storeName: STORE_NAME,
    customerLabel: INPUT_LABEL,
    customerInfo: state.customerInfo,
    paymentMethod: state.selectedPayment === "cash" ? "現金結帳" : "線上結帳",
    createdAt: now.toLocaleString("zh-TW", { hour12: false }),
    total: getCartTotal(),
    items: state.cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      optionsText: buildOptionText(item.selections),
      note: item.note
    }))
  };
}

function showCompletion(order) {
  const isCash = order.paymentMethod === "現金結帳";
  elements.completionBadge.textContent = isCash ? "Cash Checkout" : "Payment Success";
  elements.completionTitle.textContent = isCash ? "請至櫃檯結帳" : "付款成功，訂單已建立";
  elements.completionMessage.textContent = isCash
    ? "請出示以下訂單摘要給店員，櫃檯會比較快找到你的甜品。"
    : "這是模擬付款成功頁，正式版之後可再串接金流。";
  elements.summaryOrderId.textContent = order.orderId;
  elements.summaryCustomerInfo.textContent = order.customerInfo;
  elements.summaryPaymentMethod.textContent = order.paymentMethod;
  elements.summaryTotal.textContent = `NT$ ${order.total}`;
  elements.summaryTime.textContent = order.createdAt;
  elements.summaryItems.innerHTML = order.items.map((item) => `
    <li>
      <strong>${item.name} × ${item.quantity}</strong><br>
      <small>${item.optionsText || "無額外選項"}${item.note ? `｜備註：${item.note}` : ""}</small><br>
      <small>小計：NT$ ${item.subtotal}</small>
    </li>
  `).join("");
  elements.completionScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildOptionText(selections) {
  const parts = [];
  if (selections.standardOptions?.length) parts.push(selections.standardOptions.join("、"));
  if (selections.sweetness) parts.push(`甜度：${selections.sweetness}`);
  if (selections.ice) parts.push(`冰量：${selections.ice}`);
  if (selections.toppings?.length) parts.push(`加料：${selections.toppings.join("、")}`);
  return parts.join("｜");
}

function copyOrderSummary() {
  if (!state.latestOrder) return;
  const text = formatOrderText(state.latestOrder);
  navigator.clipboard.writeText(text).then(() => showToast("訂單摘要已複製"));
}

function formatOrderText(order) {
  const lines = [
    `${order.storeName}`,
    `訂單編號：${order.orderId}`,
    `${order.customerLabel}：${order.customerInfo}`,
    `付款方式：${order.paymentMethod}`,
    `下單時間：${order.createdAt}`,
    "----------------------"
  ];
  order.items.forEach((item) => {
    lines.push(`${item.name} x ${item.quantity} / NT$ ${item.subtotal}`);
    if (item.optionsText) lines.push(`  選項：${item.optionsText}`);
    if (item.note) lines.push(`  備註：${item.note}`);
  });
  lines.push("----------------------");
  lines.push(`總金額：NT$ ${order.total}`);
  return lines.join("\n");
}

function downloadLatestOrder(type) {
  if (!state.latestOrder) return;
  const filename = `${STORE_ID}-${state.latestOrder.orderId}.${type === "json" ? "json" : "txt"}`;
  const content = type === "json"
    ? JSON.stringify(state.latestOrder, null, 2)
    : formatOrderText(state.latestOrder);
  const blob = new Blob([content], { type: type === "json" ? "application/json" : "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

let toastTimer = null;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.add("hidden"), 2200);
}

init();

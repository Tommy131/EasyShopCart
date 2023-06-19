/*
 *        _____   _          __  _____   _____   _       _____   _____
 *      /  _  \ | |        / / /  _  \ |  _  \ | |     /  _  \ /  ___|
 *      | | | | | |  __   / /  | | | | | |_| | | |     | | | | | |
 *      | | | | | | /  | / /   | | | | |  _  { | |     | | | | | |   _
 *      | |_| | | |/   |/ /    | |_| | | |_| | | |___  | |_| | | |_| |
 *      \_____/ |___/|___/     \_____/ |_____/ |_____| \_____/ \_____/
 *
 *  Copyright (c) 2023 by OwOTeam-DGMT (OwOBlog).
 * @Date         : 2023-06-19 21:16:49
 * @Author       : HanskiJay
 * @LastEditors  : HanskiJay
 * @LastEditTime : 2023-06-19 22:06:01
 * @E-Mail       : support@owoblog.com
 * @Telegram     : https://t.me/HanskiJay
 * @GitHub       : https://github.com/Tommy131
 */

const unit = '€'; // 商品价格单位

// 获取DOM元素
const itemContainer = document.getElementById('itemList');
const cartContainer = document.getElementById('cartList');
const checkoutBtn = document.getElementById('checkoutBtn');

const cartItems = []; // 购物车商品对象

// TODO: 仅用于测试, 后期项目上线改为后端统一计算商品价格
let totalPrice = 0; // 总价格

// 按钮禁用/启用切换逻辑
const toggleButton = {
  toggle(button, condition) {
    if (typeof button === 'object') {
      if (condition) {
        button.classList.add('disabled');
        button.disabled = true;
      } else {
        button.classList.remove('disabled');
        button.disabled = false;
      }
    }
  },
  setLoading(isLoading) {
    if (isLoading) {
      document.querySelector("#submit").disabled = true;
      document.querySelector("#spinner").classList.remove("hidden");
      document.querySelector("#button-text").classList.add("hidden");
    } else {
      document.querySelector("#submit").disabled = false;
      document.querySelector("#spinner").classList.add("hidden");
      document.querySelector("#button-text").classList.remove("hidden");
    }
  }
};

// 商品操作
const itemOperations = {
  // 通过id获取商品信息
  getFromId(itemId) {
    const item = itemList.find(item => item.id == itemId);
    return item;
  },

  getStockSpanDiv(itemId) {
    return document.querySelector(`#itemId_${itemId} .stock-info span`);
  },

  // 设置商品库存显示
  setStockQuantity(itemId, count) {
    const stockSpanDiv = this.getStockSpanDiv(itemId);
    stockSpanDiv.innerText = count > 100 ? '100+' : count;
  },

  // 更新物品库存颜色显示
  updateStockColor(item) {
    if(!item.id) {
      return
    }

    const stockSpanDiv = this.getStockSpanDiv(item.id);

    switch(true) {
      case item.stock <= 10:
        stockSpanDiv.className = 'inventory-shortage';
        break;

      case item.stock > 10 && item.stock <= 30:
        stockSpanDiv.className = 'tight-supply';
        break;
    }
  }
};

// 购物车操作
const cartOperations = {
  // 判断购物车中是否存在商品
  has(itemId) {
    return cartItems[itemId] !== undefined;
  },

  // 减少商品数量
  decreaseQuantity(itemId) {
    if(!this.has(itemId)) {
      return;
    }

    if (cartItems[itemId].quantity > 1) {
      cartItems[itemId].quantity--;
      cartItems[itemId].stock++;
      this.updateCart();
    }
    const quantity = cartItems[itemId].quantity;
    toggleButton.toggle(document.querySelector(`#itemId_${itemId} button`), quantity < 1);
  },

  // 增加商品数量
  increaseQuantity(itemId) {
    if(!this.has(itemId)) {
      return;
    }

    const cartItem = cartItems[itemId];
    if (cartItem.quantity < itemOperations.getFromId(itemId).stock) {
      cartItem.quantity++;
      cartItems[itemId].stock--;
      this.updateCart();
    }
    const condition = cartItem.quantity >= itemOperations.getFromId(itemId).stock;
    toggleButton.toggle(document.querySelector(`#itemId_${itemId} button`), condition);
  },

  // 添加商品到购物车
  addToCart(button, itemId) {
    if (!itemOperations.getFromId(itemId)) {
      return;
    }

    const item = itemOperations.getFromId(itemId);
    const cartItem = cartItems[itemId];
    if (cartItem) {
      if (cartItem.quantity < item.stock) {
        cartItem.quantity++;
        cartItem.stock--;
      }
      toggleButton.toggle(button, cartItem.quantity >= item.stock);
      this.updateCart();
      toggleButton.toggle(document.querySelector(`#cartId_${itemId} .decreaseButton`), cartItem.quantity <= 1);
      toggleButton.toggle(document.querySelector(`#cartId_${itemId} .increaseButton`), cartItem.quantity >= item.stock);
    } else {
      if (item && item.stock > 0) {
        cartItems[item.id] = {
          id: item.id,
          quantity: 1,
          stock: item.stock - 1
        };
      }
      this.updateCart();
    }
  },

  // 从购物车移除商品
  removeFromCart(itemId) {
    if (!this.has(itemId)) {
      return;
    }

    delete cartItems[itemId];
    this.updateCart();
    toggleButton.toggle(document.querySelector(`#itemId_${itemId} .buy-button`), false);
    const item = itemOperations.getFromId(itemId);
    itemOperations.setStockQuantity(itemId, item.stock);
    itemOperations.updateStockColor(item)
  },

  // 更新购物车
  updateCart() {
    cartContainer.innerHTML = `
    <div class="table-header">
      <div class="width-fixed">
        <span>名称</span>
        <span>单价</span>
        <span>数量</span>
        <span>总价</span>
      </div>
    </div>
    `;
    let total = 0;
    cartItems.forEach(cartItem => {
      let itemId = cartItem.id;
      if (itemId === 'totalPrice') {
        return;
      }

      const item = itemOperations.getFromId(itemId);
      const cartItemDiv = document.createElement('div');
      cartItemDiv.classList.add('cart-item');
      cartItemDiv.setAttribute('id', `cartId_${itemId}`);

      let price = item.normalPrice;
      if (item.discountedPrice > 0) {
        price = item.discountedPrice;
      }
      price = price.toFixed(2);
      let count = (price * cartItem.quantity).toFixed(2);

      cartItemDiv.innerHTML = `
      <div class="width-fixed">
        <span><b>${item.name}</b></span>
        <span>${price}${unit}</span>
        <span>${cartItem.quantity}x</span>
        <span>${count}${unit}</span>
      </div>
      <div class="button-area">
        <button type="button" class="decreaseButton" onclick="cartOperations.decreaseQuantity(${cartItem.id})">-</button>
        <button type="button" class="increaseButton" onclick="cartOperations.increaseQuantity(${cartItem.id})">+</button>
        <button type="button" class="delete-button" onclick="cartOperations.removeFromCart(${cartItem.id})">删除</button>
      </div>
      `;

      cartContainer.appendChild(cartItemDiv);
      total += price * cartItem.quantity;

      toggleButton.toggle(document.querySelector(`#cartId_${itemId} .decreaseButton`), cartItem.quantity <= 1);
      toggleButton.toggle(document.querySelector(`#cartId_${itemId} .increaseButton`), cartItem.quantity >= item.stock);
      itemOperations.setStockQuantity(item.id, cartItem.stock);
      itemOperations.updateStockColor(cartItem);
    });

    totalPrice = total;
    document.getElementById('totalPrice').innerHTML = `<b>价格总计</b> <span class="total-price">${total.toFixed(2)}${unit}</span>`;
    toggleButton.toggle(checkoutBtn, (Object.keys(cartItems).length === 0) || (totalPrice < 1));
  },

  // 结算事件处理
  async checkout() {
    popup.overlay().show();
    await paymentHandler.checkout(cartItems, totalPrice);
  },

  // 清空购物车
  clearCart() {
    cartItems = {};
  }
};

// 弹窗对象
const popup = {
  // 创建背景阴影图层
  overlay() {
    let popupOverlay = document.getElementById('popupOverlay');

    if (popupOverlay === null) {
      popupOverlay = document.createElement('div');
      popupOverlay.setAttribute('id', 'popupOverlay');
      popupOverlay.classList.add('popup-overlay');
      document.body.appendChild(popupOverlay);
    }

    return {
      _self_() {
        return popupOverlay;
      },
      show() {
        popupOverlay.classList.add('show');
      },
      hidden() {
        popupOverlay.classList.remove('show');
      },
      remove() {
        popupOverlay.remove();
      }
    };
  },

  // 显示弹窗提示信息
  showPopup(message, type = 'info') {

    const popup = document.createElement('div');
    popup.classList.add('popup', type);
    this.overlay()._self_().appendChild(popup);
    popup.textContent = message;

    // 触发动画效果和显示弹窗
    setTimeout(() => {
      this.overlay().show();
      popup.classList.add('show');
    }, 10);

    // 设置关闭弹窗的延迟时间（单位：毫秒）
    const closeDelay = 3000;

    // 在延迟后关闭弹窗
    setTimeout(() => {
      this.overlay().hidden();
      popup.classList.remove('show');

      // 移除弹窗元素
      setTimeout(() => {
        this.overlay().remove();
      }, closeDelay / 10);
    }, closeDelay);
  }
};

// 显示商品列表
const displayItems = {
  show() {
    itemContainer.innerHTML = '';
    itemList.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item');

      const stock = item.stock;
      itemDiv.innerHTML = `
        <img src="${item.thumbnail}" alt="${item.name}">
        <div class="item-box" id="itemId_${item.id}">
          <p class="item-name">${item.name}</p>
          <div class="price-container">N/A</div>
          <p class="stock-info">还有 <span>${stock}</span> 个库存</p>
          <button type="button" class="buy-button" onclick="cartOperations.addToCart(this, '${item.id}')">购买</button>
        </div>
      `;
      itemContainer.appendChild(itemDiv);
      itemOperations.setStockQuantity(item.id, stock);
      itemOperations.updateStockColor(item);

      const priceContainer = document.querySelector(`#itemId_${item.id} .price-container`);
      if (item.discountedPrice > 0) {
        const percentage = Math.round((item.normalPrice - item.discountedPrice) / item.normalPrice * 100);
        priceContainer.innerHTML = `
          <p class="discount-price">${item.discountedPrice.toFixed(2)}${unit}</p>
          <p class="unavailable-price">${item.normalPrice.toFixed(2)}${unit}</p>
          <p class="discount-percentage">${percentage}% OFF</p>
        `;
      } else {
        priceContainer.innerHTML = `<p class="normal-price">${item.normalPrice}${unit}</div>`;
      }
    });
  }
};

// 监听文档的点击事件
document.addEventListener('click', function(event) {
  const formDiv = document.getElementById('payment-form');
  const submitButton = document.getElementById('submit');
  const targetDiv = document.querySelector('.container');
  const isClickInside = targetDiv.contains(event.target);

  // 如果点击目标不在目标 div 内部，则关闭目标 div
  let condition = (event.target !== formDiv) && (event.target !== submitButton);
  if ((!isClickInside) && condition) {
    formDiv.classList.add('hidden');
    popup.overlay().remove();
  }
});

// 监听结算按钮点击事件
checkoutBtn.addEventListener('click', cartOperations.checkout.bind(cartOperations));

// 显示商品列表
displayItems.show();

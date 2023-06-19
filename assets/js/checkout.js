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
 * @LastEditTime : 2023-06-19 21:16:50
 * @E-Mail       : support@owoblog.com
 * @Telegram     : https://t.me/HanskiJay
 * @GitHub       : https://github.com/Tommy131
 */

const paymentHandler = {
  stripe: null,
  elements: null,

  initialize() {
    // This is your test publishable API key.
    this.stripe = Stripe(config.publicKey);
  },

  async checkout(items, totalPrice) {
    document.querySelector('#payment-form').classList.remove('hidden');

    const { clientSecret } = await fetch(config.orderCreateSite, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, totalPrice }),
    }).then((r) => r.json());

    this.elements = this.stripe.elements({ clientSecret });

    const linkAuthenticationElement = this.elements.create('linkAuthentication');
    linkAuthenticationElement.mount('#link-authentication-element');

    const paymentElementOptions = {
      layout: 'tabs',
    };

    const paymentElement = this.elements.create('payment', paymentElementOptions);
    paymentElement.mount('#payment-element');

    const result = this.checkStatus();
    document.querySelector('#payment-form').addEventListener('submit', this.handleSubmit.bind(this));
    return result;
  },

  async handleSubmit(e) {
    e.preventDefault();
    this.setLoading(true);

    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: config.returnUrl,
        receipt_email: this.emailAddress,
      }
    });

    if (error && (error.type === 'card_error' || error.type === 'validation_error')) {
      this.showMessage(error.message);
    } else {
      this.showMessage('An unexpected error occurred.');
    }

    this.setLoading(false);
  },

  async checkStatus() {
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return '与服务器通信时发生错误.';
    }

    const { paymentIntent } = await this.stripe.retrievePaymentIntent(clientSecret);

    switch (paymentIntent.status) {
      case 'succeeded':
        message = 'Payment succeeded!';
        this.showMessage(message);
        this.popupMessage(message, 'success');
        break;
      case 'processing':
        message = 'Your payment is processing.';
        this.showMessage(message);
        this.popupMessage(message);
        break;
      case 'requires_payment_method':
        message = 'Your payment was not successful, please try again.';
        this.showMessage(message);
        this.popupMessage(message, 'failure');
        break;
      default:
        message = 'Something went wrong.';
        this.showMessage(message);
        this.popupMessage(message, 'failure');
        break;
    }
  },

  showMessage(messageText) {
    const messageContainer = document.querySelector('#payment-message');

    messageContainer.classList.remove('hidden');
    messageContainer.textContent = messageText;

    setTimeout(function () {
      messageContainer.classList.add('hidden');
      messageContainer.textContent = '';
    }, 4000);
  },

  popupMessage(messageText, type) {
    if (typeof popup === 'object') {
      popup.showPopup(messageText, type);
    }
  },

  setLoading(isLoading) {
    if (isLoading) {
      document.querySelector('#submit').disabled = true;
      document.querySelector('#spinner').classList.remove('hidden');
      document.querySelector('#button-text').classList.add('hidden');
    } else {
      document.querySelector('#submit').disabled = false;
      document.querySelector('#spinner').classList.add('hidden');
      document.querySelector('#button-text').classList.remove('hidden');
    }
  },
};

paymentHandler.initialize();
window.onload = function() {
  paymentHandler.checkStatus();
};
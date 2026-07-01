'use strict';

// Checkout page: gate the Pay button behind the Terms & Conditions checkbox, then
// hand off to the server which creates the Stripe Checkout Session and returns its URL.

const agreeCheckbox = document.querySelector('#agree-terms');
const payButton = document.querySelector('#pay-button');
const payError = document.querySelector('#pay-error');

const syncPayButton = () => {
  payButton.disabled = !agreeCheckbox.checked;
};

agreeCheckbox.addEventListener('change', syncPayButton);
syncPayButton();

payButton.addEventListener('click', async () => {
  // Browser-side guard mirrors the server-side check; the server is the real gate.
  if (!agreeCheckbox.checked) return;

  payButton.disabled = true;
  payButton.textContent = 'Redirecting to secure checkout…';
  payError.textContent = '';

  try {
    const checkoutResponse = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termsAccepted: agreeCheckbox.checked }),
    });
    const checkoutPayload = await checkoutResponse.json();
    if (!checkoutResponse.ok) {
      throw new Error(checkoutPayload.error || 'Checkout could not be started.');
    }
    window.location.assign(checkoutPayload.url);
  } catch (checkoutFailure) {
    payError.textContent = checkoutFailure.message;
    payButton.disabled = false;
    payButton.textContent = 'Pay $49.00';
  }
});

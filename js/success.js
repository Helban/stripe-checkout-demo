'use strict';

// Success page: read the session id Stripe appended to the return URL and ask our
// own endpoint to confirm the payment, rather than trusting the redirect alone.

const paymentSummary = document.querySelector('#payment-summary');
const returnedSessionId = new URLSearchParams(window.location.search).get('session_id');

const showPaymentSummary = async () => {
  if (!returnedSessionId) {
    paymentSummary.textContent = 'No payment session was found in the link.';
    return;
  }

  try {
    const statusResponse = await fetch(
      `/api/session-status?session_id=${encodeURIComponent(returnedSessionId)}`
    );
    const sessionStatus = await statusResponse.json();
    if (!statusResponse.ok) {
      throw new Error(sessionStatus.error || 'Could not verify the payment.');
    }
    const paidAmount = (sessionStatus.amountTotal / 100).toFixed(2);
    const paidCurrency = sessionStatus.currency.toUpperCase();
    paymentSummary.textContent =
      `Payment ${sessionStatus.paymentStatus}: ${paidAmount} ${paidCurrency}`;
  } catch (verifyFailure) {
    paymentSummary.textContent = verifyFailure.message;
  }
};

showPaymentSummary();

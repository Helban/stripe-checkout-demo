// Cloudflare Pages Function: GET /api/session-status?session_id=cs_test_...
// Retrieves a completed Checkout Session so the success page can confirm the
// payment server-side instead of trusting the redirect URL.

const STRIPE_CHECKOUT_ENDPOINT = 'https://api.stripe.com/v1/checkout/sessions';

export async function onRequestGet(context) {
  const { request, env } = context;

  const returnedSessionId = new URL(request.url).searchParams.get('session_id');
  if (!returnedSessionId) {
    return jsonError('Missing session_id.', 400);
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return jsonError('Payment backend is not configured.', 500);
  }

  const stripeResponse = await fetch(
    `${STRIPE_CHECKOUT_ENDPOINT}/${encodeURIComponent(returnedSessionId)}`,
    { headers: { Authorization: `Bearer ${stripeSecretKey}` } }
  );
  if (!stripeResponse.ok) {
    return jsonError('Could not retrieve the payment session.', 502);
  }

  const checkoutSession = await stripeResponse.json();
  return new Response(
    JSON.stringify({
      paymentStatus: checkoutSession.payment_status,
      amountTotal: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      customerEmail: checkoutSession.customer_details?.email ?? null,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

const jsonError = (message, status) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

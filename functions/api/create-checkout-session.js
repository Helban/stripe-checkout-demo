// Cloudflare Pages Function: POST /api/create-checkout-session
// Creates a Stripe Checkout Session for one-time course access.
//
// The Terms & Conditions consent is enforced HERE, server-side, not only by the
// disabled button in the browser. A visitor who re-enables the button in devtools
// still cannot start a payment without an explicit consent flag in the request.
//
// Called directly against Stripe's REST API with fetch, so there is no npm
// dependency and no build step. The whole project deploys as static files plus
// this function.

const STRIPE_CHECKOUT_ENDPOINT = 'https://api.stripe.com/v1/checkout/sessions';
const COURSE_PRICE_MINOR_UNITS = 4900; // $49.00, Stripe expects the amount in cents
const COURSE_CURRENCY = 'usd';
const COURSE_NAME = 'Pro Course: Lifetime Access';

export async function onRequestPost(context) {
  const { request, env } = context;

  let checkoutRequest;
  try {
    checkoutRequest = await request.json();
  } catch (parseFailure) {
    return jsonError('Malformed request body.', 400);
  }

  if (checkoutRequest?.termsAccepted !== true) {
    return jsonError('You must accept the Terms & Conditions before paying.', 422);
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return jsonError('Payment backend is not configured.', 500);
  }

  const siteOrigin = new URL(request.url).origin;
  const sessionParams = new URLSearchParams({
    mode: 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': COURSE_CURRENCY,
    'line_items[0][price_data][unit_amount]': String(COURSE_PRICE_MINOR_UNITS),
    'line_items[0][price_data][product_data][name]': COURSE_NAME,
    // Record the consent on the payment itself so there is an audit trail.
    'metadata[terms_accepted]': 'true',
    'metadata[terms_accepted_at]': new Date().toISOString(),
    success_url: `${siteOrigin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteOrigin}/cancel.html`,
  });

  const stripeResponse = await fetch(STRIPE_CHECKOUT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: sessionParams,
  });

  if (!stripeResponse.ok) {
    const stripeErrorBody = await stripeResponse.text();
    return jsonError(`Stripe rejected the session: ${stripeErrorBody}`, 502);
  }

  const checkoutSession = await stripeResponse.json();
  return jsonResponse({ url: checkoutSession.url }, 200);
}

const jsonResponse = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const jsonError = (message, status) => jsonResponse({ error: message }, status);

# Stripe Checkout demo: mandatory consent gate

A small, dependency-free checkout page that starts a real [Stripe Checkout](https://stripe.com/docs/payments/checkout) session for a one-time purchase. The point of the demo is the consent step: a checkout cannot begin until the buyer agrees to the Terms & Conditions, and that agreement is enforced on the server, not just by a disabled button.

Live demo: https://pay.helban.dev

Runs in Stripe **test mode**. Pay with card `4242 4242 4242 4242`, any future expiry, any CVC, any postal code. No real money moves.

## What it shows

- One-time payment via a server-created Checkout Session (`mode: payment`).
- A hard Terms & Conditions gate: the Pay button is disabled until the box is ticked, and the `create-checkout-session` endpoint rejects any request without an explicit `termsAccepted: true`. Re-enabling the button in devtools does not get past it.
- The consent (and a timestamp) is written to the payment's Stripe metadata for an audit trail.
- The success page verifies the payment by reading the session back from Stripe, instead of trusting the redirect URL.

## How it is built

No framework, no build step. Static HTML/CSS/JS plus two [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) that call the Stripe REST API directly with `fetch`.

```
index.html            checkout page (product + consent gate)
terms.html            terms & disclaimers
success.html          post-payment confirmation
cancel.html           cancelled checkout
css/style.css
js/checkout.js        consent gating + start checkout
js/success.js         server-side payment verification
functions/api/
  create-checkout-session.js   POST — creates the Checkout Session (enforces consent)
  session-status.js            GET  — retrieves a session for the success page
```

The Stripe secret key lives only in the `STRIPE_SECRET_KEY` environment variable. It is never in the source.

## Run locally

Local dev uses [Wrangler](https://developers.cloudflare.com/workers/wrangler/). Put your Stripe test secret key in a git-ignored `.dev.vars` file:

```
STRIPE_SECRET_KEY=sk_test_...
```

Then:

```
npx wrangler pages dev .
```

Open the printed URL and pay with the test card above.

## Deploy (Cloudflare Pages)

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
3. Build command: none. Build output directory: `/`.
4. Settings → Environment variables → add `STRIPE_SECRET_KEY` (your `sk_test_...`) for Production and Preview.
5. Add the custom domain `pay.helban.dev`.

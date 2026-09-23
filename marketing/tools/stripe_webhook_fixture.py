#!/usr/bin/env python3
"""stripe_webhook_fixture.py — signed test payload for the crediting path.

INFRASTRUCTURE.md §5 step 6 requires the game backend to credit accounts on
`checkout.session.completed` with verified `Stripe-Signature`. This emits a
fixture the game-side consumer can be rehearsed against LOCALLY — no Stripe
account, no network, no real keys.

Outputs (to --out, default stdout):
  {
    "headers": { "Stripe-Signature": "t=...,v1=..." },
    "body":    { ...event json... }
  }

The consumer verifies: v1 = HMAC-SHA256(secret, "<t>.<raw-body>").

Usage:
  ./tools/stripe_webhook_fixture.py                       # defaults
  ./tools/stripe_webhook_fixture.py --price price_pack500 \\
      --account acct_demo --secret whsec_test_local \\
      --out deploy/stripe-webhook-fixture.json

Then rehearse the consumer with e.g.:
  curl -X POST http://localhost:PORT/webhooks/stripe \\
    -H "Stripe-Signature: <header>" -H 'Content-Type: application/json' \\
    --data-binary '<raw body string>'

IMPORTANT: the fixture body must be POSTed byte-for-byte (signature covers
the raw payload). Use --out and read body_raw when curl-ing.
"""
import argparse, hashlib, hmac, json, sys, time


def build(secret: str, price: str, account: str) -> dict:
    ts = int(time.time())
    event = {
        "id": "evt_fixture_local",
        "object": "event",
        "api_version": "2026-08-01",
        "type": "checkout.session.completed",
        "livemode": False,
        "data": {
            "object": {
                "id": "cs_test_fixture_local",
                "object": "checkout.session",
                "mode": "payment",
                "payment_status": "paid",
                "amount_total": 999,
                "currency": "usd",
                "client_reference_id": account,
                "metadata": {
                    # contract from deploy/stripe-products.json +
                    # INFRASTRUCTURE.md §3.4 — game reads these to credit.
                    "account_id": account,
                    "price_id": price,
                },
            }
        },
    }
    body = json.dumps(event, separators=(",", ":"), sort_keys=True)
    sig = hmac.new(secret.encode(), f"{ts}.{body}".encode(),
                   hashlib.sha256).hexdigest()
    return {
        "headers": {"Stripe-Signature": f"t={ts},v1={sig}"},
        "body_raw": body,
        "body": event,
        "notes": "POST body_raw verbatim; v1=HMAC_SHA256(secret,'<t>.<body_raw>')",
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--secret", default="whsec_test_local_fixture")
    ap.add_argument("--price", default="price_pack500",
                    help="price id from deploy/stripe-products.json")
    ap.add_argument("--account", default="acct_fixture_player")
    ap.add_argument("--out", help="write fixture JSON here instead of stdout")
    a = ap.parse_args()
    fixture = json.dumps(build(a.secret, a.price, a.account), indent=2)
    if a.out:
        with open(a.out, "w") as f:
            f.write(fixture + "\n")
        print(f"wrote {a.out}")
    else:
        print(fixture)
    return 0


if __name__ == "__main__":
    sys.exit(main())

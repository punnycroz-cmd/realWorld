# The Book — scheduled exclusives (world v74)

The booking layer: an exclusive request can name **when** it runs, not just
**what** it does. Plan §2.3 already says event triggers are "scheduled into
world calendar" — the Book is that calendar, public and legible, the same way
the resource board made FCFS legible in v18.

Companion artifacts:

- `world/book.html` — working demo (file://-safe). A 24 h strip per bookable
  claim: free / locked / cooldown / booked, with the holder's handle on every
  taken span.
- `world/bookings.json` — machine-readable mirror (rules, claims, seeded
  windows, feed shapes).
- `world/request.html` — the form grows a **When** picker for exclusive
  actions ("soonest free window" or a named half-hour slot).

## 1. What a booking is

A booking is an **exclusive request with a declared start window**. It files,
screens, and goes to human review exactly like any exclusive — the difference
is that approval lands on the calendar instead of firing as soon as the
resource frees. When the window arrives, the event fires on the feed with the
filer's handle, same attribution as today.

- **Bookable actions:** `weather`, `event` — the flat-rate exclusives.
  Sessions (`possess`, `camera`) are per-minute and stay now-or-queued;
  `nudge` is a one-shot. Hire routes to The Registry as always.
- **Window:** `event` books a fixed 60-min window; `weather` books the block
  it bought (1/2/4 h). Slots align to the half hour.
- **Horizon:** the next 24 h. Farther out is a queue's job.

## 2. Honesty rules (all locked-shaped)

- **A time slot is not an upgrade.** Same flat block price; picking a time
  never costs extra and never discounts.
- **Surge keys off the window's local hour** (18:00–23:00 is primetime), shown
  in the quote before payment — never after.
- **Cancel until the window starts = full refund.** After the start it's a
  live exclusive; the claim is locked and the window is spent.
- **Bookings never skip cooldowns.** The picker never offers a slot that opens
  inside a cooldown tail — a slot that can't legally fire doesn't exist.
- **FCFS, never auctioned.** A booked span claims the resource; an overlapping
  ask queues for the next free window. There is no bidding for better slots
  and no "priority" slot tier.
- **The book is public.** Every viewer sees every claimed window with the
  holder's handle — attribution is the payoff and the anti-grief surface.

## 3. Classification interaction

A booking is still `exclusive` class: it locks a shared resource *for that
span*. The claims matrix treats the window as a scheduled claim on
`sky` / `venue:*` / `openair`. Two non-overlapping windows on the same claim
coexist fine; overlapping asks queue. The running lock always wins — you
cannot book over somebody's live exclusive, and the picker doesn't offer
slots that would try.

## 4. Copy deck

| Moment | Copy |
|---|---|
| When label | "When — the book is public: pick a window or take the soonest" |
| Soonest option | "soonest free window (queue if busy)" |
| Slot option | "book 21:30 → 22:30 (tonight)" / "(tomorrow)" |
| Quote line | "Window — booked for 21:30 · cancel free until it starts" |
| Submit | "Book it — 21:30" |
| Booked stage | "Booked for 21:30 — already approved; fires when the window arrives" |
| Booked card | "starts 21:30 · in ~4 h · cancel free until it starts" |
| Feed: booked | "&lt;action&gt; approved · booked for 21:30" |
| Feed: fires | "booked window arrived — &lt;action&gt; fired" (running) |
| Feed: ends | "&lt;action&gt; ended" (resolved) |
| Cancel | "cancelled before the window — refunded" |
| Book page honesty | "a time slot is not an upgrade — same flat price" · "the book is public — everyone can see what's claimed before they spend" |

## 5. Live seam

`bookings.json.live_seam`: `gsViewerState().calendar` (optional) supplies live
booked windows; `gsRequestSubmit` gains `start_slot` (minutes-from-now) when a
window was picked. Off the bus, seeded windows and the local pipeline stay the
contract reference — same fallback rule as the rest of request.html.

## 6. What's deliberately absent

No prices on the strip. No queue positions. No "premium slots." No countdown
pressure copy ("only 2 slots left" is dark-pattern vocabulary the audit gate
sweeps for). The Book exists so a player can answer *when can I have the
park* without spending a credit to find out.

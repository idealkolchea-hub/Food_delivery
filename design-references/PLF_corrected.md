---

## Product Language Firewall

> The backend does the work. The product takes the credit.
> These are the rules that separate internal logic from public trust.

> **This file is the authoritative source for all copy rules.**
> Where any conflict exists between this file and DESIGN.md §16,
> this file wins. DESIGN.md §16 is a summary only.

---

### 1. Forbidden Public UI Terms

The following terms must never appear in any customer-facing, restaurant-facing, or delivery-partner-facing UI surface. This includes hero copy, card text, chips, tooltips, loading states, error messages, and success messages.

| Forbidden Term                   | Reason                                              |
|----------------------------------|-----------------------------------------------------|
| `Event Ledger`                   | Internal system concept, not a user feature         |
| `Transition Authority`           | Backend validation term, meaningless to users       |
| `Handoff Token`                  | Engineering name for the delivery code              |
| `delivery.token_verified`        | Raw RPC / event name                                |
| `order.placed`                   | Internal event identifier                           |
| `restaurant.accepted`            | Internal event identifier                           |
| `delivery.picked_up`             | Internal event identifier                           |
| `controlled delivery states`     | Architecture description, not a user benefit        |
| `trust model`                    | Meta-product language, not user copy                |
| `full event ledger`              | Backend audit concept                               |
| `role authority`                 | Internal permission model                           |
| `guest path` / `verified path`   | Auth flow implementation terminology                |
| `backend proof chain`            | Engineering framing                                 |
| `state machine`                  | Software architecture concept                       |
| `RPC`                            | Never shown in any UI                               |
| `Supabase`                       | Vendor name, never shown in any UI                  |
| `database`                       | Infrastructure term, never in public copy           |
| `every transition is timestamped`| Sounds like an audit system, not a product benefit  |
| `controlled states`              | Engineering language                                |
| `browse the real product, not a design mockup` | Meta-process copy, never in the product |
| `proof-backed delivery`          | Jargon — translate to plain experience language     |

---

### 2. Allowed User-Facing Replacements

Use these in all public UI, marketing copy, and product surfaces.

| Instead of…                    | Use…                                              |
|--------------------------------|---------------------------------------------------|
| Event Ledger                   | Order history                                     |
| Transition Authority           | No skipped steps                                  |
| Handoff Token                  | Delivery code                                     |
| `delivery.token_verified`      | Code verified                                     |
| `order.placed`                 | Order placed                                      |
| `restaurant.accepted`          | Restaurant accepted                               |
| `delivery.picked_up`           | Rider picked up                                   |
| Controlled delivery states     | Every step tracked                                |
| Trust model                    | You always know where your order is               |
| Full event ledger              | Complete order history                            |
| Role authority                 | How your order moved                              |
| Guest path / verified path     | Continue as guest / Sign in                       |
| Backend proof chain            | Delivered — with proof                            |
| Proof-backed delivery          | Verified delivery                                 |
| Every transition is timestamped| Order placed → Restaurant accepted → Delivered    |

---

### 3. Homepage Copy Rules

**There are two homepage modes. These copy rules apply to each differently.**

#### Mode A: Unauthenticated landing page

This is the public marketing surface. The trust headline belongs here.

**Hero headline (use exactly):**
```
Food delivery with proof built in.
```

**Hero sub-copy (use exactly):**
```
Track every step, share a delivery code at handoff,
and know exactly how your order reached you.
```

Primary CTA: **Browse kitchens**
Secondary CTA: **Track an order**

**Progress labels (use in order):**
1. Order placed
2. Restaurant accepted
3. Preparing
4. Ready
5. Rider picked up
6. Delivery code shared
7. Code verified
8. Delivered

**Acceptable metrics:**
- Active orders
- Median delivery time
- Verified deliveries

**Rules:**
- Never use backend event names as hero copy.
- Never describe the proof system as architecture. Let users experience it, not read about it.
- Product preview in the hero should show an order card, a delivery code card, or a delivered state — not a ledger diagram.
- Tone: plain, confident, product-specific. Not hype. Not generic SaaS.

**Forbidden landing page copy patterns:**
- "Seamless experience" → cut
- "Next-gen delivery" → cut
- "Revolutionary" → cut
- "AI-powered" → cut
- "Game changer" → cut
- "Frictionless ecosystem" → cut
- "Designed for modern users" → cut

#### Mode B: Authenticated customer browse home

This is the food discovery surface. No hero headline about proof or trust.

Copy that belongs here:
- "Deliver to [address]"
- "Search for dishes or restaurants..."
- "Near you"
- "Order again"
- "Reorder"
- Category names (Biryani · Pizza · Burgers etc.)
- "[X]–[Y] min" delivery estimates
- "[X.X] · [N]+" ratings

Copy that does NOT belong here (Mode B):
- "Food delivery with proof built in."
- Any trust headline
- Role card copy
- Proof chain labels
- Metrics

---

### 4. Role Card Copy Rules

Role cards appear on the **unauthenticated landing page only**.
They do not appear on the authenticated food discovery home.

They speak to each actor's experience, not their role in the state machine.

#### Customer
- **Title:** Order with proof.
- **Body:** Track your food, generate a delivery code, and complete handoff only when it reaches you.
- **Chips:** Live tracking · Delivery code · Verified delivery
- **Accent:** Amber / orange

#### Restaurant Partner
- **Title:** Keep orders moving.
- **Body:** Accept, prepare, and mark orders ready — no steps skipped, no ambiguity.
- **Chips:** Order queue · State control · Order history
- **Accent:** Blue
- **Avoid:** "Evidence trail" · "Every transition is timestamped" · backend process language

#### Delivery Partner
- **Title:** Finish with the customer's code.
- **Body:** Pick up assigned orders and complete delivery only after code verification.
- **Chips:** Assigned orders · Code check · Delivery proof
- **Accent:** Green
- **Avoid:** "Handoff proof" as a chip label — use "Delivery proof"

#### Admin
- **Title:** See the full order story.
- **Body:** Review every movement from checkout to delivery.
- **Chips:** Order history · Role control · Verified handoff
- **Accent:** Violet
- **Avoid:** "Event ledger" as a chip · "Role authority" as copy · any raw event names

---

### 5. Admin UI Copy Rules

Admin surfaces may be denser and more structured than customer-facing UI.
Admin users are internal operators — they understand the product domain.
They do not need to see raw infrastructure terminology.

**Allowed in admin:**
- Order history
- Actor (Customer / Restaurant / Delivery Partner)
- Timestamp
- Status change
- Handoff verified
- Delivery completed
- Delivery code entered

**Allowed only in developer/debug views (not in main admin UI):**
- Raw event types
- RPC names
- Internal identifiers

**Status display labels for admin:**

| Status key        | Display label              |
|-------------------|----------------------------|
| `placed`          | Order placed               |
| `accepted`        | Restaurant accepted        |
| `preparing`       | Preparing                  |
| `ready`           | Ready for pickup           |
| `picked_up`       | Rider picked up            |
| `token_verified`  | Code verified              |
| `delivered`       | Delivered                  |

---

### 6. Delivery Code UI Copy Rules

The delivery code screen is the most trust-critical surface in the product. Every word matters.

**Card title:**
```
Delivery code
```
Not: "Handoff token" · "Delivery token" · "Verification code"

**Instruction text:**
```
Share this only when your order reaches you.
```

**Code display:**
- Large, spaced 6-digit code
- Monospace / tabular style
- Amber accent
- No label other than "Delivery code"

**Generate button:**
```
Generate new code
```

**Note below button:**
```
New code replaces the old one.
```

**Wrong code error (shown to delivery partner):**
```
That delivery code is incorrect.
```
Not: "Token mismatch" · "Verification failed" · "Invalid token"

**Success state (delivery partner, after correct code):**
```
Code verified. Delivery completed.
```
Not: "Delivery verified." — this string is incorrect and must not be used.

**Visibility rules (enforce in code, confirm in copy):**
- Code card shows only when order status is `picked_up`
- Code card hides once status is `delivered`
- No localStorage · No sessionStorage · No URL params
- Page reload requires fresh code generation

---

### 7. Bad Copy Examples → Corrected Copy

#### Example 1 — Hero copy

> ❌ **Bad:** "Proof-backed delivery with controlled state movement and full event ledger visibility."

> ✅ **Good:** "Track every step, share a delivery code at handoff, and know exactly how your order reached you."

---

#### Example 2 — Customer role card

> ❌ **Bad:** "Track every state and generate a handoff code when the order reaches you. No more uncertainty at the door."

> ✅ **Good:** "Track your food, generate a delivery code, and complete handoff only when it reaches you."

---

#### Example 3 — Admin chip

> ❌ **Bad chip:** `Event ledger`

> ✅ **Good chip:** `Order history`

---

#### Example 4 — Delivery partner card

> ❌ **Bad:** "Complete only with the customer's handoff code. Every delivery closes with proof."

> ✅ **Good:** "Pick up assigned orders and complete delivery only after code verification."

---

#### Example 5 — Restaurant card

> ❌ **Bad:** "Move orders through controlled states and keep fulfillment accountable. Every transition is timestamped."

> ✅ **Good:** "Accept, prepare, and mark orders ready — no steps skipped, no ambiguity."

---

#### Example 6 — Admin card

> ❌ **Bad:** "See who changed what, when it happened, and how the order reached delivery. Full event ledger."

> ✅ **Good:** "Review every movement from checkout to delivery."

---

#### Example 7 — Delivery code error

> ❌ **Bad:** "Token mismatch. Verification failed."

> ✅ **Good:** "That delivery code is incorrect."

---

#### Example 8 — Delivery code success

> ❌ **Bad:** "Delivery verified."

> ✅ **Good:** "Code verified. Delivery completed."

---

#### Example 9 — Authenticated home hero

> ❌ **Bad:** "Food delivery with proof built in." (hero headline on the food browse/discovery home)

> ✅ **Good:** No hero headline on browse home. Lead with location bar, search, and restaurant cards.

---

### 8. Codex Implementation Instructions

**Before writing any UI string:**
1. Check it against the Forbidden Terms table in Section 1.
2. If any forbidden term appears, replace it using Section 2.
3. Confirm the copy matches the role-specific rules in Sections 3–6.

**Implementation checklist:**
- [ ] Grep the rendered output for every forbidden term before committing.
- [ ] All `<p>`, `<span>`, `<h*>`, `<button>`, toast, and badge copy must pass the firewall.
- [ ] Status labels in the UI must use the display label column from Section 5, not the raw status key.
- [ ] Delivery code card must use the exact copy from Section 6.
- [ ] Role cards must use the exact titles from Section 4.
- [ ] Landing page hero must use the exact headline and sub-copy from Section 3, Mode A.
- [ ] Browse home (Mode B) must NOT use the trust headline.
- [ ] Success string after correct delivery code must be "Code verified. Delivery completed." — not "Delivery verified."

**Scope of changes:**
- Frontend strings and layout only.
- No backend changes.
- No Supabase SQL, RPC, or auth changes.
- No route changes.
- No new backend features.
- Safe frontend-only additions using existing data are permitted:
  - Veg/Non-Veg client-side toggle
  - Order Again section (from existing order history)
  - Sticky cart bar (CSS + cart state)
  - Delivery time estimate (from existing data field)
  - Occasion-aware microcopy (time-based JS only)
  - Empty state illustrations (inline SVG)
  - Rating prompt after delivered
  - Search result copy improvements
- Preserve all 11 existing tests.
- Run `build` and `test` after every change.

**Tone test (apply to every string before shipping):**
> Would a first-time customer ordering lunch understand this?
> If not — rewrite it.

---

# BiteBlast Frontend Design Direction

## 1. Design Thesis

BiteBlast should feel like a premium food delivery app with delivery trust built into the experience.

The UI must look like a real polished product at first glance: dark, food-rich, glassmorphic, warm, smooth, and app-like. It should not look like a backend dashboard, a generic SaaS landing page, a bright lime food template, or an AI-generated concept board.

The product promise should be simple:

> Order food. Track every step. Finish delivery with a customer code.

Trust should be felt through the interface, not explained as architecture.

---

## 2. Reference Hierarchy

The reference screenshots are not equal. Codex must follow this hierarchy.

### Primary visual reference

Use the **dark mobile food UI with rich food imagery, glass panels, warm orange CTA, and premium phone-app atmosphere** as the main direction.

This defines:
- dark food-first mood
- rich appetizing imagery
- rounded glass overlays
- warm orange action accents
- premium mobile-app composition
- strong food hero cards
- smooth, tactile, realistic surfaces

### Secondary references

Use the **dark editorial role-card screenshot** for:
- role accent structure
- dark glass cards
- section typography
- controlled spacing
- premium role surfaces

Use the **dark Crunch-style mobile UI** for:
- warm dark auth/product screens
- editorial food presentation
- premium restaurant-app atmosphere
- soft brown/amber lighting

Use the **dark sushi/glass UI** for:
- immersive food image treatment
- glass input fields
- dark overlays
- rounded card depth

Use the **light pastel mobile UI** only for:
- spacing softness
- rounded card comfort
- clean input hierarchy
- breathing room

### Negative reference

The bright blue/lime food delivery landing page is a negative reference.

Do not use:
- lime green blobs
- generic restaurant grid layout
- playful blue/green palette
- stock landing-page composition
- testimonial/footer template feel
- old food-delivery-template structure

---

## 3. Visual Identity

BiteBlast should look like a premium dark food app, not a backend product.

Design keywords:
- dark
- premium
- glassmorphic
- food-rich
- warm
- minimal
- tactile
- rounded
- atmospheric
- app-like
- trusted
- polished

Avoid:
- developer-facing dashboards
- backend diagrams
- generic SaaS gradients
- raw system labels
- childish food colors
- neon glow
- over-explained feature blocks
- mockup language
- filler marketing copy

The interface should combine:
1. **rich food imagery** for appetite and realism
2. **dark glass UI** for premium depth
3. **warm orange actions** for food and movement
4. **role accents** for multi-flow clarity
5. **clean product copy** for trust without technical exposure

---

## 4. Color System

Use one global color logic across the app.

### Base colors

```css
--bb-bg: #07080D;
--bb-bg-soft: #0B0D14;
--bb-bg-elevated: #10131B;
--bb-bg-panel: #141821;
--bb-bg-warm: #1A120D;
```

Use these for:
- app background
- dashboard backgrounds
- auth screens
- page shells
- card nesting

Never use pure black as the entire UI. Use layered near-black values.

### Glass surfaces

```css
--bb-glass: rgba(255, 255, 255, 0.055);
--bb-glass-strong: rgba(255, 255, 255, 0.085);
--bb-glass-inner: rgba(255, 255, 255, 0.045);
--bb-glass-warm: rgba(255, 122, 24, 0.08);
--bb-border: rgba(255, 255, 255, 0.14);
--bb-border-soft: rgba(255, 255, 255, 0.08);
--bb-highlight: rgba(255, 255, 255, 0.18);
```

### Main action accent

```css
--bb-primary: #F97316;
--bb-primary-soft: rgba(249, 115, 22, 0.16);
--bb-primary-border: rgba(249, 115, 22, 0.38);
--bb-primary-glow: rgba(249, 115, 22, 0.22);
```

Use orange for:
- primary buttons
- order actions
- cart actions
- delivery code emphasis
- active states in customer flow
- food-related highlights

Do not use green as the global primary.

### Role accents

```css
--bb-customer: #F59E0B;
--bb-restaurant: #3B82F6;
--bb-delivery: #22C55E;
--bb-admin: #8B5CF6;
```

Use role colors only for:
- badges
- subtle borders
- icons
- chips
- status dots
- small section labels

Do not flood cards with role colors.

### Status colors

```css
--bb-success: #22C55E;
--bb-warning: #F59E0B;
--bb-danger: #EF4444;
--bb-info: #38BDF8;
```

### Text colors

```css
--bb-text: #F8FAFC;
--bb-text-soft: #CBD5E1;
--bb-text-muted: #94A3B8;
--bb-text-faint: #64748B;
```

Use:
- `--bb-text` for titles
- `--bb-text-soft` for body
- `--bb-text-muted` for labels
- `--bb-text-faint` for timestamps and metadata

### Color ratio

Follow this ratio:

- 70% dark base
- 20% glass surfaces
- 10% accent color

If a screen feels colorful, it is wrong.

---

## 5. Typography System

The typography should feel premium and modern, not default.

### Display headings

Use a bold geometric or editorial sans style.

Recommended font direction:
- Plus Jakarta Sans
- Manrope
- Bricolage Grotesque
- Outfit Bold

> **Do not use Space Grotesk.** It is overused in AI-generated interfaces and produces generic output.
> Do not use Inter, Roboto, or system-ui for display headings.

Use for:
- hero headlines
- page titles
- section headlines
- large role-card titles

Rules:
- heavy weight, 700 to 800
- tight letter spacing
- large but never cropped
- strong line-height control
- no overflowing hero text

### Body and UI

Use a clean readable sans.

Use for:
- body copy
- nav
- card descriptions
- buttons
- form labels

Rules:
- medium line-height
- no tiny low-contrast text
- body text should be readable on glass

### Monospace

Use monospace only for:
- delivery codes
- timestamps
- order IDs
- compact status rows
- admin timeline data

Do not use monospace for public marketing copy.

---

## 6. Background System

The background should feel like a dark physical food-app space, not a full-page gradient.

Use:
- near-black base
- subtle warm light pool behind food/action areas
- faint blue/violet/green role-light pools only when relevant
- soft grain
- subtle dot texture
- gentle radial depth
- no loud color blobs

Avoid:
- lime green blobs
- flat blue food-template background
- basic diagonal gradient
- noisy particle effects
- heavy animation

Background should support glass cards and food imagery.

---

## 7. Surface and Card System

Cards must feel like premium glass slabs.

### Standard card

Use:
- translucent dark fill
- backdrop blur
- 1px low-opacity border
- large radius, 20 to 32px
- soft inner highlight
- deep layered shadow
- subtle hover lift

### Food card

Food cards should feel richer than normal UI cards.

Use:
- food image as top or background layer
- dark gradient overlay for text readability
- rounded image mask
- glass metadata pills
- warm CTA
- strong but clean shadow

### Dashboard card

Use:
- darker glass
- more compact layout
- role accent border
- clear status chip
- lower visual noise

### Token/code card

Use:
- glass panel
- warm customer accent
- large monospace 6-digit code
- strong separation between code and note
- clear button
- no technical explanation

### Admin panel

Use:
- darker, denser glass
- violet accent only in small details
- table/timeline clarity
- fewer decorative food visuals

---

## 8. Shadow and Border Rules

Use realistic soft depth.

Recommended shadow style:
- broad soft shadow for elevation
- small inner highlight for glass
- warm/role glow only at very low opacity

Avoid:
- neon outlines
- bright glow around every card
- flat cards with only border
- harsh black shadows

Borders:
- default: low-opacity white
- role cards: subtle accent border
- active elements: stronger accent border
- danger states: muted red, not loud

---

## 9. Layout and Spacing Rules

### Desktop layout

Use:
- max-width around 1180 to 1280px
- page padding 24 to 40px
- section gap 72 to 120px
- card gap 16 to 28px
- aligned grid rhythm

### Mobile layout

Use:
- single-column flow
- large touch targets
- card radius preserved
- sticky critical actions where useful
- avoid dense desktop panels squeezed into mobile

### Hero (landing page only)

Hero must be balanced.

Do:
- show one strong headline
- show one strong visual
- avoid massive cropped text
- keep CTAs visible
- keep first viewport readable

Do not:
- crop the heading
- overlap navbar
- turn hero into architecture diagram
- use oversized decorative text that hides content

---

## 10. Component Rules

### Buttons

Primary:
- warm orange
- rounded pill or soft rectangle
- strong contrast
- no neon

Secondary:
- glass background
- thin border
- muted text
- hover brightens border/fill

Danger:
- muted red
- clear but restrained

### Inputs

Use:
- dark glass field
- rounded corners
- clear focus ring
- readable placeholder
- no default browser look

Token inputs:
- large 6-digit format
- monospace
- clear spacing
- error text below field

### Chips

Use:
- small rounded pill
- translucent background
- subtle border
- role accent text
- compact uppercase only where appropriate

### Metric cards

Use:
- glass card
- large tabular number
- short human label
- small supporting text
- no fake hype

Recommended metrics:
- Active orders
- Median delivery time
- Verified deliveries

### Role cards

Use:
- role accent
- large title
- short body
- 2 to 3 chips
- no backend terminology

### Order cards

Use:
- restaurant/food image if available
- clear status
- price/time if available
- next action button
- warm CTA for customer
- role accent for staff flows

### Timeline rows

Public timeline:
- human labels
- normal language
- time
- no raw event names

Admin timeline:
- can be denser
- can show structured details
- still prefer display labels first
- raw event names only if existing admin detail requires it

### Sticky cart bar

Appears when cart has 1 or more items on a restaurant/menu page.

Use:
- fixed bottom
- orange background or dark glass with orange accent
- shows: item count · subtotal · "View cart →"
- full width
- large touch target

Never show on empty cart. Never show on non-restaurant pages.

---

## 11. Homepage — Two Modes

**The `/` route serves two audiences. The layout must reflect this.**

---

### Mode A: Unauthenticated / Landing

Shown to users who are not logged in or have not yet browsed.

This is the marketing surface. Structure:

1. Premium navbar
2. Hero with food/product visual
3. Proof chain (order progress labels)
4. Metrics cards
5. Role cards (Customer · Restaurant · Delivery · Admin)
6. Browse/restaurants preview
7. Footer

**Hero copy (use exactly):**

Headline:
> Food delivery with proof built in.

Subcopy:
> Track every step, share a delivery code at handoff, and know exactly how your order reached you.

Primary CTA: **Browse kitchens**
Secondary CTA: **Track an order**

**Hero visual:**
Use a dark glass food-app preview showing order progress, delivery code card, or delivered state.
Do not show raw event names or backend labels.

**Proof chain labels (use in order):**
1. Order placed
2. Restaurant accepted
3. Preparing
4. Ready for pickup
5. Rider picked up
6. Delivery code shared
7. Code verified
8. Delivered

**Metrics:**
- Active orders
- Median delivery time
- Verified deliveries

**Role cards (exact copy):**

Customer:
- Title: Order with proof.
- Text: Track your food, share a delivery code, and complete handoff only when it reaches you.
- Chips: Live tracking · Delivery code · Verified delivery

Restaurant:
- Title: Keep orders moving.
- Text: Accept, prepare, and mark orders ready — no steps skipped, no ambiguity.
- Chips: Order queue · State control · Order history

Delivery:
- Title: Finish with the customer's code.
- Text: Pick up assigned orders and complete delivery only after code verification.
- Chips: Assigned orders · Code check · Delivery proof

Admin:
- Title: See the full order story.
- Text: Review every movement from checkout to delivery.
- Chips: Order history · Role control · Verified handoff

---

### Mode B: Authenticated Customer — Food Discovery Home

Shown to logged-in customers. This is the food browsing surface.
**Role cards do not appear here. The proof chain does not appear here.**
Trust features appear later in the flow — during tracking, at pickup.

Structure (top to bottom):

1. **Location bar** — "Deliver to [address]" · tap to change
2. **Search bar** — "Search for dishes or restaurants..."
3. **Cuisine category chips** — horizontal scroll
   - Biryani · Pizza · Burgers · Chinese · Rolls · South Indian · Desserts · Healthy
   - These are filter chips using existing category data
   - Active chip = amber fill or underline
4. **Veg / Non-Veg toggle** — client-side filter only, reads `is_veg` from existing data
5. **Order Again section** (logged-in users with history only)
   - Title: "Order again"
   - Horizontal scroll of past orders: dish image · name · restaurant · "Reorder" button
   - Skip entirely if no history exists — do not show empty state
6. **Featured restaurants** — "Near you"
   - Restaurant cards (existing data from useRestaurants)
   - Each card shows: image · name · cuisine · rating · delivery time estimate
7. **Sort bar** — Relevance · Rating · Delivery time · Price
8. **Full restaurant list** — scrollable

**Restaurant card must show:**
- Cover image (16:9 or 3:2)
- Name (bold)
- Cuisine (2 tags max)
- Rating (e.g. "4.2 · 340+")
- Delivery time (e.g. "25–35 min") — only if data exists, never fake it
- Pure Veg badge if `is_veg` = true

**Data sources:**
- `useRestaurants` — restaurant list, cuisines, ratings
- Customer session — address, login state
- `useOrderFlow` — order history for Order Again

**What Mode B must NOT contain:**
- Role cards
- Hero headline about proof or trust
- Proof chain
- Admin/metrics section
- Delivery code card
- Backend terms in any form

---

## 12. Customer Flow Direction

The customer side should feel warm, food-rich, and clear.

### Home (Mode B)

See Section 11 Mode B for full structural specification.

Visual direction:
- rich food cards
- rounded dark glass surfaces
- warm orange actions
- clear category chips
- strong food imagery
- search field with glass styling

Avoid:
- generic product grids
- lime green CTA
- trust/architecture copy on browse home
- fake health or AI claims

### Cart and checkout

Use:
- calm glass panels
- clear totals: Item total · Delivery fee · Taxes · Total
- orange primary checkout button: "Place order · ₹[total]"
- promo code field: show but mark "Coming soon" if backend unsupported — never fake a discount
- low-friction hierarchy

### Tracking

Tracking should feel like a live order card.

Show:
- current status with human label
- progress stepper: Order placed → Restaurant accepted → Preparing → Ready → Rider picked up → Delivered
- each step shows timestamp if available
- delivery code card only after `picked_up`
- rating prompt after `delivered`
- support link at all stages

**Status microcopy (occasion-aware, time-based):**
- Before 11am: "Your breakfast is being prepared."
- 11am–3pm: "Your lunch is on its way."
- 3pm–6pm: "Your snack is being prepared."
- After 6pm: "Your dinner is on its way."

Delivery code card copy:
- Title: Delivery code
- Text: Share this code only when your order reaches you.
- Button: Generate new code
- Note: New code replaces the old one.

Code card rules:
- Show only when order status is `picked_up`
- Hide once status is `delivered`
- Keep code in component state only — no localStorage, no sessionStorage, no URL params
- Page reload requires fresh code generation

After delivered:
- hide code panel
- show delivered state and order history
- show rating prompt

---

## 13. Restaurant Partner Flow Direction

Restaurant screens should feel operational but not enterprise dull.

Use:
- blue accent
- dark glass queue cards
- clear status columns
- large next-action buttons
- compact order metadata
- clear time/order details

Copy should be simple:
- New orders
- Preparing
- Ready for pickup
- Mark ready
- Accept order

Avoid:
- technical lifecycle language
- backend terms
- fake payout or earnings claims
- heavy admin-dashboard density

---

## 14. Delivery Agent Flow Direction

Delivery screens should feel focused and mobile-friendly.

Use:
- green accent
- large action buttons
- clear assigned order card
- pickup state
- delivery code entry panel

### Token entry panel

Title:
> Enter customer code

Text:
> Ask the customer for the delivery code shown on their tracking screen.

Input:
- 6 digits
- monospace
- large touch target

Button:
> Complete delivery

Error:
> That delivery code is incorrect.

Success:
> Code verified. Delivery completed.

> **Note:** Use "Code verified. Delivery completed." — not "Delivery verified." These are different strings.
> The PLF document is authoritative on all copy. This section matches it.

Wrong code:
- keep order active
- do not navigate away
- show error clearly

Correct code:
- complete delivery
- show delivered state

Do not change claim/pickup behavior.

---

## 15. Admin Flow Direction

Admin should feel like a control room.

Use:
- darkest glass surfaces
- violet accent
- dense but readable timeline
- clean table/list cards
- restrained typography
- minimal decoration

Admin can show more operational detail than public UI, but still prefer display labels.

Admin labels:
- Order history
- Actor
- Role
- Time
- Status
- Code verified
- Delivery completed

**Status display labels (use these, not raw keys):**

| Status key       | Display label       |
|------------------|---------------------|
| `placed`         | Order placed        |
| `accepted`       | Restaurant accepted |
| `preparing`      | Preparing           |
| `ready`          | Ready for pickup    |
| `picked_up`      | Rider picked up     |
| `token_verified` | Code verified       |
| `delivered`      | Delivered           |

Avoid turning admin into colorful consumer UI.

---

## 16. Product Language Firewall

> **The standalone `product_language_firewall.md` file is the authoritative source for all copy rules.**
> This section is a summary only. Where any conflict exists between this section and the PLF file, the PLF file wins.

Trust systems must be visible through experience, not backend vocabulary.

### Forbidden in public UI

Do not show:
- Event Ledger
- Transition Authority
- Handoff Token
- RPC
- Supabase
- database
- state machine
- backend authority
- controlled delivery states
- trust model
- guest path
- verified path
- full event ledger
- role authority
- raw event names such as order.placed or delivery.token_verified
- "real product, not a design mockup"

### Use instead

- Delivery code
- Order history
- Track every step
- No skipped steps
- Restaurant accepted
- Rider picked up
- Code verified
- Delivered
- Full order story
- Every order has a clear history
- Share this code only when your order reaches you

For complete replacement table, bad-to-good examples, screen-by-screen rules, and Codex implementation checklist: see `product_language_firewall.md`.

---

## 17. Animation and Interaction Rules

Use subtle interactions only.

Allowed:
- hover lift on cards
- soft button press
- gentle panel reveal
- focus ring transition
- small background light movement only if already lightweight
- smooth status change

Avoid:
- heavy motion
- bouncing food items
- huge parallax
- animated noise overload
- interaction that changes product logic

Animations should feel expensive and quiet.

---

## 18. Accessibility Rules

- Maintain readable contrast on glass.
- Body text must not be too faint.
- Focus states must be visible.
- Buttons must have clear text.
- Inputs must have labels or accessible names.
- Do not rely on color alone for status.
- Use large enough touch targets.
- Token code must be readable.

---

## 19. Implementation Guidance for Codex

Codex must treat this as frontend-only.

Do not change:
- backend logic
- Supabase SQL
- RPCs
- routes
- statuses
- auth
- RLS
- tests
- order lifecycle
- token behavior

Preserve:
- customer flow
- restaurant flow
- delivery flow
- admin flow
- delivery code generation
- token completion
- 11 passing tests

Codex should:
1. Create/adjust global design tokens.
2. Add shared glass/card/button/input/chip/sticky-cart styles.
3. Redesign homepage — Mode A (unauthenticated) and Mode B (authenticated browse) separately.
4. Polish customer tracking delivery-code UI.
5. Polish delivery code entry UI (agent).
6. Lightly polish restaurant/admin if safe.
7. Run build and tests.

**Safe frontend-only additions permitted (require no backend changes):**
- Veg/Non-Veg client-side toggle (reads existing `is_veg` field)
- Order Again section (reads existing `useOrderFlow` history)
- Sticky "View cart" bar (CSS only, reads cart state)
- Delivery time estimate on restaurant cards (reads existing `delivery_time_minutes`)
- Occasion-aware microcopy on tracking (time-based JS logic only)
- Empty state illustrations (inline SVG)
- Rating prompt after delivered (uses existing rating RPC if available)
- Search result copy improvements

Codex must not:
- expose backend language on public UI
- invent fake features
- use lime green as main accent
- turn the homepage into a backend diagram
- crop oversized hero text
- store delivery codes in localStorage/sessionStorage/URL
- alter functional behavior to fit the design
- use Space Grotesk for display headings

---

## 20. Implementation Stages

Stage names are A through E. The "4" prefix is removed — it was a vestige of internal milestone numbering and has no meaning here.

### Stage A: Global visual system

Add:
- color tokens
- typography tokens
- glass classes
- background treatment
- buttons
- inputs
- chips
- cards
- status pills
- sticky cart bar styles

No screen redesign yet.

### Stage B: Homepage

**Build Mode A (unauthenticated) and Mode B (authenticated) as two separate layout states on the same route.**

Mode A:
- hero with proof copy and food visual
- proof chain with correct labels
- metrics
- role cards with exact PLF copy
- restaurant preview strip

Mode B:
- location bar
- search
- category chips
- veg/non-veg toggle
- Order Again (if history exists)
- featured restaurants with delivery time
- sort bar + full list

Do not combine them into one layout.

### Stage C: Customer tracking

Polish:
- delivery code card (exact PLF copy)
- order history / progress stepper
- status card with occasion-aware microcopy
- buttons
- glass layout
- rating prompt after delivered

No logic changes.

### Stage D: Delivery agent

Polish:
- assigned order card
- pickup/completion actions
- code entry panel with exact PLF copy
- error: "That delivery code is incorrect."
- success: "Code verified. Delivery completed."

No logic changes.

### Stage E: Restaurant/Admin light polish

Polish only if safe:
- restaurant queue cards
- admin timeline panels with status display labels from §15
- role accents
- glass surfaces

No behavior changes.

---

## 21. Acceptance Checklist

A successful implementation must satisfy:

- The app feels like a premium dark food product.
- The primary visual direction matches the dark mobile food/glass reference.
- The dark editorial role-card style is used where appropriate.
- The bright lime template direction is not used.
- The UI does not expose backend architecture terms.
- Homepage Mode A headline is not cropped.
- Homepage Mode B is a food discovery screen, not a marketing screen.
- Food imagery feels rich and intentional.
- Glass cards have real depth.
- Orange is the main action accent.
- Role colors are subtle and semantic.
- Sticky cart bar appears on restaurant pages when items are in cart.
- Customer tracking delivery-code card is clear.
- Delivery code entry is easy to use.
- Admin feels like a control room, not a colorful consumer page.
- No fake features are introduced.
- No backend code is changed.
- Routes remain intact.
- Space Grotesk is not used.
- Build passes.
- Tests pass with 11 passing.

---

## 22. Hard Stop Conditions

Stop implementation if:
- backend changes seem required
- route changes seem required
- RPC changes seem required
- Supabase changes seem required
- token persistence is proposed
- tests need weakening
- fake features are introduced
- public UI uses backend terms again
- design starts averaging all references into a confused style
- lime green becomes the main visual direction
- homepage hero crops or overlaps
- implementation replaces app architecture instead of styling existing flows
- Space Grotesk is added as the display font

# Product Reality Audit

## Purpose
This audit documents the gap between:

- what the current BiteBlast app actually ships today
- what the Obsidian vault describes as the broader product vision
- what the current frontend is over-emphasizing or placing on the wrong screen

This is an audit only. No backend, route, auth, status, RPC, RLS, or UI logic changes are proposed here.

## Audit Baseline
- Mission 1 Event Ledger: live and verified
- Mission 2 Transition Authority: live and verified
- Mission 3 Delivery Code verification: live and verified
- Expected working baseline: `npm test` = `11 passed`

## Sources Read

### Current codebase
- `src/App.jsx`
- `src/pages/Home.jsx`
- `src/pages/Restaurant.jsx`
- `src/pages/Cart.jsx`
- `src/pages/Checkout.jsx`
- `src/pages/Payment.jsx`
- `src/pages/OrderConfirmation.jsx`
- `src/pages/Tracking.jsx`
- `src/pages/OrderHistory.jsx`
- `src/pages/Support.jsx`
- `src/pages/CustomerAuth.jsx`
- `src/pages/PartnerAuth.jsx`
- `src/pages/PartnerDashboard.jsx`
- `src/pages/PartnerQueue.jsx`
- `src/pages/PartnerOrderDetail.jsx`
- `src/pages/AgentAuth.jsx`
- `src/pages/AgentDashboard.jsx`
- `src/pages/AgentOrders.jsx`
- `src/pages/AgentOrderDetail.jsx`
- `src/pages/AgentProfile.jsx`
- `src/pages/StudioDashboard.jsx`
- `src/hooks/useOrderFlow.jsx`
- `src/hooks/useRestaurants.js`
- `src/hooks/useRestaurantOps.jsx`
- `src/hooks/useDeliveryOps.jsx`
- `src/hooks/useAdminStudio.jsx`

### Obsidian vault
- `raw/Food Delivery App/1_BiteBlast_PRD.md`
- `raw/Food Delivery App/2_BiteBlast_BRD.md`
- `raw/Food Delivery App/3_BiteBlast_FRD.md`
- `raw/Food Delivery App/4_BiteBlast_User_Stories.md`
- `raw/Food Delivery App/source_flowConfig.js`
- `raw/Food Delivery App/source_screenMap.json`
- `wiki/concepts/implementation-roadmap.md`
- `wiki/concepts/order-management-pipeline.md`
- `wiki/concepts/trust-kernel.md`
- `wiki/concepts/ops-playbook.md`
- `synthesis/overview.md`
- `VAULT_MANIFEST.md`

## 1. Current Codebase Feature Inventory

### Status legend
- `Exists and works`
- `Partially exists`
- `UI exists but is misleading`
- `Backend exists but UI missing`
- `Hallucinated or fake`

### Customer flow
| Feature | Status | Notes |
|---|---|---|
| Customer home | UI exists but is misleading | Real route exists, but the current home still behaves more like a premium marketing/trust landing surface than a food discovery-first screen. |
| Restaurant discovery | Exists and works | Real restaurant data is loaded and displayed. |
| Restaurant detail/menu browsing | Exists and works | `/restaurant/:restaurantSlug` is real and menu browsing works. |
| Search/filter/category browsing | Exists and works | Real home browsing/filtering exists. |
| Cart | Exists and works | Real add/remove/update flows exist. |
| Checkout | Exists and works | Billing, address selection, payment selection, and submit flow exist. |
| Payment | Exists and works | Payment intent flow exists. |
| Order confirmation | Exists and works | Confirmation screen exists after checkout. |
| Tracking | Exists and works | Real order tracking screen exists. |
| Delivery code | Exists and works | Appears only at the `picked_up` stage, which is the correct moment. |
| Order history | Exists and works | Orders list, reorder, rate, track, and report issue are present. |
| Customer support | Exists and works | Support ticket creation exists. |
| Ratings/reviews | Exists and works | Post-delivery rating support exists in order history/tracking flow. |
| Address management | Exists and works | Profile and checkout use saved addresses. |
| Guest browse | Exists and works | Customer can browse before login. |
| OTP login | Hallucinated or fake | Vault requires OTP/SMS flow, but the live app uses email/password style auth instead. |
| Wallet | Hallucinated or fake | Mentioned in vault, not implemented in the live routed app. |
| Coupons/offers engine | Hallucinated or fake | Mentioned in vault docs, not a real implemented customer capability in current routed surfaces. |
| Notifications | Hallucinated or fake | Present in vault conceptually, not a real live routed feature. |

### Restaurant partner flow
| Feature | Status | Notes |
|---|---|---|
| Partner auth | Exists and works | `/partner/auth` exists. |
| Partner dashboard | Exists and works | Queue and operational summary exist. |
| Incoming/active/ready order handling | Exists and works | Backed by Mission 2 transition authority. |
| Accept -> preparing -> ready transitions | Exists and works | Real partner order detail flow exists. |
| Delivery assignment visibility | Exists and works | Restaurant can see delivery assignment state. |
| Menu management | Hallucinated or fake | Vault expects menu CRUD, but current partner routed app does not ship full menu management screens. |
| Bulk menu upload | Hallucinated or fake | In vault only. |
| Inventory flags | Hallucinated or fake | In vault only. |
| Earnings/payout dashboard | Hallucinated or fake | In vault only. |
| Trust score/dispute center | Hallucinated or fake | In vault only. |

### Delivery partner flow
| Feature | Status | Notes |
|---|---|---|
| Agent auth | Exists and works | `/agent/auth` exists. |
| Available ready orders | Exists and works | Agent can see available work. |
| Claim order | Exists and works | Real claim flow exists. |
| Pickup order | Exists and works | Real pickup flow exists. |
| Delivery code completion | Exists and works | Mission 3 delivery code verification is live and enforced. |
| Assigned order detail | Exists and works | Real order detail view exists. |
| Availability/profile | Partially exists | Profile and availability toggle exist, but this is much smaller than the vault agent app. |
| Delivery history | Partially exists | Some list/history surfaces exist, but not a full earnings/history product. |
| Earnings dashboard | Hallucinated or fake | Vault feature, not fully implemented in live routed app. |
| GPS navigation | Hallucinated or fake | Vault expects nav/map/GPS surfaces; current live app does not ship true GPS navigation. |
| COD completion flow | Hallucinated or fake | Vault expects COD-specific flows; current implementation centers on delivery code verification. |
| OTP delivery | Hallucinated or fake | Vault expects OTP/PIN; live product uses Mission 3 delivery code instead. |
| KYC onboarding | Hallucinated or fake | Vault feature, not current live agent implementation. |

### Admin flow
| Feature | Status | Notes |
|---|---|---|
| Admin access | Exists and works | `/studio` route exists. |
| Platform overview | Exists and works | Basic dashboard stats and order overview exist. |
| Orders list | Exists and works | Real order list exists. |
| Selected order detail | Exists and works | Real selected-order inspection exists. |
| Order history / timeline | Exists and works | Mission 1 ledger is visible in studio. |
| Team action visibility | Exists and works | Actor/timeline detail exists through ledger-backed timeline. |
| Fraud console | Hallucinated or fake | Vault feature, not in current studio. |
| GPS anomaly monitoring | Hallucinated or fake | Vault feature, not in current studio. |
| KYC queue | Hallucinated or fake | Vault feature, not in current studio. |
| Payout/reconciliation | Hallucinated or fake | Vault feature, not in current studio. |
| Dispute resolution center | Hallucinated or fake | Vault feature, not in current studio. |

### Shared platform features
| Feature | Status | Notes |
|---|---|---|
| Event ledger | Exists and works | Mission 1 complete. |
| Transition authority | Exists and works | Mission 2 complete. |
| Delivery code verification | Exists and works | Mission 3 complete. |
| Real-time order refresh | Exists and works | Tracking and operational screens refresh live. |
| Order history timeline | Exists and works | Customer and admin history surfaces exist. |
| Support ticket creation | Exists and works | Real support flow exists. |
| Broader fraud/trust engine | Backend exists but UI missing | Some trust mechanics exist architecturally, but the broader vault fraud engine is not a live product surface. |

### Product reality summary
The live app is a working food ordering and fulfillment product with:
- customer browse -> cart -> checkout -> track
- restaurant accept/prepare/ready operations
- delivery claim/pickup/complete with delivery code
- admin order monitoring and timeline review

The vault product is much broader than the live app. Many finance, fraud, GPS, KYC, dispute, payout, and campaign systems are still concept-stage relative to the real routed product.

## 2. Obsidian Vault Requirements Extraction

This section extracts requirements that are actually present in the vault. It does not invent new ones.

### Customer flow
Vault requirements explicitly describe:
- Guest restaurant browsing without login
- OTP login via phone/SMS
- Restaurant discovery with ratings, delivery time, and cuisine
- Restaurant detail and menu browsing
- Cart
- Checkout and payment
- Payment retry
- Real-time delivery tracking
- Order history and reorder
- Rating and review
- Address management
- Wallet
- Offers/coupons
- Support and issue escalation paths

### Restaurant partner flow
Vault requirements explicitly describe:
- Guided onboarding
- Business profile completion
- KYC submission/review
- Restaurant dashboard
- Order acceptance/rejection
- Preparation updates
- Ready-for-pickup state
- Menu CRUD
- Bulk menu upload
- Inventory flags / stock-out management
- Revenue analytics
- Payout visibility
- Trust score visibility
- Dispute center

### Delivery partner flow
Vault requirements explicitly describe:
- KYC onboarding
- Order offer flow
- Pickup flow
- Delivery navigation
- COD completion support
- Customer OTP/PIN handoff confirmation
- Earnings dashboard
- Availability controls
- Issue reporting
- Delivery completion validation tied to location and/or confirmation flows

### Admin flow
Vault requirements explicitly describe:
- Admin dashboard / command center
- Real-time operations monitoring
- KYC review
- Agent/restaurant investigations
- GPS anomaly monitoring
- Fraud signal review
- Customer dispute resolution
- Risk threshold configuration
- Regulatory/compliance reporting
- Financial reconciliation
- Clawbacks
- Escalation queue
- Campaign/promotion management

### Shared platform features
Vault requirements explicitly describe:
- Full food delivery lifecycle from discovery to delivery
- Shared cross-role operational context
- Real-time tracking
- Order state progression
- Delivery confirmation mechanisms
- Financial transparency
- Trust and fraud infrastructure
- Support/escalation capability

### Future features from the vault and synthesis docs
The vault also points to a later-stage or broader future scope that is not the live app today:
- GPS anomaly detection
- Fraud scoring and refund-abuse detection
- Payment escrow / two-phase commit patterns
- Broader admin control planes
- Wallet refunds
- Biometric or stronger identity layers
- Support chat / richer dispute tooling
- Campaign engine
- Reconciliation and payout operations

## 3. Hallucination Cleanup List

These are frontend content or emphasis patterns that should be removed, reduced, or moved to the correct screen because they distort the product reality.

### Customer home problems
- Marketing role sections on customer home
  - The customer home should not lead with restaurant, rider, and admin role panels.
- Delivery code shown too early
  - Delivery code belongs only after pickup on tracking, not as a homepage-first concept.
- Tracking/proof content on homepage
  - Tracking is a post-checkout flow, not the primary browsing surface.
- Admin/platform claims on customer screens
  - Customers do not need admin oversight, audit, or role-system framing on first load.
- Internal/backend terms shown publicly
  - Event Ledger
  - Transition Authority
  - Handoff Token
  - RPC
  - Supabase
  - state machine
  - backend authority
  - controlled delivery states
  - trust model
  - guest path / verified path
  - raw event names

### Features that must not be implied unless supported
- Fake GPS claims
- Fake payout/refund/fraud/KYC claims
- Fake finance or compliance modules
- Fake restaurant menu-management claims on customer surfaces
- Any feature described only in the vault but not shipped in the live routed app

### Current codebase drift that should be de-emphasized
- The homepage currently over-communicates:
  - delivery code
  - proof/verification framing
  - order history panels
  - role-system summaries
- These are not fake features, but they are placed too early and too prominently for a food app home.

### Important distinction
The trust systems are real and valuable, but they are supporting product features. They should appear:
- during tracking
- during delivery completion
- in order history
- in admin/order-detail contexts

They should not replace the core customer-first food browsing experience.

## 4. Correct Product Hierarchy

### Customer priority
1. location/search
2. restaurant discovery
3. categories
4. restaurant menu
5. cart
6. checkout/payment
7. order confirmation
8. tracking
9. delivery code only after pickup
10. order history/support

### Restaurant partner priority
1. login
2. dashboard
3. incoming orders
4. accept/preparing/ready flow
5. menu/order management only if actually supported
6. basic support/status visibility

### Delivery partner priority
1. login
2. available ready orders
3. claim order
4. pickup order
5. delivery code entry after pickup
6. complete delivery
7. assigned/delivered history if supported

### Admin priority
1. platform overview
2. orders list
3. selected order detail
4. order history/timeline
5. users/roles/health only if supported
6. no fake finance/fraud/dispute modules unless vault explicitly requires and code supports them

## 5. Screen Purpose Map

| Route | Current purpose | Correct purpose | Data source | Allowed content | Forbidden content | Risk |
|---|---|---|---|---|---|---|
| `/` | Hybrid marketing/discovery homepage | Customer food discovery home | `useRestaurants`, seed fallback, customer session/address | location, search, categories, restaurant cards, featured kitchens | admin claims, role-system marketing, delivery code before tracking, backend terms | High |
| `/login` | Customer sign-in | Customer access/auth only | customer session/auth | login, account continuity, order access | architecture claims, platform/admin language | Medium |
| `/restaurant/:restaurantSlug` | Restaurant/menu browsing | Restaurant detail and ordering | `Restaurant.jsx`, Supabase `restaurants` + `menu_items` | menu, images, ratings, delivery estimate, add to cart | admin/trust architecture copy | Low |
| `/cart` | Cart review | Cart review before checkout | `useCart` | line items, totals, remove/update, checkout CTA | ledger/system metaphors | Medium |
| `/checkout` | Checkout | Checkout/payment prep | `useCart`, addresses, order flow | address, payment method, summary, place order | fake wallet/coupon/GPS if unsupported | Low |
| `/payment/:intentId` | Payment intent screen | Payment confirmation/retry flow | payment intent + order flow | payment status, retry, next step | unrelated product marketing | Low |
| `/order-confirmation/:orderId` | Confirmation screen | Order placed confirmation | order flow | confirmation, summary, next CTA to tracking/orders | role/system diagrams | Low |
| `/track` | Active order redirect | Convenience redirect to active order | active order in order flow | redirect only | homepage-like content | Low |
| `/track/:orderId` | Tracking + delivery code | Track active order | `useOrderFlow`, realtime, `issue_delivery_handoff_token` | progress, ETA, rider info, delivery code after pickup, rating, cancel when allowed | homepage marketing, admin language, raw event names | Low |
| `/orders` | Order history | Customer past orders and reorder | `useOrderFlow` | history, reorder, rate, track, report issue | public marketing or admin claims | Low |
| `/support` | Support ticket screen | Customer support/issues | support RPC + order history | issue reporting, order-linked support | platform control-plane language | Medium |
| `/partner/auth` | Partner sign-in | Restaurant partner login | restaurant session/auth | partner access only | customer marketing, finance promises not implemented | Low |
| `/partner/queue` | Partner dashboard | Incoming kitchen operations | `useRestaurantOps` | queue, counts, accept/preparing/ready work | fake payouts, fake menu CMS if not present | Low |
| `/partner/orders` | All restaurant orders | Historical and live restaurant orders | `useRestaurantOps` | restaurant order list, status visibility | “full ledger” style copy if it confuses kitchen usage | Medium |
| `/partner/orders/:orderId` | Order detail | Restaurant order action screen | `useRestaurantOps` | item detail, status updates, rider assignment status | fake dispute/payout/trust-score modules | Low |
| `/agent/auth` | Agent sign-in | Delivery partner login | agent session/auth | role access, session state | KYC/GPS claims unless implemented | Low |
| `/agent/active` | Agent dashboard | Current available/assigned work | `useDeliveryOps`, agent session | available orders, active assignment, next actions | delivery ledger jargon, fake navigation/GPS claims | Medium |
| `/agent/orders` | Agent order list | Delivery work list/history | `useDeliveryOps` | open offers, assigned orders, completed list if present | finance/history claims beyond supported data | Medium |
| `/agent/orders/:orderId` | Delivery order detail | Claim/pickup/complete delivery with code | `useDeliveryOps`, Mission 3 RPCs | pickup and completion actions, delivery code entry after pickup | architecture language, fake GPS/COD flows | Low |
| `/agent/profile` | Agent profile | Availability and basic profile | agent session | availability, basic agent info | fake earnings/KYC if not implemented | Medium |
| `/studio` | Admin overview + order inspection | Platform order monitoring and order history inspection | `useAdminStudio`, order ledger | order list, selected detail, timeline, actor/action visibility | fake finance, fake KYC queue, fake fraud dashboards | Low |

## 6. Feature Priority Roadmap

### Stage A
Remove hallucinated or misplaced homepage content and restore customer-discovery purpose.

### Stage B
Make customer home a real food discovery page using existing restaurant and menu data.

### Stage C
Polish restaurant menu and dish browsing using the current data model and routes.

### Stage D
Polish cart and checkout using existing product logic.

### Stage E
Polish tracking and delivery code surfaces at the correct moment in the lifecycle.

### Stage F
Polish restaurant partner dashboard and order detail using the already working queue flow.

### Stage G
Polish delivery partner dashboard and order detail around available work, pickup, and delivery code completion.

### Stage H
Polish admin studio around order overview and order history/timeline only.

### Roadmap rule
Do not put delivery code, admin audit, or trust architecture on the first screen.
Trust features should appear where they become relevant in the flow.

## 7. Copy Rules

### Core rules
- Customer-facing language only on customer surfaces
- Food delivery first
- Trust features explained only when relevant
- No backend or internal architecture words
- No overclaiming
- No fake features
- No marketing copy where product UI is needed

### Public/customer UI should prefer
- Order placed
- Restaurant accepted
- Preparing
- Ready for pickup
- Rider picked up
- Delivery code
- Code verified
- Delivered
- Track every step
- Every order has a clear history
- Share this code only when your order reaches you

### Public/customer UI should avoid
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

### Role-specific copy guidance
- Customer screens should feel like ordering food, not auditing a system.
- Restaurant screens should feel like kitchen operations, not architecture demos.
- Delivery screens should feel like assignment/pickup/drop workflow, not internal protocol UIs.
- Admin screens may use denser operational language, but should still avoid fake modules that are not implemented.

## 8. Safest Next Implementation Step

The safest next implementation step is:

### Fix `Home.jsx` into a real customer restaurant-discovery screen using existing restaurant/menu data and existing routes.

Why this should be first:
- It is currently the biggest product-reality mismatch.
- The core browse/menu/cart/checkout/tracking flows already exist and work.
- Fixing home does not require backend changes.
- Fixing home reduces the risk of showing trust features too early.
- It aligns the product with the vault’s actual customer journey:
  - browse
  - choose restaurant
  - add to cart
  - checkout
  - track
  - use delivery code only at handoff

### What this next step should do
- Center the home screen on search, categories, featured kitchens, and restaurant discovery
- Keep delivery/trust mechanics secondary and contextual
- Remove role-system and admin-forward messaging from customer-first home
- Preserve existing routes, restaurant data, and order flow wiring

### What this next step should not do
- Change backend or Supabase
- Add fake features
- Introduce GPS, payout, fraud, refund, KYC, or dispute modules on customer home
- Move delivery code earlier than tracking after pickup
- Rebuild working flows that are already correct

## Final Audit Conclusion

BiteBlast today is already a real multi-role food delivery product, not just a concept:
- customer ordering works
- restaurant order handling works
- delivery completion with delivery code works
- admin order monitoring and order history inspection works

The main frontend problem is not missing trust infrastructure. The trust infrastructure is already there.

The main frontend problem is product hierarchy:
- the customer home is still behaving too much like a product-story or trust-story screen
- the app should instead behave first like a real food delivery product
- trust systems should support the flow, not replace the flow

The next safe move is to correct the homepage toward restaurant discovery first, then polish the rest of the flows in the natural product order.

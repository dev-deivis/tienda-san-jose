---
status: awaiting_human_verify
trigger: "cart-merge-empty-db — Guest cart merge on login never writes to CartItem table"
created: 2026-07-08T00:00:00Z
updated: 2026-07-08T00:01:00Z
---

## Current Focus

hypothesis: mergeAndLoad() is either never called, or called with empty guestItemsRef.current — the console logs will disambiguate
test: Start dev server, add items as guest, log in, observe browser console and server terminal logs
expecting: Logs will show one of: (a) mergeAndLoad never called, (b) items empty, (c) server 401, (d) Prisma error
next_action: CHECKPOINT — user must run dev server and test with console logs

## Symptoms

expected: After guest adds items and logs in, /api/cart/merge writes CartItem rows to MySQL
actual: CartItem table is completely empty after login; UI shows items because CartContext keeps them in state
errors: No visible errors — merge appears to succeed silently
reproduction: 1) Visit as guest, add products. 2) Log in. 3) Check MySQL CartItem table — empty.
started: Just implemented in this session. Never worked.

## Eliminated

- hypothesis: TypeScript compilation error prevents route from loading
  evidence: `npm run build` succeeds cleanly with zero errors
  timestamp: 2026-07-08T00:01:00Z

- hypothesis: CartProvider not persisting across navigation (would reset ref)
  evidence: CartProvider is in root layout.tsx with no key prop — persists on client-side navigation
  timestamp: 2026-07-08T00:01:00Z

- hypothesis: ProductId type mismatch (string vs int from JSON)
  evidence: JSON.parse preserves numeric types; productId remains a number from localStorage
  timestamp: 2026-07-08T00:01:00Z

- hypothesis: Prisma schema constraint blocks CartItem creation
  evidence: Schema looks correct — userId FK to User, productId FK to Product, variante Json?; no unique constraints that would conflict
  timestamp: 2026-07-08T00:01:00Z

## Evidence

- timestamp: 2026-07-08T00:01:00Z
  checked: merge/route.ts
  found: getSessionUser() correctly awaits cookies() — correct for Next.js 16 App Router. No try/catch around Prisma writes — unhandled Prisma error would propagate as 500.
  implication: If DB write fails, server returns 500; mergeAndLoad falls through to loadFromDB() silently.

- timestamp: 2026-07-08T00:01:00Z
  checked: cart-context.tsx Effect ordering
  found: Effect 1 (mount, []) runs first → sets guestItemsRef.current from localStorage. Effect 2 ([items, localHydrated, user]) syncs guestItemsRef.current while user is null. Effect 5 ([user?.id, authLoading, localHydrated, mergeAndLoad]) fires on login transition — prevUserId: null→number → calls mergeAndLoad(). All ref updates happen before mergeAndLoad reads the ref.
  implication: Logic appears correct. guestItemsRef.current should be populated when mergeAndLoad fires after login.

- timestamp: 2026-07-08T00:01:00Z
  checked: login/page.tsx
  found: After setUser(data.user), router.push('/') is called synchronously. In React 18 with automatic batching, setUser's state update may not flush before navigation starts. Navigation is client-side (useRouter from next/navigation) — no full page reload. CartProvider persists.
  implication: Navigation timing is a possible but unlikely culprit since CartProvider persists.

- timestamp: 2026-07-08T00:01:00Z
  checked: mergeAndLoad in cart-context.tsx
  found: Original code had empty `catch {}` — silently swallowed fetch errors. If server returns non-ok, falls through to loadFromDB() which sets items to [] (empty DB).
  implication: BUT symptom says UI shows correct items — if setItems([]) were called, items would clear. This means either (a) mergeAndLoad is never called, OR (b) the fall-through to loadFromDB somehow doesn't clear items (only possible if loadFromDB itself silently fails).

- timestamp: 2026-07-08T00:01:00Z
  checked: loadFromDB in cart-context.tsx
  found: GET /api/cart — if no session, returns { items: [] }. loadFromDB: if res.ok, setItems(data.items). Wrapped in try/catch {} — also silent.
  implication: If both mergeAndLoad and loadFromDB fail silently (network errors), items from Effect 1 persist in state. This would explain "UI shows items correctly".

- timestamp: 2026-07-08T00:01:00Z
  checked: console.log instrumentation added
  found: Added logs to: (1) mergeAndLoad() — logs guestItems count and fetch response status, (2) session Effect 5 — logs prevUserId/currentUserId transition and when mergeAndLoad is called, (3) merge/route.ts — logs session, received items, create/update per item, final merged count.
  implication: Logs will definitively show the failure point.

## Resolution

root_cause: Pending — logs needed to confirm
fix:
verification:
files_changed:
  - context/cart-context.tsx (console.logs added for diagnosis)
  - app/api/cart/merge/route.ts (console.logs added for diagnosis)

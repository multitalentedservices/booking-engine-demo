# Build Notes — SlotBook Booking Engine (Demo) — Portfolio Queue #7

**Built:** 2026-11-21 · **Builder:** AICOS-107 (Booking Website Builds) — executed by builder worker
**Queue position:** #7, after Gift Basket #2 (81), Restaurant #3 (84), MTS flagship #1 (89), Salon #4 (90), Clinic #5 (90), Real Estate #6 (90) — this build had to match or beat 90 and prove its headline claim — **one engine, many skins** — in the battery and in screenshots (lesson 23).
**Stack:** hand-coded HTML/CSS/vanilla JS, zero third-party packages/CDN libraries except Google Fonts. No build step. All files strictly inside this project's folder (rule 18).

## Design record (Gate 2)

**Identity — "Clean Local" as a crisp SaaS-product UI.** White/slate ground, one strong accent per skin, dense-but-calm data presentation, Space Grotesk display + Inter body with tabular slot times. The product's claim is the layout: a persistent skin switcher in the header of every page, a slot grid that prints its own rules, and an admin table that changes the booking flow. Distinct from all six predecessors: not Gift Basket cream/emerald, not Restaurant parchment/brick, not MTS black/lime, not Salon porcelain/blush (the salon *skin* here is a saturated rose product theme, not the salon site's editorial system), not Clinic petrol, not Estate navy/copper.

**References researched (2026-11-21):**
1. **Stripe** (Design Inspiration Library C1) — product-led corporate clarity, one promise up front, density that stays scannable. Taken: benefit-led product home, restraint outside the demo surface.
2. **Linear** (library C2) — the interface itself persuades; real product UI over illustration. Taken: the live engine *is* the hero proof; screenshots of the actual UI are the visuals.
3. **Calendly** (fresh web research 2026-11-21 — availability computation, buffer-aware candidate slots, conflict subtraction, re-validation at confirm) — Taken: slot generation as availability rules minus busy time, buffers consuming diary time, named unavailability.
4. **Acuity Scheduling** (fresh web research 2026-11-21, features page) — appointment types with own durations/prices, per-staff availability controls, admin calendar management. Taken: config-shaped services/resources and an admin view with status management, presented honestly as demo data.

**Tokens + contrast (computed from hex; asserted per skin in tests.js — all PASS):**
- Engine: `--bg #FFFFFF` · `--surface #F1F3F8` · `--ink #17203A` · `--muted #475069` · `--accent #4338CA` · `--accent-dark #3730A3`
- Salon skin: `--bg #FFF9F7` · `--surface #FBEFF3` · `--ink #2B1A20` · `--muted #5C4450` · `--accent #9D174D` · `--accent-dark #831843`
- Clinic skin: `--bg #FFFFFF` · `--surface #EDF6F4` · `--ink #12312E` · `--muted #3F5B57` · `--accent #0F766E` · `--accent-dark #115E59`
- `--error #B3261E` — semantic error red, the only shared extra hue (6.54:1 on white).
- Every skin: ink-on-bg, muted-on-bg and white-on-accent ≥ 4.5:1, accent focus ≥ 3:1 — asserted in the battery, not in prose.

**Type pairing:** Space Grotesk (600/700) display + Inter (400/600/700) body. Body 17px; form fields 16px (iOS zoom guard).
**Components:** buttons 52px, skin buttons 44px, slots 52px, pick cards with `:focus-within` HOST outline (lesson 20). One component system across all pages and all skins — only the CSS variables change.

**ONE conversion goal:** a completed booking through the engine (confirmation with reference), with the Admin view as the proof surface.
**Pages (4):** `index.html` (product home + skin showcase) · `book.html` (the engine: 6-step flow) · `admin.html` (demo admin view) · `docs.html` (How it works — the engine's real config explained).
**Demo clock (stated, deterministic):** the engine models "now" as **Tuesday 24 November 2026, 09:00** so lead-time and past-slot rules are testable and the battery is deterministic. This is printed on every page footer and in the slot picker.

**Video position (plain, per owner rule): video: none — photo + CSS motion.** Video generation is region-blocked (403) — not attempted. Motion is minimal (one fade) and disabled under reduced motion.

## The engine — config-driven, in `js/logic.js` (shared by site + battery, lesson 13)
One CONFIG object per skin drives everything: business name, services (name, duration, price, buffer), resources (own weekly hours + days off), business hours per weekday, slot interval (30 min engine/salon, 20 min clinic), closed days (Sundays), lead-time rule (no bookings < 2h from the demo clock).
- **Slot generation:** candidate slots on the interval inside business hours; a slot survives only if service duration + buffer fits; it is bookable only if the chosen resource (or any, for First available) is working, not on a day off, and has no overlapping booking — deterministic seeded-taken slots, persisted bookings, and seeded demo bookings all block; disabled slots **name their reason on the slot itself** (lesson 25): already booked / not working / day off / too soon / past.
- **Booking flow:** service → resource (or First available) → date → slot → details (name, phone, optional notes) → review → confirmation with reference `BE-DEMO-####`; per-step validation with LIVE error clearing; bookings persist to localStorage (`be_bookings`, seeded with 5 demo bookings on first load).
- **Skin switcher (headline):** three skins — Engine default, Salon (Glow & Grace Salon), Clinic (Sehat Plus Clinic). Switching swaps CSS-variable theme AND business config (name, services, resources, hours, interval, WhatsApp number) with no page rebuild. Skin state is one surface (lesson 28): the switcher buttons, the `data-skin` theme attribute and the config in use all read/write through `js/app.js` only; the flow resets cleanly on switch and a booking made in one skin stays correctly listed in Admin under its own skin.
- **Admin view (demo data):** all bookings (seeded + browser-made) in a table with date / resource / status filters; Confirm / Complete / Cancel actions persist to localStorage; **a cancelled booking frees its slot** — proven in the flow run (before: slot disabled "already booked"; after admin cancel: same slot enabled "to 09:45").
- **WhatsApp:** confirmation carries a wa.me link with booking details prefilled per skin number; clicking it is recorded to a local demo log (`be_wa_log`) — firing recorded in the flow run for both skins (lesson 21).
- **DEMO labelling:** ribbon + footer note on every page; Admin labelled demo data throughout; confirmation states no real appointment is booked.

## Ladder mechanics (lessons 1–28, all applied)
Screenshot-first QA with clip-aware + leaf-text audits (1, 14); tool UI hides nothing by default — no reveal pattern needed (2+11); real generated photos, one style, ≤103 KB (3); palette discipline per skin, error red only extra (4); one component system (5); min-width:0 on grid children, admin table in an overflow-x wrapper (6); live error clearing (7); video honesty (8, 19); honest scoring + disclosures (9); weights code 46 KB < 400 KB, media 311 KB (10); element screenshots for state evidence (12); pure-logic split (13); row+column — no lone-axis grid placement used (15); specificity verified via state evidence (16); complete-repo/assets rule + nothing-mixes (17, 18); focus HOST for hidden pick inputs, recorded in keyboard walk (20); integration firing recorded (21); headline requirement proven in battery + screenshots (23); harness modes have harness branches — settle skipped under --nojs (24); constraints named in errors (25); flow asserts on rendered message CONTENT (26); no absolute hero copy (27); multi-surface state sync — skin's three surfaces share one writer (28).

## Media
3 generated photographs in ONE consistent bright minimal style, 311 KB total, largest 103 KB:
`assets/hero.jpg` · `assets/skin-salon.jpg` · `assets/skin-clinic.jpg` (+ `assets/favicon.svg`, vector, pushed with code).
**Repo note (owner rule):** the connector push carries text files only, so the 3 photographs are PENDING WEB-UPLOAD; repo status is "code pushed — images pending web-upload", not complete. Video: none — photo + CSS motion.

## QA summary
- Tests: `tests.js` → **135 PASS / 0 FAIL** (`tests-output.log`): slot generation (durations, buffers, resource intersection, days off, closed Sundays, deterministic taken slots, lead-time boundary at exactly 11:00), skin-swap integrity (different services/hours/intervals/themes; salon booking still filters correctly, no cross-skin leak), booking-blocks-slot + overlap, **cancel-frees-slot in pure logic**, admin filters (exact counts), validation + live-clear logic, reference generation, WhatsApp construction per skin, **13 contrast assertions computed from hex across all three skins**, link integrity across 4 pages, SEO artefacts, weights.
- Screenshots (`screenshots/`): 4 pages × 390/768/1440 (12) + 320px probe (4) + JS-disabled run (12) + reduced-motion run (12) — final audits: **0 overflow, 0 leaf text-overflow, 0 broken images** in every run. Phone pages read by eye page by page; both skin slot grids read by eye (rose vs teal, reasons printed on disabled slots).
- Flow captures (`screenshots/flow-*.png` + `flow-log.txt`): full bookings completed in BOTH skins (Salon: Haircut & Finish, Ayesha Khan, 2026-11-25 09:00, BE-DEMO-8448, PKR 2,500 exact; Clinic: GP Consultation, Dr Sana Tariq, BE-DEMO-6344, PKR 1,500 exact), phone error CONTENT asserted + LIVE clear proven, WhatsApp firing logged for both skins, admin list + confirmed filter (7 → 5), and the **cancel-frees-slot before/after pair** (`flow-cancel-before-slots.png` / `flow-cancel-after-slots.png`).
- Keyboard walk: `screenshots/keyboard-walk.md` — 20 Tab stops across Book + Home, visible 3px focus at every stop incl. the pick-card HOST outline at the service radio stop (lesson 20); `keyboard-focus-book.png` / `keyboard-focus-home.png`.

**Disclosures:** none — no test assertion was amended and no harness fix was needed in this pass. The locator (element) screenshots of step panels include the sticky header at their top edge by framing; full-page captures are the layout evidence and are clean.

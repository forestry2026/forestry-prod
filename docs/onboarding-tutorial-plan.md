# Forestry — First-Login Guided Tutorial Plan

> **Promise:** Get any new admin or vendor productive in under 90 seconds, without reading a manual.
> **Audience:** Vendors logging in for the first time (post-approval) and admins using a fresh account.
> **Big idea:** A "guided walkthrough" that doesn't feel like one — a calm, editorial-styled overlay that walks the user through their portal as if a senior colleague were sitting beside them.

---

## 1. Strategy & Positioning (Ogilvy)

### Who is this for?

Two distinct audiences. Same mechanism, different content.

| Audience | Mindset on first login | Their question |
|----------|------------------------|----------------|
| **Vendor** | Cautious, slightly overwhelmed. Their LLC was just approved. They've never seen the portal. | "Where do I add my products and respond to RFPs?" |
| **Admin / Manager** | Operational. Was given a login. Needs to know structure quickly. | "Where do RFPs come in, where do I create products, where do I manage vendors?" |

### The single promise (per audience)

- **Vendor promise:** *"Three steps to your first quote."* — Add a product → Set price → Respond to RFPs.
- **Admin promise:** *"Run the entire pipeline from one screen."* — Vendors → Products → RFPs → Production.

### Positioning

This is **not** a feature tour. It's an **operator handover**. The tone is "here's what matters" — not "look at all our features."

Psychological segmentation: we're targeting people who hate tutorials. So the tutorial cannot feel like one.

### What we will NOT do

- No popups blocking the entire screen
- No "Welcome to your dashboard! 🎉" emojis
- No 12-step tour
- No video modal
- No checklist that gamifies onboarding (already a tired pattern)

---

## 2. Big Idea: "The Margin Notes"

A senior colleague leaves **margin notes** in the interface. Each note is a small annotated card that points to a real UI element with a thin connecting line. The notes appear one at a time; the user clicks "Next" or follows the actual instruction (e.g. "click the Add Product button"). Notes feel hand-placed, editorial — like a designer leaving feedback on a Figma file.

The character: a single annotation card with:
- A two-letter glyph in a corner (ON-01, ON-02 — like museum exhibit numbers)
- A 4-6 word headline (Ogilvy: short, benefit-led)
- A one-sentence body
- An optional inline action ("Try it now")
- A thin terracotta line drawing attention to the element (anchored arrow, not a bouncing ring)

This is the "memorable burr" — the thing the user will remember about the tutorial.

---

## 3. Visual Direction (Bencium)

**Aesthetic commitment:** Editorial / Architectural Blueprint hybrid. Quiet, confident, generous whitespace. Annotations feel like they belong on a museum placard.

| Element | Decision |
|---------|----------|
| Card background | Cream `#FAF6F0` with 1px terracotta border |
| Card shape | `rounded-2xl`, soft shadow `shadow-warm-sm` |
| Headline font | Existing `font-heading` (project uses it for headings) — bold |
| Body font | Existing system body — 13px, line-height 1.6 |
| Annotation line | 1.5px solid terracotta, drawn with SVG, with a small filled circle at the target end |
| Step number | `font-mono` two-digit code (`ON-01`, `ON-02`) in small caps, terracotta |
| Backdrop | Subtle dim only (`bg-charcoal/20`), NOT a blackout. The interface stays visible — that's the point. |
| Animation | Card fades + slides 8px from anchor direction. 200ms. Easing: `cubic-bezier(0.22, 1, 0.36, 1)`. No bouncing. |
| Progress | Tiny dotted progress at top of card: `● ● ○ ○ ○` |
| Skip | Always visible, low contrast, top-right of card: "Skip — you can replay this anytime" |

**Anti-patterns explicitly rejected:**
- No glassmorphism
- No animated rings around target elements
- No "Got it!" buttons (use real verbs: "Take me there", "Continue", "I'll explore")

---

## 4. Technical Architecture

### Data model

Add one column to the `User` table:

```prisma
model User {
  // ... existing fields ...
  onboardingState String?  @default("{}")  // JSON: { adminTour?: 'completed' | 'skipped' | 'in_progress'; vendorTour?: ...; lastStep?: number; completedAt?: ISO }
}
```

Why a JSON blob instead of separate boolean? Easy to extend per role/portal without migrations.

### Library choice

**Recommendation: build it, don't install it.**

Reason: every tour library (Joyride, Shepherd, Driver.js, Onborda) ships its own opinionated DOM/CSS that fights our design system. The annotation card is six small components. Building it ourselves keeps the visual language tight.

If speed matters more, **Onborda** (Next.js–native, headless) is the only acceptable third-party option — its render is fully custom.

### Components to create

```
src/components/onboarding/
  OnboardingProvider.tsx       # Context: current step, role, isActive, advance/skip/restart
  OnboardingOverlay.tsx        # Renders the dim backdrop + annotation card
  AnnotationCard.tsx           # The margin-note card itself
  AnnotationLine.tsx           # SVG line from card to target element
  useOnboardingAnchor.ts       # Hook: registers a DOM ref + step ID, returns anchor data to overlay
  tours/
    adminTour.ts               # Step definitions for admin portal
    vendorTour.ts              # Step definitions for vendor portal
```

### Anchor mechanism

Each step targets a DOM element by `data-tour-id`. Components opt in:

```tsx
<button data-tour-id="vendor.products.add" ...>Add Product</button>
```

The hook scans for the data attribute, computes its bounding rect, and positions the card on the side with the most free space. Resizes update on scroll/resize via ResizeObserver.

### Trigger logic

```ts
// On layout mount (admin or vendor)
useEffect(() => {
  if (!session?.user) return
  const state = JSON.parse(session.user.onboardingState ?? '{}')
  const tourKey = role === 'VENDOR' ? 'vendorTour' : 'adminTour'
  if (state[tourKey] !== 'completed' && state[tourKey] !== 'skipped') {
    onboarding.start(tourKey)
  }
}, [session])
```

Persist progress on every step advance via `PATCH /api/me/onboarding`.

### Replay

Add a small "Replay tour" link in the user dropdown menu. Sets `onboardingState[tourKey]` back to `'in_progress'` and starts at step 1.

---

## 5. The Vendor Tour (5 Steps)

Tone: Direct, helpful, like a colleague. Specific, not generic.

| # | Anchor | Headline (≤ 6 words) | Body (≤ 1 sentence) | CTA |
|---|--------|---------------------|---------------------|-----|
| ON-01 | Sidebar logo / portal home | **Welcome. Here's the short version.** | Three minutes — products, RFPs, profile. That's the whole portal. | Continue |
| ON-02 | "Products" sidebar link | **Your catalogue lives here.** | Add what you make. Buyers see it the moment you publish. | Take me there |
| ON-03 | "Add Product" button on Products page | **One product is enough to start.** | Name, price, an image. You can edit anything later. | Add my first product |
| ON-04 | "RFPs" sidebar link | **Buyers come to you here.** | Every RFP shows quantity, deadline, and the buyer. Quote the ones you can deliver. | Continue |
| ON-05 | Profile / company link | **Two minutes well spent.** | Complete your company profile — buyers trust profiles with logos and trade licences. | Finish profile |

End screen (replaces card): *"You're set. Add your first product, and quotes start arriving."*

**Ogilvy notes:**
- Every headline names a specific benefit.
- Body lines are facts, not adjectives.
- Each card promises something deliverable in the next 30 seconds.

---

## 6. The Admin Tour (6 Steps)

| # | Anchor | Headline | Body | CTA |
|---|--------|----------|------|-----|
| ON-01 | Admin sidebar logo | **The whole pipeline from one screen.** | Vendors, products, RFPs, production — top to bottom. | Continue |
| ON-02 | Vendors nav link | **Approve vendors first.** | Nothing else works without an approved vendor in the system. | Show me |
| ON-03 | Products nav link | **Catalogue is shared.** | Vendors add, you curate. Approve, edit specs, set categories. | Continue |
| ON-04 | RFPs nav link + "New RFP" button | **Create RFPs on behalf of buyers.** | Manual or system-generated. Both broadcast to relevant vendors. | Try creating one |
| ON-05 | Production queue (if visible) | **Approved orders flow here.** | Track status from quote to delivery. Update by stage. | Continue |
| ON-06 | Settings / users | **Add your team.** | Managers, production staff. Role-based access already configured. | Finish |

End screen: *"You're ready. Start with vendors — everything else builds on that."*

---

## 7. Implementation Phases

### Phase 1 — Foundation (1 day)
- [ ] Add `onboardingState` to User schema, migrate
- [ ] Create `PATCH /api/me/onboarding` endpoint
- [ ] Build `OnboardingProvider` context
- [ ] Build `AnnotationCard` and `AnnotationLine` components in isolation (Storybook-style page in `/admin/dev/onboarding-preview`)
- [ ] Verify the visual treatment with the user before wiring real flows

### Phase 2 — Vendor tour (½ day)
- [ ] Define `vendorTour.ts` step config
- [ ] Add `data-tour-id` attributes to existing vendor portal elements
- [ ] Wire trigger in vendor layout
- [ ] Persist state on advance

### Phase 3 — Admin tour (½ day)
- [ ] Define `adminTour.ts`
- [ ] Add `data-tour-id` attributes
- [ ] Wire trigger in admin layout

### Phase 4 — Replay + polish (½ day)
- [ ] "Replay tour" entry in user dropdown
- [ ] Reduced-motion handling (no slide animation)
- [ ] Mobile fallback (single full-width card, no anchored line, just sticky bottom)
- [ ] Keyboard support: `Esc` skips, `Enter` advances

### Phase 5 — Verify (½ day)
- [ ] Test with a real freshly-created vendor
- [ ] Test with an admin who has never logged in
- [ ] Verify state persists across reloads mid-tour
- [ ] Verify "skip" behavior

**Total: ~3 days for shippable v1.**

---

## 8. Why this works

- **Fast.** 5–6 steps each. Every step delivers a fact, not a feature description.
- **Distinctive.** Editorial annotation pattern stands out from the generic SaaS tour aesthetic.
- **Replayable.** Users can re-run anytime — removes the fear of "missing it."
- **Honest.** Surface real elements, not synthetic demos. The user is always in the actual portal.
- **Persistent.** Progress saves per step, so partial completion is forgiven.

---

## 9. Open questions to confirm before build

1. Should vendor tour fire on the very first login, or after they complete email verification (if applicable)?
2. Are there specific KPIs (time-to-first-product, time-to-first-quote) we should instrument alongside the tour?
3. Do we want a one-time "What's new" pattern using the same component for future feature releases? (Strong yes — same primitive, low cost.)
4. Mobile: full-screen card with a static screenshot of the target, or skip the tour on mobile entirely?

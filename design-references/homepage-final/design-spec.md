# BiteBlast Homepage Final Design Spec

## Goal
Implement the final BiteBlast homepage design from the Stitch export.

## Source of truth
Primary visual reference:
design-references/homepage-final/screenshots/final-desktop.png

Implementation reference:
design-references/homepage-final/stitch-generated/code.html

## Important
The screenshot is the visual source of truth.
The Stitch HTML is implementation reference only.
Do not blindly paste the Stitch page if it conflicts with the existing BiteBlast app.

## Required hero copy
Headline:
Hits Diff.
Every Time.

Subtitle:
Browse kitchens near you and order in a few taps.

## Visual requirements
- dark premium BiteBlast homepage
- charcoal and deep navy-black gradient background
- compact rounded header
- bold rounded hero typography
- burger visual on the right
- search bar and cuisine filters below hero area
- restaurant card grid below
- premium dark cards
- no white/checkerboard burger background
- no random redesigns

## Protected areas
Do not modify:
- auth logic
- Supabase logic
- customer flow
- vendor flow
- delivery flow
- admin flow
- database schema
- environment variables
- unrelated pages or routes

## Implementation rules
1. Locate the existing homepage route.
2. Replace only the homepage UI.
3. Use the Stitch HTML only to understand layout, spacing, styling, and assets.
4. Preserve the current app architecture.
5. Do not create a second router.
6. Do not create a second app shell.
7. Keep changes scoped to homepage files.
8. Run build after changes.

## Acceptance criteria
- Homepage visually matches final-desktop.png.
- Burger does not show any checkerboard, white box, or rectangular image frame.
- Search section placement matches the screenshot.
- Restaurant cards match the screenshot.
- Existing role-based flows still work.
- Build passes.

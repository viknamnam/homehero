# HeroNest — Avatar Reward Overlay Kit
*(Phase 4 deferred item: accessory/reward unlocks layered on the existing 35 avatars)*

## Why this shape
Avatars render as **256×256 circular images**. Overlays must align to **the circle**, not the face — because 35 avatars have different head heights, hair, and framing, so anything pinned to the head (a crown on the hair) floats or clips on most of them. Three overlay types align perfectly on *every* avatar and give the best reward feel:

1. **Rank frames** — a decorative ring hugging the circle's edge (bronze → silver → gold → rainbow). Earned by streaks/points tiers.
2. **Corner emblems** — a small badge/medal/star/crown sitting in the lower-right of the circle. Earned per achievement.
3. **Celebration bursts** — sparkles/confetti radiating around the circle. Shown on the moment of an unlock.

Head-worn items (crowns, party hats) are included at the end as **optional/cosmetic-only**, with a caveat: placement will be approximate.

## How delivery works (same as your avatar sheets)
- Generate each set as a **labelled sheet**, items in a grid, same warm 3D-illustrated HomeHero style.
- Each item **isolated on a flat pale background** (so I can key it out to transparent) OR on transparent if your tool does it reliably.
- I crop each item, cut it to transparent PNG, and anchor it in code at fixed coordinates over the avatar circle — perfect registration, no per-avatar tweaking.

---

## Prompt A — Rank frames (paste, fill 【】)

Generate a labelled sheet of **8 decorative circular ring frames** for a kids' reward system, in a warm, soft 3D-illustrated style with gentle lighting (matching a friendly family app). Each ring is the DECORATIVE BORDER of a circle only — the centre is empty/transparent so a character portrait shows through. Items, left to right:
1. Bronze ring (simple, warm brown-gold)
2. Silver ring (cool grey, slightly brighter)
3. Gold ring (rich gold, a little shinier)
4. Gold ring with small stars
5. Leafy green vine ring
6. Sky-blue ring with tiny clouds
7. Rainbow ring (soft pastel rainbow)
8. Sparkly celebration ring (gold with sparkles)

Rules:
- Each ring is a perfect circle, same diameter, centred in its tile, viewed straight-on (no perspective).
- The ring is a thin-to-medium decorative border ONLY; the inside is empty (flat pale background or transparent), never filled.
- Consistent thickness and lighting across all eight.
- Soft, rounded, child-friendly — no sharp metal, no aggressive shine.
- Each item isolated on a plain flat pale background; generous even margin; no text inside the art (labels under each tile only).
- 1:1 square tiles.

---

## Prompt B — Corner emblems (paste, fill 【】)

Generate a labelled sheet of **10 small circular reward emblems** in a warm, soft 3D-illustrated HomeHero style, the kind that sit as a little badge in the corner of a profile picture. Each emblem is a small rounded medallion, roughly coin-shaped, clearly readable at tiny size. Items:
1. Gold star
2. Blue ribbon rosette
3. Gold medal (number-free)
4. Tiny crown
5. Green leaf badge (eco/tidy)
6. Chef's hat badge
7. Paw-print badge (pets)
8. Lightning bolt (streak/energy)
9. Heart badge
10. Trophy badge

Rules:
- Each emblem centred in its tile, viewed straight-on, same overall size.
- Bold, simple, high-contrast — must read clearly when shrunk to ~70px.
- Soft rounded shapes, gentle 3D shading, friendly — never sharp or corporate.
- Each isolated on a plain flat pale background; even margin; no text inside the art.
- 1:1 square tiles.

---

## Prompt C — Celebration bursts (paste, fill 【】)

Generate a labelled sheet of **4 circular celebration burst overlays** in a warm, soft HomeHero style. Each is a ring of small festive elements arranged AROUND the edge of an empty circle (the centre stays empty/transparent so a portrait shows through). Variants:
1. Gold sparkles and stars
2. Pastel confetti pieces
3. Hearts floating up
4. Mixed party burst (sparkles + confetti + a couple of stars)

Rules:
- Elements sit only around the OUTER edge / just outside a central empty circle; the middle is completely empty.
- Light, airy, celebratory — not dense or cluttered.
- Soft pastel + gold palette, matching a gentle family app.
- Each isolated on a plain flat pale background; no text inside the art.
- 1:1 square tiles.

---

## Prompt D — OPTIONAL head accessories (caveat: approximate placement)

*Only generate if you want cosmetic head items and accept they'll sit approximately, not perfectly, across different avatars.*

Generate a labelled sheet of **6 head accessories** in the warm 3D HomeHero style, each drawn as it would sit on the TOP of a child character's head, viewed straight-on, on a flat pale background with the rest of the character absent (just the accessory): 1. Small gold crown, 2. Party hat, 3. Flower crown, 4. Winter bobble hat, 5. Superhero mask (eye band), 6. Wizard hat. Same lighting and scale; isolated; no text in the art.

---

## What I do with them
- Crop each item, cut to transparent PNG, store under `app/assets/rewards/`.
- Frames overlay the 256 circle exactly; emblems anchor at a fixed lower-right point; bursts overlay full-bleed; head items anchor top-centre (approximate).
- Wire unlock rules to what already exists: streak tiers → frames, badges earned → matching emblem, an unlock moment → a burst. All inside Kids Mode's existing reward loop; adults can optionally use a frame too.

Start with **A and B** — frames + emblems give the most reward feel for the least art. C is a nice-to-have; D only if you want cosmetics.

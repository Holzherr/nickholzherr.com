# Maths Castle art style: watercolour

Everything in the game looks hand-painted in children's-book watercolour: loose washes with darker drying edges, glazes for shading, loose pencil outlines, paper grain. Nick chose this on 3 Oct 2026. New screens, art and UI must match it.

## Where it lives

- `js/paint.js` — the filters (`wash`, `pencil`, `grain`), the painted UI surfaces, scene caching (`registerScene`, `hydrate`, `prepaint`) and `watercolourise()`, which turns flat SVG art into a painting.
- `js/castle-paint.js` — the castle, painted layer by layer. Window boxes and label positions (`WINDOWS`) are shared with `art.js`.
- `js/art.js` — castle overlay (tappable windows, peeks, labels), rooms, Rosie, coins, stars.
- `styles.css` — the "watercolour skin" block at the end.

## Rules for new work

**Big scenes** (full-screen backgrounds, new rooms): draw them as flat SVG like `ROOM_ART`, and `roomSVG` paints them via `watercolourise()`. Add `class="twinkle"` (or another animated class) to anything that must stay animated: it goes in a live layer on top. Never put live SVG filters on a full-screen scene. Paint it into a cached image with `registerScene` + `<image data-paint>` + `hydrate()`.

**Castle changes**: edit the layers in `castle-paint.js`. Use one wash per colour (`F`), glazes (`role: 'glaze'`, multiply) for shading, `K` to keep paper white under anything that must not mix with what's behind it, and pencil lines (`Ln`) for outlines. Anything tappable or animated goes in the overlay in `art.js`.

**Small sprites** (characters, icons ≤ ~150px): wrap the art in `<g filter="url(#wc-sprite)">`, or `#wc-small` for 40-unit icons like coins.

**Emoji**: add the element to the `filter:url(#wc-emoji)` list at the end of `styles.css`.

**UI**: backgrounds come from painted surfaces, `background: var(--wc-<colour>) var(--paint)`. The colours are `card blush pink gold goldlight green mint grape blue wood berry`, with a `-round` variant of each for circles. Screen backgrounds use `var(--wc-sky)` or `var(--wc-blossom)`. No box-shadows or border-radius on painted surfaces: the paint edge does that job. A press is `transform: translateY(3px) scale(.97)`.

**Readability**: numbers, questions and answers keep the solid Fredoka type in grape ink on a light surface. A 5-year-old must read them at a glance.

**Caching**: painted scenes are cached on the device under a key that includes `VERSION` in `paint.js`. Bump `VERSION` whenever painted art changes, or devices keep showing the old picture. Also bump the `?v=` query on every import and in `index.html`, as usual.

## Palette

Paper `#fbf6ec` · pencil `#5a4462` · walls `#f6c7d9` · pink roof `#f0679a` · purple roof `#a283e0` · window glow `#ffd35c` · locked window `#8d6fa8` · sky `#9fcbee` / `#cbb7ec` / `#f7bdd2` · grass `#87c98c` · path `#f2d2a0`.

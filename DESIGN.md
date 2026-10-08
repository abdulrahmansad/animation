# MOTION/01 — Design System Notes

## Creative thesis

The page is not a portfolio template with animation added afterward. The page itself is the artifact. Motion communicates hierarchy, state, depth, and feedback.

## Applied disciplines

- Creative direction: one visual thesis, restrained palette, oversized kinetic type, deliberate contrast.
- UI/UX: clear section hierarchy, consistent interaction language, readable motion, semantic landmarks.
- Motion design: anticipation, stagger, inertia, spring following, parallax, transform-only interaction where possible.
- Front-end engineering: browser-native Canvas, Pointer Events, IntersectionObserver, requestAnimationFrame, responsive CSS.
- Accessibility: keyboard-safe links/buttons, semantic HTML, reduced-motion path, touch/coarse-pointer fallbacks, visible content without animation.
- Performance: no video backgrounds, no animation framework, capped canvas DPR and particle counts, passive scroll listeners.
- Testing: JavaScript syntax check plus a zero-dependency static audit for duplicate IDs, broken local references, labels, landmarks, CSS balance, and reduced-motion coverage.

## Interaction map

1. Boot screen introduces timing and establishes the acid/black palette.
2. Hero typography separates into foreground/ghost layers based on scroll.
3. Cursor field reacts physically to pointer position.
4. Magnetic controls add local feedback without hijacking layout.
5. Principle cards use restrained depth tilt.
6. System rows reveal live mini-previews on hover.
7. Motion Lab exposes the underlying spring/inertia idea as a draggable toy.
8. Finale collapses the experience back into a single replay action.

## Palette

- Carbon: `#070707`
- Paper: `#f1efe7`
- Signal acid: `#c7ff2f`

The acid color is intentionally used as a signal rather than general decoration.

## Local preview

Any static server works. From the repository root, for example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Quality check

```bash
node --check script.js
python scripts/quality_check.py
```

GitHub Actions runs the same checks on pushes and pull requests.

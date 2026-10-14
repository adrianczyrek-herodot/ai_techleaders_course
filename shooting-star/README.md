# Shooting star background

A decorative shooting star for the new-task screen ("What should the agent work on?"), issue #1.

- One star with a fading tail flies diagonally (top right → bottom left) for ~1 s, once every 10 s.
- The cadence is pure CSS (`animation: 10s infinite`); there are no JS timers.
- The layer has `pointer-events: none` and is inserted as the first child of the container, so the card on top keeps all input.
- `prefers-reduced-motion: reduce` turns the animation off.

## Usage

```html
<link rel="stylesheet" href="shooting-star.css">
<script type="module">
  import { mountShootingStar } from './shooting-star.js';
  // The container must be positioned; content above it needs position + z-index >= 1.
  const unmount = mountShootingStar(backgroundContainer);
  // When leaving the screen:
  unmount();
</script>
```

`mountShootingStar` picks a random start point on every `animationiteration`, while the star is invisible. `unmount()` removes the layer and that listener, so nothing keeps running.

## Check it

- `npm test` runs the unit tests.
- To see it in a browser, run `python3 -m http.server` inside `shooting-star/` and open `/demo.html`. ES modules won't load from `file://`.

This repo doesn't contain the cockpit screen itself. Copy these two files into the cockpit and call `mountShootingStar` from the screen's mount/unmount hooks.

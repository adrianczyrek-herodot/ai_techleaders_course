// Mounts the shooting-star layer (see shooting-star.css) into a background
// container. The 10 s cadence is driven entirely by CSS; JS only picks a new
// random start point at each cycle boundary, when the star is invisible.
// No timers are created, so unmounting leaves nothing running.

export const LAYER_CLASS = 'shooting-star-layer';
export const STAR_CLASS = 'shooting-star';

// Start points stay in the upper-right area so the star crosses the screen.
const TOP_RANGE = [5, 35]; // % of container height
const LEFT_RANGE = [55, 95]; // % of container width

function pick([min, max], random) {
  return `${(min + random() * (max - min)).toFixed(1)}%`;
}

function randomizeStart(star, random) {
  star.style.setProperty('--shooting-star-top', pick(TOP_RANGE, random));
  star.style.setProperty('--shooting-star-left', pick(LEFT_RANGE, random));
}

/**
 * Inserts the shooting-star layer as the first child of `container`, so any
 * positioned content after it (e.g. the task card) paints on top.
 * `container` should be positioned (relative/absolute/fixed).
 *
 * @param {HTMLElement} container
 * @param {{ random?: () => number }} [options]
 * @returns {() => void} unmount: removes the layer and its listener
 */
export function mountShootingStar(container, { random = Math.random } = {}) {
  const doc = container.ownerDocument;
  const layer = doc.createElement('div');
  layer.className = LAYER_CLASS;
  layer.setAttribute('aria-hidden', 'true');

  const star = doc.createElement('span');
  star.className = STAR_CLASS;
  layer.appendChild(star);

  randomizeStart(star, random);
  const onIteration = () => randomizeStart(star, random);
  star.addEventListener('animationiteration', onIteration);

  container.insertBefore(layer, container.firstChild);

  return function unmount() {
    star.removeEventListener('animationiteration', onIteration);
    layer.remove();
  };
}

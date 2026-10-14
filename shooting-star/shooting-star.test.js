import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountShootingStar, LAYER_CLASS, STAR_CLASS } from './shooting-star.js';

const css = readFileSync(new URL('./shooting-star.css', import.meta.url), 'utf8');

function rule(selector, source = css) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `missing rule ${selector}`);
  return match[1];
}

// Minimal DOM stand-in: just enough for mountShootingStar.
class FakeElement {
  constructor(doc, tag) {
    this.ownerDocument = doc;
    this.tagName = tag;
    this.children = [];
    this.parent = null;
    this.attributes = {};
    this.listeners = {};
    const props = {};
    this.style = { setProperty: (k, v) => { props[k] = v; }, props };
  }
  get firstChild() { return this.children[0] ?? null; }
  setAttribute(k, v) { this.attributes[k] = v; }
  appendChild(child) { return this.insertBefore(child, null); }
  insertBefore(child, ref) {
    child.parent = this;
    const i = ref ? this.children.indexOf(ref) : this.children.length;
    this.children.splice(i, 0, child);
    return child;
  }
  remove() {
    if (!this.parent) return;
    this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
  }
  addEventListener(type, fn) { (this.listeners[type] ??= new Set()).add(fn); }
  removeEventListener(type, fn) { this.listeners[type]?.delete(fn); }
  dispatch(type) { for (const fn of this.listeners[type] ?? []) fn(); }
}

function setup() {
  const doc = { createElement: (tag) => new FakeElement(doc, tag) };
  const container = new FakeElement(doc, 'div');
  const card = container.appendChild(new FakeElement(doc, 'main'));
  return { container, card };
}

test('layer never captures clicks and sits under the content', () => {
  const layer = rule(`.${LAYER_CLASS}`);
  assert.match(layer, /pointer-events:\s*none/);
  assert.match(layer, /position:\s*absolute/);
  assert.match(layer, /z-index:\s*0/);
  assert.match(rule(`.${STAR_CLASS}`), /pointer-events:\s*none/);
});

test('star repeats every 10 s and flies for about 1 s', () => {
  assert.match(rule(`.${STAR_CLASS}`), /animation:\s*shooting-star-fly 10s linear infinite/);
  const keyframes = css.slice(css.indexOf('@keyframes shooting-star-fly'));
  // Invisible from 10% (1 s into the cycle) until the end.
  assert.match(keyframes, /10%\s*\{\s*opacity:\s*0;/);
  assert.match(keyframes, /100%\s*\{\s*opacity:\s*0;/);
});

test('animation is disabled for prefers-reduced-motion', () => {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.ok(start >= 0);
  assert.match(rule(`.${STAR_CLASS}`, css.slice(start)), /animation:\s*none/);
});

test('mount inserts an aria-hidden layer before the card', () => {
  const { container, card } = setup();
  mountShootingStar(container, { random: () => 0.5 });
  const [layer, second] = container.children;
  assert.equal(layer.className, LAYER_CLASS);
  assert.equal(layer.attributes['aria-hidden'], 'true');
  assert.equal(second, card);
  const star = layer.children[0];
  assert.equal(star.className, STAR_CLASS);
  assert.equal(star.style.props['--shooting-star-top'], '20.0%');
  assert.equal(star.style.props['--shooting-star-left'], '75.0%');
});

test('start point is re-randomised on each animation cycle', () => {
  const { container } = setup();
  const values = [0, 0, 1, 1];
  mountShootingStar(container, { random: () => values.shift() });
  const star = container.children[0].children[0];
  assert.equal(star.style.props['--shooting-star-top'], '5.0%');
  star.dispatch('animationiteration');
  assert.equal(star.style.props['--shooting-star-top'], '35.0%');
  assert.equal(star.style.props['--shooting-star-left'], '95.0%');
});

test('unmount removes the layer and its listener', () => {
  const { container, card } = setup();
  const unmount = mountShootingStar(container);
  const star = container.children[0].children[0];
  unmount();
  assert.deepEqual(container.children, [card]);
  assert.equal(star.listeners.animationiteration.size, 0);
});

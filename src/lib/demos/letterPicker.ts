/**
 * One focusable item per letter, laid over a canvas inside `list`, which the shell gives the
 * listbox role and a name. Pointing at an item, tapping it, or focusing it picks its letter. The
 * arrow keys in `keys`, Home, and End move focus, so the list is one stop in the tab order. The
 * scene places the items.
 */
export function letterPicker(
  list: HTMLElement,
  options: {
    count: number;
    picked: number | null;
    keys: readonly [back: string, forward: string];
    pick: (index: number) => void;
    signal: AbortSignal;
  },
) {
  const { count, keys, pick, signal } = options;
  const items = Array.from({ length: count }, (_, i) => {
    const item = document.createElement('div');
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(i === options.picked));
    item.tabIndex = -1;
    item.dataset.index = String(i);
    item.className = 'absolute';
    return item;
  });
  list.replaceChildren(...items);
  let current = options.picked ?? count - 1;
  items[current].tabIndex = 0;

  const choose = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement) || !target.dataset.index) return;
    const index = Number(target.dataset.index);
    items[current].tabIndex = -1;
    items[current].setAttribute('aria-selected', 'false');
    current = index;
    items[current].tabIndex = 0;
    items[current].setAttribute('aria-selected', 'true');
    pick(index);
  };
  const on = { signal };
  list.addEventListener('pointerover', (event) => choose(event.target), on);
  list.addEventListener('pointerdown', (event) => choose(event.target), on);
  list.addEventListener('focusin', (event) => choose(event.target), on);
  list.addEventListener(
    'keydown',
    (event) => {
      const moves: Record<string, number> = {
        [keys[0]]: current - 1,
        [keys[1]]: current + 1,
        Home: 0,
        End: count - 1,
      };
      const next = moves[event.key];
      if (next === undefined) return;
      event.preventDefault();
      items[Math.min(count - 1, Math.max(0, next))].focus();
    },
    on,
  );
  return items;
}

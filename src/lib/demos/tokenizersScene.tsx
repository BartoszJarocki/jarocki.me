import { pieceClass, unknownNote } from '../../components/demos/Tokenizers';
import { type Piece, cutThreeWays, cuts } from '../ml/tokenizers';
import { defineScene } from './stage';
import { menus } from './tokenizerMenus';

function chip({ text, known }: Piece) {
  const element = document.createElement('span');
  element.className = pieceClass(known);
  element.textContent = text;
  if (!known) {
    const note = document.createElement('span');
    note.className = 'sr-only';
    note.textContent = unknownNote;
    element.append(note);
  }
  return element;
}

export default defineScene({
  parts: { sentence: 'input', letters: 'div', words: 'div', pieces: 'div' },
  mount(stage, p) {
    const write = () => {
      const cut = cutThreeWays(p.sentence.value, menus);
      for (const name of cuts) {
        const row = p[name];
        row.querySelector('[data-count]')!.textContent = String(cut[name].pieces.length);
        row.querySelector('[data-menu]')!.textContent = String(cut[name].menu);
        row.querySelector('[data-pieces]')!.replaceChildren(...cut[name].pieces.map(chip));
      }
    };
    p.sentence.addEventListener('input', write, { signal: stage.signal });
    write();
    return () => {};
  },
});

export function Still() {
  return null;
}

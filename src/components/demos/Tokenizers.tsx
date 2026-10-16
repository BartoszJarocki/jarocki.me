import { example, sentence } from '../../lib/demos/tokenizerExample';
import { type Cut, type Piece, pieceWord } from '../../lib/ml/tokenizers';
import { type DemoProps, DemoStage } from './DemoStage';

const scene = () => import('../../lib/demos/tokenizersScene');

export const pieceClass = (known: boolean) =>
  known
    ? 'border border-rule px-[0.5ch] leading-[22px]'
    : 'border border-dashed border-faint px-[0.5ch] leading-[22px] text-faint';
export const unknownNote = ' not on the menu';

function PieceChip({ text, known }: Piece) {
  return (
    <span className={pieceClass(known)}>
      {text}
      {!known && <span className="sr-only">{unknownNote}</span>}
    </span>
  );
}

function CutRow({ name, cut, row }: { name: string; cut: Cut; row: (el: HTMLDivElement) => void }) {
  return (
    <div ref={row} className="mt-[14px]">
      <div className="flex justify-between gap-x-[2ch]">
        <span>{name}</span>
        <span className="text-faint">
          <span data-count className="text-ink">
            {cut.pieces.length}
          </span>{' '}
          <span data-word>{pieceWord(cut.pieces.length)}</span> · menu{' '}
          <span data-menu className="text-ink">
            {cut.menu}
          </span>
        </span>
      </div>
      <div data-pieces className="mt-[4px] flex flex-wrap gap-[4px] [overflow-wrap:anywhere]">
        {cut.pieces.map((piece, index) => (
          <PieceChip key={index} {...piece} />
        ))}
      </div>
    </div>
  );
}

export default function Tokenizers(props: DemoProps) {
  return (
    <DemoStage
      {...props}
      scene={scene}
      render={(part) => ({
        body: (
          <>
            <label className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-[2ch] [@media(scripting:none)]:hidden">
              <span className="text-faint">Your sentence</span>
              <input
                ref={part('sentence')}
                type="text"
                defaultValue={sentence}
                maxLength={120}
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 border-b border-faint bg-transparent py-[2px] lowercase text-ink"
              />
            </label>
            <CutRow name="Letters" cut={example.letters} row={part('letters')} />
            <CutRow name="Words" cut={example.words} row={part('words')} />
            <CutRow name="Pieces" cut={example.pieces} row={part('pieces')} />
            <div className="mt-[14px] text-faint">A dashed piece is not on its menu.</div>
          </>
        ),
        caption: null,
        controls: null,
      })}
    />
  );
}

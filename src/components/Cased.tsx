import { caseRuns } from '../lib/lowercase';

export function Cased({ children }: { children: string }) {
  return (
    <>
      {caseRuns(children).map((run, i) =>
        run.keep ? (
          <span key={i} className="normal-case">
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </>
  );
}

import { useId, useState } from 'react';

import type { DemoProps } from './DemoStage';

const notebooks = [
  { token: 't', before: [1, 2, 3], attention: [0.5, -0.5, 1], network: [-1, 0.5, 0] },
  { token: 'o', before: [2, 0, -1], attention: [-0.5, 1, 0.5], network: [0, -0.5, 1] },
  { token: 'space', before: [0, 1, -2], attention: [1, 0.5, -0.5], network: [0.5, -1, 0] },
];

const steps = [
  'Start with one notebook per token. The diagram uses made-up numbers.',
  'Attention reads leveled copies. The original notebooks stay on the straight path.',
  'Attention adds its changes. The first notebook changes from 1, 2, 3 to 1.5, 1.5, 4.',
  'The small network reads leveled copies of the updated notebooks.',
  'The small network adds its changes. The first notebook is now 0.5, 2, 4. Two additions complete the block.',
];

export default function ResidualStream({ label, children }: DemoProps) {
  const [step, setStep] = useState(0);
  const id = useId();
  const rows = [
    { y: 40, label: 'notebooks in', writes: 0 },
    { y: 330, label: 'after attention adds', writes: 2 },
    { y: 620, label: 'notebooks now', writes: step >= 4 ? 4 : step >= 2 ? 2 : 0 },
  ];
  return (
    <div className="demo" role="figure" aria-label={label} aria-describedby={id}>
      <div className="demo-stage aspect-[360/765] w-full max-w-[480px] [content-visibility:auto]">
        <svg
          viewBox="0 0 360 765"
          className="w-full text-ink"
          role="img"
          aria-label="Two additions to three token notebooks. The straight path keeps the old numbers."
        >
          {[0, 1].map((block) => {
            const y = 160 + block * 290;
            const active = step === 1 + block * 2 || step === 2 + block * 2;
            return (
              <g key={block} fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1}>
                <path d={`M 30 ${y - 15} V ${y + 110} H 180 M 180 ${y - 15} V ${y + 2}`} />
                <rect x="70" y={y + 2} width="260" height="35" />
                <path d={`M 180 ${y + 37} V ${y + 51}`} />
                <rect
                  x="70"
                  y={y + 51}
                  width="260"
                  height="35"
                  fill={active ? 'var(--wash)' : 'var(--bg)'}
                />
                <path d={`M 180 ${y + 86} V ${y + 100} M 180 ${y + 120} V ${y + 130}`} />
                <rect x="170" y={y + 100} width="20" height="20" fill="var(--bg)" />
                <g fill="currentColor" stroke="none" textAnchor="middle" fontSize="13">
                  <text x="200" y={y + 25}>
                    leveled copies
                  </text>
                  <text x="200" y={y + 74}>
                    {block === 0 ? 'attention' : 'small network'}
                  </text>
                  <text x="180" y={y + 115}>
                    +
                  </text>
                  <text x="16" y={y + 60} transform={`rotate(-90 16 ${y + 60})`}>
                    keep originals
                  </text>
                </g>
              </g>
            );
          })}
          {rows.map(({ y, label: rowLabel, writes }) => (
            <g key={rowLabel} fill="currentColor" textAnchor="middle" fontSize="14">
              <text x="180" y={y - 20}>
                {rowLabel}
              </text>
              {notebooks.map((notebook, column) => {
                const x = 87 + column * 100;
                return (
                  <g key={notebook.token}>
                    <rect
                      x={x - 35}
                      y={y - 8}
                      width="70"
                      height="112"
                      fill={step === writes ? 'var(--wash)' : 'var(--bg)'}
                      stroke="currentColor"
                      strokeWidth={step === writes ? 2 : 1}
                    />
                    <text x={x} y={y + 12}>
                      {notebook.token}
                    </text>
                    {notebook.before.map((value, dimension) => (
                      <text key={dimension} x={x} y={y + 39 + dimension * 24}>
                        {(
                          value +
                          (writes >= 2 ? notebook.attention[dimension] : 0) +
                          (writes >= 4 ? notebook.network[dimension] : 0)
                        ).toFixed(1)}
                      </text>
                    ))}
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
      <div className="demo-caption" role="status" aria-live="polite" aria-atomic="true">
        Step {step + 1} of {steps.length}. {steps[step]}
      </div>
      <div className="demo-controls">
        <div className="demo-actions">
          <button
            className="demo-button"
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            className="demo-button"
            type="button"
            onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
            disabled={step === steps.length - 1}
          >
            Step
          </button>
          <button className="demo-button" type="button" onClick={() => setStep(0)}>
            Reset
          </button>
        </div>
      </div>
      <div id={id} className="demo-description">
        {children}
      </div>
    </div>
  );
}

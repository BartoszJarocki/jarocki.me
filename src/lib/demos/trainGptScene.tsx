import { gpt, readCheckpoint, shakespeare } from '../ml/gpt';
import { recording } from './gptRecording';
import { css, defineScene } from './stage';
import { type Evaluation, type Trainer, openTrainer } from './trainer';

let checkpoint: ReturnType<typeof readCheckpoint> | null = null;

const points = (
  values: readonly { step: number; training: number; validation: number }[],
  width: number,
  height: number,
) => {
  const end = Math.max(900, ...values.map((p) => p.step));
  const x = (step: number) => 38 + (step / end) * (width - 54);
  const y = (loss: number) => 16 + ((4 - loss) / 2.5) * (height - 46);
  return { end, x, y };
};

export default defineScene({
  parts: {
    chart: 'canvas',
    samples: 'div',
    step: 'span',
    practice: 'span',
    exam: 'span',
    status: 'span',
    announcement: 'span',
    train: 'button',
    pause: 'button',
    load: 'button',
  },
  async mount(stage, p) {
    let history: Evaluation[] = [];
    let trainer: Trainer | null = null;
    let done = false;
    let loading = false;
    let announcedAt = -Infinity;
    let announcement = '';
    let timer: ReturnType<typeof setTimeout> | null = null;
    const announce = () => {
      timer = null;
      if (p.announcement.textContent === announcement) return;
      p.announcement.textContent = announcement;
      announcedAt = performance.now();
    };
    stage.defer(() => {
      if (timer !== null) clearTimeout(timer);
    });
    const label = () => {
      p.train.textContent = done ? 'Train again' : 'Train';
      p.train.disabled = loading;
      p.pause.disabled = loading;
      p.load.disabled = loading;
    };
    trainer = await openTrainer(stage, 'gpt', {
      progress({ step, replaced, evaluation, running, done: finished, timing }) {
        done = finished;
        p.step.textContent = step.toLocaleString('en-US');
        p.status.textContent = loading
          ? 'Loading saved knobs'
          : running
            ? 'Training'
            : done
              ? 'Training complete'
              : 'Paused';
        Object.assign(p.chart.dataset, {
          step,
          running,
          trainingMs: timing.ms,
          trainingSteps: timing.steps,
        });
        if (replaced) history = [];
        if (evaluation && history.at(-1)?.step !== evaluation.step) {
          history.push(evaluation);
          p.practice.textContent = evaluation.training.toFixed(3);
          p.exam.textContent = evaluation.validation.toFixed(3);
          Object.assign(p.chart.dataset, {
            exam: evaluation.validation,
            wordShare: evaluation.wordShare,
          });
          p.samples.replaceChildren(
            ...history
              .slice(-5)
              .reverse()
              .map((sample) => {
                const entry = document.createElement('div');
                entry.className = 'mb-4';
                const title = document.createElement('div');
                title.className = 'text-faint';
                title.textContent = `step ${sample.step.toLocaleString('en-US')}`;
                const text = document.createElement('div');
                text.textContent = sample.text;
                entry.append(title, text);
                return entry;
              }),
          );
        }
        announcement = `Step ${step.toLocaleString('en-US')}. ${p.status.textContent}.`;
        if (evaluation)
          announcement += ` Practice loss ${evaluation.training.toFixed(3)}. Exam loss ${evaluation.validation.toFixed(3)}.`;
        if (timer === null) {
          const wait = Math.max(0, 5000 - (performance.now() - announcedAt));
          if (wait === 0) announce();
          else timer = setTimeout(announce, wait);
        }
        label();
        stage.wake();
      },
    });
    const run = trainer;
    const on = { signal: stage.signal };
    p.train.addEventListener(
      'click',
      () => {
        if (done) run.reset();
        run.train();
      },
      on,
    );
    p.pause.addEventListener('click', () => run.pause(), on);
    p.load.addEventListener(
      'click',
      async () => {
        loading = true;
        run.pause();
        label();
        p.status.textContent = 'Loading saved knobs';
        try {
          checkpoint ??= readCheckpoint((path) => fetch(path)).catch((error) => {
            checkpoint = null;
            throw error;
          });
          const file = await checkpoint;
          if (!stage.signal.aborted) run.load(file, shakespeare.symbols, gpt.until);
        } catch (error) {
          stage.fail(error);
        } finally {
          loading = false;
          label();
        }
      },
      on,
    );
    label();
    return () => {
      const ctx = stage.canvas(p.chart);
      const { width, height } = ctx;
      const { x, y, end } = points(history, width, height);
      ctx.fillStyle = css(stage.tokens.bg);
      ctx.fillRect(0, 0, width, height);
      ctx.font = stage.font(11);
      ctx.fillStyle = css(stage.tokens.faint);
      ctx.textAlign = 'right';
      for (const loss of [2, 3, 4]) ctx.fillText(String(loss), 26, y(loss) + 4);
      ctx.textAlign = 'left';
      ctx.fillText('loss', 0, 10);
      ctx.fillText('0', x(0), height - 8);
      ctx.textAlign = 'right';
      ctx.fillText(`${end.toLocaleString('en-US')} steps`, x(end), height - 8);
      ctx.fillStyle = css(stage.tokens.rule);
      ctx.fillRect(38, height - 26, width - 54, 1);
      for (const field of ['training', 'validation'] as const) {
        ctx.strokeStyle = css(field === 'training' ? stage.tokens.ink : stage.tokens.faint);
        ctx.lineWidth = 1;
        ctx.beginPath();
        history.forEach((point, i) => {
          if (i) ctx.lineTo(x(point.step), y(point[field]));
          else ctx.moveTo(x(point.step), y(point[field]));
        });
        ctx.stroke();
        for (const point of history) {
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillRect(x(point.step) - 1, y(point[field]) - 1, 2, 2);
        }
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = css(stage.tokens.ink);
      ctx.fillText('practice', 50, 20);
      ctx.fillStyle = css(stage.tokens.faint);
      ctx.fillText('exam', 130, 20);
    };
  },
});

export function Still() {
  const { x, y, end } = points(recording, 320, 220);
  return (
    <div className="demo-still overflow-hidden bg-bg">
      <svg viewBox="0 0 320 220" className="h-[220px] w-full" aria-hidden="true">
        <text x="8" y="12" className="fill-faint" fontSize="10">
          recorded training · loss
        </text>
        {[2, 3].map((loss) => (
          <text key={loss} x="12" y={y(loss)} className="fill-faint" fontSize="10">
            {loss}
          </text>
        ))}
        <text x="38" y="210" className="fill-faint" fontSize="10">
          0
        </text>
        <text x="304" y="210" textAnchor="end" className="fill-faint" fontSize="10">
          {end} steps
        </text>
        {(['training', 'validation'] as const).map((field) => (
          <path
            key={field}
            d={recording.map((p, i) => `${i ? 'L' : 'M'}${x(p.step)} ${y(p[field])}`).join(' ')}
            fill="none"
            className={field === 'training' ? 'stroke-ink' : 'stroke-faint'}
            strokeWidth="1"
          />
        ))}
        <text x="50" y="32" className="fill-ink" fontSize="10">
          practice
        </text>
        <text x="130" y="32" className="fill-faint" fontSize="10">
          exam
        </text>
      </svg>
      <div className="h-[280px] overflow-auto whitespace-pre-wrap px-2 text-[12px] text-body">
        {recording
          .slice(-3)
          .reverse()
          .map((sample) => (
            <div key={sample.step} className="mb-4">
              <div className="text-faint">Recorded step {sample.step}</div>
              {sample.text}
            </div>
          ))}
      </div>
    </div>
  );
}

'use client';

import { ComponentProps, useEffect, useId, useRef, useState } from 'react';

import { runSnippet, workerPrelude } from '../lib/snippetRunner';

type Props = ComponentProps<'pre'> & { 'data-source'?: string; 'data-snippet'?: string };

export function CodeBlock({ 'data-source': raw, 'data-snippet': name, children, ...props }: Props) {
  const [source, setSource] = useState(raw ?? '');
  const [editing, setEditing] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const cancel = useRef<() => void>();
  const editor = useRef<HTMLTextAreaElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const outputId = useId();
  useEffect(() => () => cancel.current?.(), []);
  useEffect(() => {
    if (editing) editor.current?.focus();
  }, [editing]);

  if (raw === undefined) return <pre {...props}>{children}</pre>;

  function run() {
    cancel.current?.();
    setLines([]);
    setStatus('running');
    const url = URL.createObjectURL(new Blob([workerPrelude], { type: 'text/javascript' }));
    try {
      const worker = new Worker(url);
      cancel.current = runSnippet(
        {
          listen(message, error) {
            worker.onmessage = (event: MessageEvent<unknown>) => message(event.data);
            worker.onerror = (event) => {
              event.preventDefault();
              error(event.message);
            };
          },
          postMessage: (source) => worker.postMessage(source),
          terminate: () => worker.terminate(),
        },
        source,
        (update) => {
          if (update.kind === 'line') setLines((previous) => [...previous, update.text]);
          else setStatus('done');
        },
      );
    } catch (error) {
      setLines([`Error: ${error instanceof Error ? error.message : String(error)}`]);
      setStatus('done');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function reset() {
    cancel.current?.();
    setSource(raw ?? '');
    setEditing(false);
    setLines([]);
    setStatus('idle');
    editButton.current?.focus();
  }

  return (
    <div className="snippet" data-snippet={name}>
      {editing ? (
        <textarea
          ref={editor}
          aria-label="Snippet source"
          className="snippet-editor"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          rows={source.split('\n').length}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="soft"
        />
      ) : (
        <pre {...props} tabIndex={0} aria-label="Code snippet">
          {source === raw ? children : <code>{source}</code>}
        </pre>
      )}
      <div className="snippet-controls">
        <button
          className="demo-button"
          onClick={run}
          disabled={status === 'running'}
          aria-controls={outputId}
        >
          {status === 'running' ? 'Running…' : 'Run'}
        </button>
        <button
          ref={editButton}
          className="demo-button"
          onClick={() => setEditing(!editing)}
          aria-pressed={editing}
        >
          Edit
        </button>
        {source !== raw && (
          <button className="demo-button" onClick={reset}>
            Reset
          </button>
        )}
      </div>
      <div
        id={outputId}
        role="log"
        aria-label="Snippet output"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {lines.length > 0 && (
          <pre className="snippet-output" tabIndex={0}>
            {lines.join('\n')}
          </pre>
        )}
        {status === 'done' && lines.length === 0 && (
          <pre className="snippet-output">Finished without output.</pre>
        )}
      </div>
    </div>
  );
}

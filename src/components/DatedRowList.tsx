import React from 'react';

export type DatedRow = {
  key: string;
  date: React.ReactNode;
  content: React.ReactNode;
};

type Props = {
  items: DatedRow[];
  className?: string;
};

export function DatedRowList({ items, className = '' }: Props) {
  return (
    <ol
      className={`sm:grid sm:grid-cols-[max-content_1fr] sm:items-baseline sm:gap-x-6 sm:gap-y-3 ${className}`}
    >
      {items.map((item) => (
        <li
          key={item.key}
          className="grid grid-cols-1 gap-y-1 py-1.5 sm:contents"
        >
          <time className="ds-mono-date">{item.date}</time>
          <div>{item.content}</div>
        </li>
      ))}
    </ol>
  );
}

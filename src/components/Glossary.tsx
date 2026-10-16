import type { ReactNode } from 'react';

import { IndexList, IndexRow, IndexSection } from './Index';

const unprose = 'not-prose font-mono text-[14px] leading-[1.72]';

export function Glossary({ children }: { children: ReactNode }) {
  return (
    <div className={unprose}>
      <IndexSection label="words from this note">
        <IndexList lead="19ch" leadMobile="15ch">
          {children}
        </IndexList>
      </IndexSection>
    </div>
  );
}

export function Term({ name, children }: { name: string; children: ReactNode }) {
  if (!(name && children)) throw new Error('A term needs a name and a meaning');
  return <IndexRow lead={name} leadTone="ink" main={children} mainTone="body" />;
}

import type { ReactNode } from 'react';

import { IndexList, IndexRow, IndexSection } from './Index';

const unprose =
  'font-mono text-[14px] leading-[1.72] [&_h2]:-mx-[1ch] [&_h2]:my-0 [&_h2]:text-[length:inherit] [&_h2]:font-normal [&_h2]:leading-[inherit] [&_h2]:tracking-normal [&_h2]:text-faint [&_li]:m-0 [&_li]:p-0 [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0';

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

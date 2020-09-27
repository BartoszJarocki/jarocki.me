import React from 'react';

import { Title } from './title';
import { ExternalLink } from './external-link';

export const Header: React.FC = () => {
  return (
    <header>
      <Title>Hey, I’m Bartosz Jarocki</Title>
      <p className="text-base text-gray-700">
        For over decade I work as a software developer. These days I mostly work with full stack
        JavaScript applications. I especially enjoy working with React and creating great user
        experiences. This is my personal piece of the internet. If you have any questions or just
        want to say hi -{' '}
        <ExternalLink
          className="underline"
          href="https://twitter.com/messages/compose?recipient_id=512460212"
        >
          DM me on Twitter
        </ExternalLink>{' '}
        or just{' '}
        <ExternalLink className="underline" href="mailto:bartosz.jarocki@icloud.com">
          email me.
        </ExternalLink>
      </p>
    </header>
  );
};

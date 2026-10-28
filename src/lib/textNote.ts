import type { Nodes, Root, RootContent } from 'mdast';

import { SiteUrl } from '../data/bio.ts';
import { factor, predict, show, start } from './demos/taxiFares.ts';
import {
  type Block,
  type Row,
  type Run,
  type TableRow,
  type Tone,
  literal,
  lowered,
} from './textPage.ts';

type Jsx = Extract<Nodes, { type: 'mdxJsxFlowElement' | 'mdxJsxTextElement' }>;

const comment = /^\s*\/\*[\s\S]*\*\/\s*$/;

export function noteBlocks(tree: Root, slug: string): Block[] {
  const fail = (node: Nodes, problem: string): never => {
    throw new Error(`src/notes/${slug}.mdx: ${problem} at line ${node.position?.start.line}`);
  };

  function link(nodes: RootContent[], tone: Tone, href: string): Run[] {
    const url = href.startsWith('/') ? `${SiteUrl}${href}` : href;
    return phrasing(nodes, tone).map((run) => ({ ...run, href: url }));
  }

  function flow(nodes: RootContent[]): Block[] {
    return nodes.flatMap((node): Block[] => {
      switch (node.type) {
        case 'paragraph': {
          // MDX parses an element written on one line as text inside a paragraph.
          const [only, ...rest] = node.children.filter(
            (child) => child.type !== 'text' || child.value.trim(),
          );
          if (only?.type === 'mdxJsxTextElement' && !rest.length) return element(only);
          const runs = phrasing(node.children, 'body');
          return runs.length ? [{ kind: 'paragraph', runs }] : [];
        }
        case 'heading':
          return [{ kind: 'heading', runs: phrasing(node.children, 'ink') }];
        case 'blockquote':
          return [{ kind: 'quote', blocks: flow(node.children) }];
        case 'list':
          return [
            {
              kind: 'list',
              ordered: Boolean(node.ordered),
              items: node.children.map((item) => flow(item.children)),
            },
          ];
        case 'code':
          return [{ kind: 'code', text: node.value }];
        case 'thematicBreak':
          return [{ kind: 'rule' }];
        case 'mdxJsxFlowElement':
          return element(node);
        case 'mdxFlowExpression':
          return comment.test(node.value) ? [] : fail(node, 'an expression has no text form');
        case 'mdxjsEsm':
          return [];
        default:
          return fail(node, `${node.type} has no text form`);
      }
    });
  }

  function phrasing(nodes: RootContent[], tone: Tone): Run[] {
    return nodes.flatMap((node): Run[] => {
      switch (node.type) {
        case 'text':
          return [lowered(node.value.replace(/\s+/g, ' '), tone)];
        case 'emphasis':
          return phrasing(node.children, 'em');
        case 'strong':
          return phrasing(node.children, 'strong');
        case 'inlineCode':
          return [literal(node.value, 'code')];
        case 'link':
          return link(node.children, tone, node.url);
        case 'break':
          return [literal('\n', tone)];
        case 'image':
          return [lowered(`[image: ${node.alt ?? ''}]`, 'faint')];
        case 'paragraph':
          return [...phrasing(node.children, tone), literal(' ', tone)];
        case 'mdxJsxTextElement':
          if (node.name === 'Fare') return [literal(fare(node), tone)];
          if (node.name === 'a') return link(node.children, tone, required(node, 'href'));
          return phrasing(node.children, tone);
        case 'mdxTextExpression':
          return comment.test(node.value) ? [] : fail(node, 'an expression has no text form');
        default:
          return fail(node, `${node.type} has no text form`);
      }
    });
  }

  function element(node: Jsx): Block[] {
    switch (node.name) {
      case 'Glossary':
        return [{ kind: 'section', label: 'words from this note', rows: terms(node) }];
      case 'div':
      case 'ResidualSection':
        return flow(node.children);
      case 'table':
        return [table(node)];
      default:
        return [
          {
            kind: 'demo',
            label: required(node, 'label'),
            blocks:
              node.type === 'mdxJsxTextElement'
                ? [{ kind: 'paragraph', runs: phrasing(node.children, 'body') }]
                : flow(node.children),
            href: `${SiteUrl}/notes/${slug}`,
          },
        ];
    }
  }

  function terms(node: Nodes): Row[] {
    if (isElement(node, 'Term')) {
      return [
        { lead: [lowered(required(node, 'name'), 'ink')], main: phrasing(node.children, 'body') },
      ];
    }
    if (node.type === 'text' && !node.value.trim()) return [];
    if (node.type !== 'paragraph' && !isElement(node, 'Glossary')) {
      return fail(node, 'a glossary holds only terms');
    }
    return children(node).flatMap(terms);
  }

  function table(node: Jsx): Block {
    const [caption] = find(node, 'caption');
    const [thead] = find(node, 'thead');
    const [tbody] = find(node, 'tbody');
    if (!thead || !tbody) return fail(node, 'a table needs a thead and a tbody');
    const columns = find(thead, 'th').map((th) => phrasing(th.children, 'faint'));
    const rows = find(tbody, 'tr').map((tr): TableRow => {
      const [header] = find(tr, 'th');
      const cells = find(tr, 'td');
      if (!header || cells.length !== columns.length - 1) {
        return fail(tr, 'a table row needs a header and one cell per column');
      }
      return {
        header: phrasing(header.children, 'faint'),
        cells: cells.map((cell) => phrasing(cell.children, 'ink')),
      };
    });
    return {
      kind: 'table',
      caption: caption ? phrasing(caption.children, 'faint') : [],
      columns,
      rows,
    };
  }

  function fare(node: Jsx) {
    const km = attribute(node, 'km');
    if (typeof km === 'string') return show(predict(start, Number(km)));
    const field = attribute(node, 'show');
    if (field !== 'fee' && field !== 'price') return fail(node, 'Fare needs show or km');
    return (attribute(node, 'factor') === undefined ? show : factor)(start[field]);
  }

  function required(node: Jsx, name: string) {
    const value = attribute(node, name);
    return typeof value === 'string' && value ? value : fail(node, `${node.name} needs ${name}`);
  }

  function attribute(node: Jsx, name: string) {
    for (const item of node.attributes) {
      if (item.type === 'mdxJsxAttribute' && item.name === name) {
        return typeof item.value === 'object' && item.value
          ? fail(node, `${name} must be a string`)
          : item.value;
      }
    }
  }

  return [...flow(tree.children), { kind: 'links' }];
}

function isElement(node: Nodes, name: string): node is Jsx {
  return (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === name
  );
}

function children(node: Nodes): RootContent[] {
  return 'children' in node ? node.children : [];
}

function find(node: Nodes, name: string): Jsx[] {
  return children(node).flatMap((child) => (isElement(child, name) ? [child] : find(child, name)));
}

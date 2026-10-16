export type CodeToken = [tone: 'ci' | 'cb' | 'cf', text: string];

// The note compiler writes these runs once; both highlighting and editing read them.
export function readCodeTokens(encoded: string) {
  const parsed: unknown = JSON.parse(encoded);
  if (!Array.isArray(parsed)) throw new Error('Expected highlighted code runs');
  const tokens: CodeToken[] = [];
  for (const token of parsed) {
    if (!Array.isArray(token) || token.length !== 2) throw new Error('Invalid code run');
    const [tone, text] = token;
    if ((tone !== 'ci' && tone !== 'cb' && tone !== 'cf') || typeof text !== 'string') {
      throw new Error('Invalid code tone or text');
    }
    tokens.push([tone, text]);
  }
  const source = tokens.map(([, text]) => text).join('');
  return { tokens, source };
}

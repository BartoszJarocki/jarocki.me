// #region tokenizer
export const symbols = '.abcdefghijklmnopqrstuvwxyz';

export function encode(name: string) {
  const ids = [0];
  for (const letter of name) ids.push(symbols.indexOf(letter));
  ids.push(0);
  return ids;
}
// #endregion

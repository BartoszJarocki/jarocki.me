export const lines = ['price', 'fee', 'ride', 'fare', 'miss', 'loss'] as const;
export type Line = (typeof lines)[number];

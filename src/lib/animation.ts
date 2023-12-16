export const ANIMATION_FROM_PROPS = { opacity: 0 };

export const ANIMATION_TO_PROPS = {
  opacity: 1,
  transition: { delay: 0.1, duration: 0.25, ease: 'easeOut' },
} as const;

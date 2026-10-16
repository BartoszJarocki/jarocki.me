// webpack's own ChunkLoadError carries the failed script's URL as request. The scene chunks load no
// further chunks, so on a scene's import() that error means one of its own chunks failed.
export function chunkLoadFailed(error: unknown) {
  return (
    error instanceof Error &&
    error.name === 'ChunkLoadError' &&
    'request' in error &&
    typeof error.request === 'string'
  );
}

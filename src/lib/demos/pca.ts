export function pca(vectors: Float32Array, width: number) {
  const rows = vectors.length / width;
  const centered = Float64Array.from(vectors);
  for (let column = 0; column < width; column++) {
    let mean = 0;
    for (let row = 0; row < rows; row++) mean += vectors[row * width + column] / rows;
    for (let row = 0; row < rows; row++) centered[row * width + column] -= mean;
  }
  const covariance = new Float64Array(width * width);
  for (let a = 0; a < width; a++) {
    for (let b = 0; b < width; b++) {
      for (let row = 0; row < rows; row++) {
        covariance[a * width + b] += centered[row * width + a] * centered[row * width + b];
      }
    }
  }
  const directions: Float64Array[] = [];
  const result = new Float32Array(rows * 3);
  for (let axis = 0; axis < 3; axis++) {
    let direction = Float64Array.from({ length: width }, (_, i) => Math.sin((i + 1) * (axis + 1)));
    for (let iteration = 0; iteration < 80; iteration++) {
      const next = new Float64Array(width);
      for (let a = 0; a < width; a++) {
        for (let b = 0; b < width; b++) next[a] += covariance[a * width + b] * direction[b];
      }
      for (const previous of directions) {
        const overlap = next.reduce((sum, value, i) => sum + value * previous[i], 0);
        for (let i = 0; i < width; i++) next[i] -= overlap * previous[i];
      }
      const length = Math.hypot(...next);
      direction = next.map((value) => (length > 1e-12 ? value / length : 0));
    }
    const largest = direction.reduce(
      (best, value, i) => (Math.abs(value) > Math.abs(direction[best]) ? i : best),
      0,
    );
    if (direction[largest] < 0) direction = direction.map((value) => -value);
    directions.push(direction);
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < width; i++)
        result[row * 3 + axis] += centered[row * width + i] * direction[i];
    }
  }
  return result;
}

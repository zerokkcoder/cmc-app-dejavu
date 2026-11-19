import { AXIS_COUNT } from "./fingerprint";

/** Deterministic 2-component PCA via covariance + power iteration. No dependencies. */
export function pca2d(matrix: Float64Array, dims = AXIS_COUNT): Float64Array {
  const n = matrix.length / dims;
  const means = new Array<number>(dims).fill(0);
  for (let i = 0; i < n; i += 1) {
    for (let d = 0; d < dims; d += 1) means[d] += matrix[i * dims + d] / n;
  }

  const cov = Array.from({ length: dims }, () => new Array<number>(dims).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let a = 0; a < dims; a += 1) {
      for (let b = 0; b < dims; b += 1) {
        cov[a][b] += ((matrix[i * dims + a] - means[a]) * (matrix[i * dims + b] - means[b])) / n;
      }
    }
  }

  const first = powerIteration(cov, dims);
  const deflated = deflate(cov, first, dims);
  const second = powerIteration(deflated, dims, first);

  const projected = new Float64Array(n * 2);
  for (let i = 0; i < n; i += 1) {
    let x = 0;
    let y = 0;
    for (let d = 0; d < dims; d += 1) {
      const v = matrix[i * dims + d] - means[d];
      x += v * first[d];
      y += v * second[d];
    }
    projected[i * 2] = x;
    projected[i * 2 + 1] = y;
  }
  return projected;
}

function powerIteration(
  matrix: number[][],
  dims: number,
  orthogonalTo?: number[],
): number[] {
  // Fixed seed keeps output deterministic across runs and machines.
  let v = Array.from({ length: dims }, (_, i) => Math.sin((i + 1) * 12.9898) * 0.5 + 0.5);
  if (orthogonalTo) v = orthogonalize(v, orthogonalTo);
  normalize(v);

  for (let iter = 0; iter < 200; iter += 1) {
    const next = new Array<number>(dims).fill(0);
    for (let a = 0; a < dims; a += 1) {
      for (let b = 0; b < dims; b += 1) next[a] += matrix[a][b] * v[b];
    }
    if (orthogonalTo) {
      const orthogonal = orthogonalize(next, orthogonalTo);
      normalize(orthogonal);
      v = orthogonal;
    } else {
      normalize(next);
      v = next;
    }
  }
  return v;
}

function orthogonalize(v: number[], basis: number[]): number[] {
  let dot = 0;
  for (let i = 0; i < v.length; i += 1) dot += v[i] * basis[i];
  return v.map((x, i) => x - dot * basis[i]);
}

function normalize(v: number[]): void {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0)) || 1;
  for (let i = 0; i < v.length; i += 1) v[i] /= norm;
}

function deflate(matrix: number[][], vector: number[], dims: number): number[][] {
  const out = matrix.map((row) => [...row]);
  let lambda = 0;
  for (let a = 0; a < dims; a += 1) {
    for (let b = 0; b < dims; b += 1) lambda += vector[a] * matrix[a][b] * vector[b];
  }
  for (let a = 0; a < dims; a += 1) {
    for (let b = 0; b < dims; b += 1) out[a][b] -= lambda * vector[a] * vector[b];
  }
  return out;
}

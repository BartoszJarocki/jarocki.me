import { Color } from 'three';

// The tokens are oklch, so a 1x1 canvas resolves them to the exact sRGB bytes the page paints.
export function tokenReader() {
  const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  swatch.canvas.width = swatch.canvas.height = 1;
  return (name: string) => {
    swatch.clearRect(0, 0, 1, 1);
    swatch.fillStyle = '#000';
    swatch.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    swatch.fillRect(0, 0, 1, 1);
    const { data } = swatch.getImageData(0, 0, 1, 1);
    return new Color(data[0] / 255, data[1] / 255, data[2] / 255);
  };
}

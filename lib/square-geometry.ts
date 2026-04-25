// Auto-generated from DXF engineering drawings.
// All dimensions in mm. Y-flipped for SVG (top-left origin).
// DO NOT edit by hand.

export type SquareSize = 'chode' | '95mm' | '125mm' | '175mm' | '250mm'
export type ScaleType = 'full_scale' | 't45'
export type ScaleVariant = 'narrow' | 'wide_cf'

export interface ShapeLine { x1: number; y1: number; x2: number; y2: number }
export interface ShapeCircle { cx: number; cy: number; r: number }

export interface BodyShape {
  width: number
  height: number
  lines: ShapeLine[]
  circles: ShapeCircle[]
}

export interface ScaleShape extends BodyShape {
  /** Where the scale's (0,0) sits within the body's coordinate frame, in mm. */
  bodyOffsetX: number
  bodyOffsetY: number
}

export interface SquareSpec {
  label: string
  width: number
  height: number
  bladeHeight: number
  chamfer: number
  holes: number
  holeDiameter: number
  pinDiameter: number
  bodyThickness: number
  description: string
}

export const SQUARE_BODIES: Record<string, BodyShape> = {
  'chode__full_scale': {
    width: 67.5,
    height: 46.05,
    lines: [
      { x1: 21.09, y1: 19.63, x2: 66.09, y2: 19.63 },
      { x1: 67.5, y1: 1.41, x2: 66.09, y2: 0.0 },
      { x1: 18.26, y1: 19.63, x2: 19.67, y2: 21.05 },
      { x1: 19.67, y1: 44.63, x2: 18.26, y2: 46.05 },
      { x1: 18.26, y1: 46.05, x2: 1.41, y2: 46.05 },
      { x1: 67.5, y1: 18.22, x2: 67.5, y2: 1.41 },
      { x1: 0.0, y1: 44.63, x2: 1.41, y2: 46.05 },
      { x1: 18.26, y1: 19.63, x2: 19.67, y2: 18.22 },
      { x1: 0.0, y1: 1.41, x2: 0.0, y2: 44.63 },
      { x1: 19.67, y1: 21.05, x2: 19.67, y2: 44.63 },
      { x1: 1.41, y1: 0.0, x2: 0.0, y2: 1.41 },
      { x1: 66.09, y1: 19.63, x2: 67.5, y2: 18.22 },
      { x1: 19.67, y1: 18.22, x2: 21.09, y2: 19.63 },
      { x1: 66.09, y1: 0.0, x2: 1.41, y2: 0.0 },
    ],
    circles: [
      { cx: 6.41, cy: 16.48, r: 2.5 },
      { cx: 13.26, cy: 37.53, r: 2.5 },
    ],
  },
  'chode__t45': {
    width: 67.5,
    height: 46.05,
    lines: [
      { x1: 21.09, y1: 19.63, x2: 66.09, y2: 19.63 },
      { x1: 67.5, y1: 1.41, x2: 66.09, y2: 0.0 },
      { x1: 18.26, y1: 19.63, x2: 19.67, y2: 21.05 },
      { x1: 19.67, y1: 44.63, x2: 18.26, y2: 46.05 },
      { x1: 18.26, y1: 46.05, x2: 1.41, y2: 46.05 },
      { x1: 67.5, y1: 18.22, x2: 67.5, y2: 1.41 },
      { x1: 0.0, y1: 44.63, x2: 1.41, y2: 46.05 },
      { x1: 18.26, y1: 19.63, x2: 19.67, y2: 18.22 },
      { x1: 0.0, y1: 1.41, x2: 0.0, y2: 44.63 },
      { x1: 19.67, y1: 21.05, x2: 19.67, y2: 44.63 },
      { x1: 1.41, y1: 0.0, x2: 0.0, y2: 1.41 },
      { x1: 66.09, y1: 19.63, x2: 67.5, y2: 18.22 },
      { x1: 19.67, y1: 18.22, x2: 21.09, y2: 19.63 },
      { x1: 66.09, y1: 0.0, x2: 1.41, y2: 0.0 },
    ],
    circles: [
      { cx: 6.41, cy: 16.48, r: 2.5 },
      { cx: 13.26, cy: 37.53, r: 2.5 },
    ],
  },
  '95mm__full_scale': {
    width: 96.69,
    height: 65.0,
    lines: [
      { x1: 2.12, y1: 0.0, x2: 94.54, y2: 0.0 },
      { x1: 0.0, y1: 2.12, x2: 2.12, y2: 0.0 },
      { x1: 27.12, y1: 25.0, x2: 94.54, y2: 25.0 },
      { x1: 94.54, y1: 0.0, x2: 96.69, y2: 2.1 },
      { x1: 96.66, y1: 22.88, x2: 96.69, y2: 2.1 },
      { x1: 25.0, y1: 62.88, x2: 25.0, y2: 27.12 },
      { x1: 25.0, y1: 27.12, x2: 22.88, y2: 25.0 },
      { x1: 94.54, y1: 25.0, x2: 96.66, y2: 22.88 },
      { x1: 22.88, y1: 65.0, x2: 2.12, y2: 65.0 },
      { x1: 25.0, y1: 22.88, x2: 27.12, y2: 25.0 },
      { x1: 25.0, y1: 62.88, x2: 22.88, y2: 65.0 },
      { x1: 22.88, y1: 25.0, x2: 25.0, y2: 22.88 },
      { x1: 2.12, y1: 65.0, x2: 0.0, y2: 62.88 },
      { x1: 0.0, y1: 62.88, x2: 0.0, y2: 2.12 },
    ],
    circles: [
      { cx: 7.0, cy: 32.12, r: 2.5 },
      { cx: 15.0, cy: 7.17, r: 2.5 },
      { cx: 15.04, cy: 57.02, r: 2.5 },
    ],
  },
  '95mm__t45': {
    width: 96.69,
    height: 65.0,
    lines: [
      { x1: 0.0, y1: 2.12, x2: 2.12, y2: 0.0 },
      { x1: 96.66, y1: 22.88, x2: 96.69, y2: 2.1 },
      { x1: 27.12, y1: 25.0, x2: 94.54, y2: 25.0 },
      { x1: 25.0, y1: 62.88, x2: 25.0, y2: 27.12 },
      { x1: 94.54, y1: 0.0, x2: 96.69, y2: 2.1 },
      { x1: 0.0, y1: 62.88, x2: 0.0, y2: 2.12 },
      { x1: 94.54, y1: 25.0, x2: 96.66, y2: 22.88 },
      { x1: 25.0, y1: 27.12, x2: 22.88, y2: 25.0 },
      { x1: 22.88, y1: 25.0, x2: 25.0, y2: 22.88 },
      { x1: 2.12, y1: 65.0, x2: 0.0, y2: 62.88 },
      { x1: 25.0, y1: 22.88, x2: 27.12, y2: 25.0 },
      { x1: 2.12, y1: 0.0, x2: 94.54, y2: 0.0 },
      { x1: 25.0, y1: 62.88, x2: 22.88, y2: 65.0 },
      { x1: 22.88, y1: 65.0, x2: 2.12, y2: 65.0 },
    ],
    circles: [
      { cx: 7.0, cy: 22.12, r: 2.5 },
      { cx: 20.0, cy: 40.12, r: 2.5 },
      { cx: 7.0, cy: 57.12, r: 2.5 },
    ],
  },
  '125mm__full_scale': {
    width: 123.66,
    height: 78.66,
    lines: [
      { x1: 123.66, y1: 2.83, x2: 123.66, y2: 22.17 },
      { x1: 2.83, y1: 78.66, x2: 22.17, y2: 78.66 },
      { x1: 0.0, y1: 75.83, x2: 0.0, y2: 2.83 },
      { x1: 0.0, y1: 2.83, x2: 2.83, y2: 0.0 },
      { x1: 2.83, y1: 0.0, x2: 120.83, y2: 0.0 },
      { x1: 0.0, y1: 75.83, x2: 2.83, y2: 78.66 },
      { x1: 22.17, y1: 25.0, x2: 25.0, y2: 27.83 },
      { x1: 22.17, y1: 25.0, x2: 25.0, y2: 22.17 },
      { x1: 25.0, y1: 22.17, x2: 27.83, y2: 25.0 },
      { x1: 27.83, y1: 25.0, x2: 120.83, y2: 25.0 },
      { x1: 120.83, y1: 25.0, x2: 123.66, y2: 22.17 },
      { x1: 25.0, y1: 27.83, x2: 25.0, y2: 75.83 },
      { x1: 25.0, y1: 75.83, x2: 22.17, y2: 78.66 },
      { x1: 120.83, y1: 0.0, x2: 123.66, y2: 2.83 },
    ],
    circles: [
      { cx: 17.17, cy: 68.0, r: 2.5 },
      { cx: 17.17, cy: 8.0, r: 2.5 },
      { cx: 7.17, cy: 38.0, r: 2.5 },
    ],
  },
  '125mm__t45': {
    width: 123.66,
    height: 78.66,
    lines: [
      { x1: 0.0, y1: 75.83, x2: 2.83, y2: 78.66 },
      { x1: 25.0, y1: 22.17, x2: 27.83, y2: 25.0 },
      { x1: 22.17, y1: 25.0, x2: 25.0, y2: 22.17 },
      { x1: 2.83, y1: 0.0, x2: 120.83, y2: 0.0 },
      { x1: 120.83, y1: 0.0, x2: 123.66, y2: 2.83 },
      { x1: 2.83, y1: 78.66, x2: 22.17, y2: 78.66 },
      { x1: 123.66, y1: 2.83, x2: 123.66, y2: 22.17 },
      { x1: 25.0, y1: 75.83, x2: 22.17, y2: 78.66 },
      { x1: 0.0, y1: 75.83, x2: 0.0, y2: 2.83 },
      { x1: 120.83, y1: 25.0, x2: 123.66, y2: 22.17 },
      { x1: 25.0, y1: 27.83, x2: 25.0, y2: 75.83 },
      { x1: 22.17, y1: 25.0, x2: 25.0, y2: 27.83 },
      { x1: 27.83, y1: 25.0, x2: 120.83, y2: 25.0 },
      { x1: 0.0, y1: 2.83, x2: 2.83, y2: 0.0 },
    ],
    circles: [
      { cx: 7.19, cy: 50.6, r: 2.5 },
      { cx: 17.17, cy: 33.0, r: 2.5 },
      { cx: 17.17, cy: 68.0, r: 2.5 },
    ],
  },
  '175mm__full_scale': {
    width: 175.0,
    height: 100.01,
    lines: [
      { x1: 3.53, y1: 100.01, x2: 0.0, y2: 96.47 },
      { x1: 25.0, y1: 96.47, x2: 25.0, y2: 28.54 },
      { x1: 21.47, y1: 100.01, x2: 3.53, y2: 100.01 },
      { x1: 175.0, y1: 3.54, x2: 171.46, y2: 0.0 },
      { x1: 171.46, y1: 25.0, x2: 175.0, y2: 21.47 },
      { x1: 25.0, y1: 28.54, x2: 21.46, y2: 25.0 },
      { x1: 171.46, y1: 0.0, x2: 3.54, y2: 0.0 },
      { x1: 0.0, y1: 3.54, x2: 3.54, y2: 0.0 },
      { x1: 25.0, y1: 21.47, x2: 28.54, y2: 25.0 },
      { x1: 25.0, y1: 96.47, x2: 21.47, y2: 100.01 },
      { x1: 175.0, y1: 21.47, x2: 175.0, y2: 3.54 },
      { x1: 21.46, y1: 25.0, x2: 25.0, y2: 21.47 },
      { x1: 0.0, y1: 3.54, x2: 0.0, y2: 96.47 },
      { x1: 28.54, y1: 25.0, x2: 171.46, y2: 25.0 },
    ],
    circles: [
      { cx: 9.99, cy: 50.01, r: 2.5 },
      { cx: 14.99, cy: 10.01, r: 2.5 },
      { cx: 14.99, cy: 90.01, r: 2.5 },
    ],
  },
  '175mm__t45': {
    width: 175.0,
    height: 100.01,
    lines: [
      { x1: 25.0, y1: 96.47, x2: 25.0, y2: 28.54 },
      { x1: 25.0, y1: 21.47, x2: 28.54, y2: 25.0 },
      { x1: 21.46, y1: 25.0, x2: 25.0, y2: 21.47 },
      { x1: 21.47, y1: 100.01, x2: 3.53, y2: 100.01 },
      { x1: 0.0, y1: 3.54, x2: 3.54, y2: 0.0 },
      { x1: 171.46, y1: 0.0, x2: 3.54, y2: 0.0 },
      { x1: 28.54, y1: 25.0, x2: 171.46, y2: 25.0 },
      { x1: 0.0, y1: 3.54, x2: 0.0, y2: 96.47 },
      { x1: 175.0, y1: 21.47, x2: 175.0, y2: 3.54 },
      { x1: 3.53, y1: 100.01, x2: 0.0, y2: 96.47 },
      { x1: 175.0, y1: 3.54, x2: 171.46, y2: 0.0 },
      { x1: 171.46, y1: 25.0, x2: 175.0, y2: 21.47 },
      { x1: 25.0, y1: 28.54, x2: 21.46, y2: 25.0 },
      { x1: 25.0, y1: 96.47, x2: 21.47, y2: 100.01 },
    ],
    circles: [
      { cx: 14.99, cy: 35.01, r: 2.5 },
      { cx: 10.32, cy: 62.73, r: 2.5 },
      { cx: 14.99, cy: 90.01, r: 2.5 },
    ],
  },
  '250mm__full_scale': {
    width: 250.0,
    height: 140.0,
    lines: [
      { x1: 0.0, y1: 4.24, x2: 0.0, y2: 135.76 },
      { x1: 4.25, y1: 0.0, x2: 0.0, y2: 4.24 },
      { x1: 4.24, y1: 140.0, x2: 0.0, y2: 135.76 },
      { x1: 25.76, y1: 140.0, x2: 4.24, y2: 140.0 },
      { x1: 250.0, y1: 25.76, x2: 250.0, y2: 4.25 },
      { x1: 30.0, y1: 135.76, x2: 30.0, y2: 34.25 },
      { x1: 245.76, y1: 30.01, x2: 250.0, y2: 25.76 },
      { x1: 30.0, y1: 135.76, x2: 25.76, y2: 140.0 },
      { x1: 30.0, y1: 34.25, x2: 25.76, y2: 30.01 },
      { x1: 250.0, y1: 4.25, x2: 245.76, y2: 0.01 },
      { x1: 245.76, y1: 0.01, x2: 4.25, y2: 0.0 },
      { x1: 25.76, y1: 30.01, x2: 30.0, y2: 25.76 },
      { x1: 30.0, y1: 25.76, x2: 34.24, y2: 30.01 },
      { x1: 34.24, y1: 30.01, x2: 245.76, y2: 30.01 },
    ],
    circles: [
      { cx: 20.02, cy: 125.0, r: 2.5 },
      { cx: 10.08, cy: 70.0, r: 2.5 },
      { cx: 20.02, cy: 15.0, r: 2.5 },
    ],
  },
  '250mm__t45': {
    width: 250.0,
    height: 140.0,
    lines: [
      { x1: 4.24, y1: 140.0, x2: 0.0, y2: 135.76 },
      { x1: 0.0, y1: 4.24, x2: 0.0, y2: 135.76 },
      { x1: 245.76, y1: 0.01, x2: 4.25, y2: 0.0 },
      { x1: 25.76, y1: 140.0, x2: 4.24, y2: 140.0 },
      { x1: 250.0, y1: 25.76, x2: 250.0, y2: 4.25 },
      { x1: 30.0, y1: 135.76, x2: 30.0, y2: 34.25 },
      { x1: 30.0, y1: 34.25, x2: 25.76, y2: 30.01 },
      { x1: 30.0, y1: 25.76, x2: 34.24, y2: 30.01 },
      { x1: 34.24, y1: 30.01, x2: 245.76, y2: 30.01 },
      { x1: 245.76, y1: 30.01, x2: 250.0, y2: 25.76 },
      { x1: 25.76, y1: 30.01, x2: 30.0, y2: 25.76 },
      { x1: 4.25, y1: 0.0, x2: 0.0, y2: 4.24 },
      { x1: 250.0, y1: 4.25, x2: 245.76, y2: 0.01 },
      { x1: 30.0, y1: 135.76, x2: 25.76, y2: 140.0 },
    ],
    circles: [
      { cx: 20.02, cy: 125.0, r: 2.5 },
      { cx: 20.02, cy: 45.0, r: 2.5 },
      { cx: 10.02, cy: 85.0, r: 2.5 },
    ],
  },
}

export const SQUARE_SCALES: Record<string, ScaleShape> = {
  'chode__full_scale__narrow': {
    width: 19.67,
    height: 46.05,
    bodyOffsetX: 0.0,
    bodyOffsetY: 0.0,
    lines: [
      { x1: 1.41, y1: 0.0, x2: 0.0, y2: 1.41 },
      { x1: 19.67, y1: 44.63, x2: 18.26, y2: 46.05 },
      { x1: 0.0, y1: 44.63, x2: 1.41, y2: 46.05 },
      { x1: 18.26, y1: 19.63, x2: 19.67, y2: 18.22 },
      { x1: 1.41, y1: 0.0, x2: 19.67, y2: 0.0 },
      { x1: 0.0, y1: 1.41, x2: 0.0, y2: 44.63 },
      { x1: 19.67, y1: 18.22, x2: 19.67, y2: 0.0 },
      { x1: 18.26, y1: 19.63, x2: 19.67, y2: 21.05 },
      { x1: 18.26, y1: 46.05, x2: 1.41, y2: 46.05 },
      { x1: 19.67, y1: 21.05, x2: 19.67, y2: 44.63 },
    ],
    circles: [
      { cx: 6.41, cy: 16.48, r: 2.5 },
      { cx: 13.26, cy: 37.53, r: 2.5 },
    ],
  },
  'chode__full_scale__wide_cf': {
    width: 19.67,
    height: 46.05,
    bodyOffsetX: 0.0,
    bodyOffsetY: 0.0,
    lines: [
      { x1: 18.26, y1: 46.05, x2: 1.41, y2: 46.05 },
      { x1: 0.0, y1: 1.41, x2: 0.0, y2: 44.63 },
      { x1: 19.67, y1: 18.22, x2: 19.67, y2: 0.0 },
      { x1: 1.41, y1: 0.0, x2: 0.0, y2: 1.41 },
      { x1: 19.67, y1: 44.63, x2: 18.26, y2: 46.05 },
      { x1: 0.0, y1: 44.63, x2: 1.41, y2: 46.05 },
      { x1: 19.67, y1: 21.05, x2: 19.67, y2: 44.63 },
      { x1: 18.26, y1: 19.63, x2: 19.67, y2: 18.22 },
      { x1: 1.41, y1: 0.0, x2: 19.67, y2: 0.0 },
      { x1: 18.26, y1: 19.63, x2: 19.67, y2: 21.05 },
    ],
    circles: [
      { cx: 13.26, cy: 37.53, r: 2.5 },
      { cx: 6.41, cy: 16.48, r: 2.5 },
    ],
  },
  'chode__t45__narrow': {
    width: 19.67,
    height: 44.64,
    bodyOffsetX: 0.0,
    bodyOffsetY: 1.42,
    lines: [
      { x1: 19.67, y1: 43.22, x2: 18.26, y2: 44.64 },
      { x1: 0.0, y1: 43.22, x2: 1.41, y2: 44.63 },
      { x1: 19.67, y1: 19.63, x2: 19.67, y2: 43.22 },
      { x1: 19.67, y1: 19.63, x2: 0.0, y2: 0.0 },
      { x1: 0.0, y1: 0.0, x2: 0.0, y2: 43.22 },
      { x1: 18.26, y1: 44.64, x2: 1.41, y2: 44.63 },
    ],
    circles: [
      { cx: 13.26, cy: 36.11, r: 2.5 },
      { cx: 6.41, cy: 15.07, r: 2.5 },
    ],
  },
  'chode__t45__wide_cf': {
    width: 48.14,
    height: 44.64,
    bodyOffsetX: -28.47,
    bodyOffsetY: 1.42,
    lines: [
      { x1: 48.14, y1: 19.63, x2: 48.14, y2: 43.22 },
      { x1: 1.41, y1: 44.64, x2: 18.26, y2: 44.63 },
      { x1: 0.0, y1: 19.63, x2: 19.67, y2: 0.0 },
      { x1: 19.67, y1: 43.22, x2: 18.26, y2: 44.63 },
      { x1: 19.67, y1: 0.0, x2: 19.67, y2: 43.22 },
      { x1: 0.0, y1: 43.22, x2: 1.41, y2: 44.64 },
      { x1: 48.14, y1: 43.22, x2: 46.73, y2: 44.64 },
      { x1: 0.0, y1: 19.63, x2: 0.0, y2: 43.22 },
      { x1: 48.14, y1: 19.63, x2: 28.47, y2: 0.0 },
      { x1: 28.47, y1: 0.0, x2: 28.47, y2: 43.22 },
      { x1: 46.73, y1: 44.64, x2: 29.89, y2: 44.63 },
      { x1: 28.47, y1: 43.22, x2: 29.89, y2: 44.63 },
    ],
    circles: [
      { cx: 41.73, cy: 36.11, r: 2.5 },
      { cx: 34.88, cy: 15.07, r: 2.5 },
      { cx: 6.41, cy: 36.11, r: 2.5 },
      { cx: 13.26, cy: 15.07, r: 2.5 },
    ],
  },
  '95mm__full_scale__narrow': {
    width: 25.0,
    height: 65.0,
    bodyOffsetX: 0.0,
    bodyOffsetY: 0.0,
    lines: [
      { x1: 22.88, y1: 65.0, x2: 2.12, y2: 65.0 },
      { x1: 22.88, y1: 25.0, x2: 25.0, y2: 22.88 },
      { x1: 2.12, y1: 65.0, x2: 0.0, y2: 62.88 },
      { x1: 25.0, y1: 62.88, x2: 25.0, y2: 27.12 },
      { x1: 25.0, y1: 22.88, x2: 25.0, y2: 0.1 },
      { x1: 25.0, y1: 27.12, x2: 22.88, y2: 25.0 },
      { x1: 2.12, y1: 0.0, x2: 25.0, y2: 0.1 },
      { x1: 0.0, y1: 62.88, x2: 0.0, y2: 2.12 },
      { x1: 0.0, y1: 2.12, x2: 2.12, y2: 0.0 },
      { x1: 25.0, y1: 62.88, x2: 22.88, y2: 65.0 },
    ],
    circles: [
      { cx: 15.0, cy: 7.17, r: 2.5 },
      { cx: 7.0, cy: 32.12, r: 2.5 },
      { cx: 15.04, cy: 57.02, r: 2.5 },
    ],
  },
  '95mm__full_scale__wide_cf': {
    width: 25.0,
    height: 65.0,
    bodyOffsetX: 0.0,
    bodyOffsetY: 0.0,
    lines: [
      { x1: 25.0, y1: 62.88, x2: 25.0, y2: 27.12 },
      { x1: 25.0, y1: 22.88, x2: 25.0, y2: 0.1 },
      { x1: 25.0, y1: 27.12, x2: 22.88, y2: 25.0 },
      { x1: 0.0, y1: 62.88, x2: 0.0, y2: 2.12 },
      { x1: 22.88, y1: 65.0, x2: 2.12, y2: 65.0 },
      { x1: 2.12, y1: 0.0, x2: 25.0, y2: 0.1 },
      { x1: 2.12, y1: 65.0, x2: 0.0, y2: 62.88 },
      { x1: 25.0, y1: 62.88, x2: 22.88, y2: 65.0 },
      { x1: 22.88, y1: 25.0, x2: 25.0, y2: 22.88 },
      { x1: 0.0, y1: 2.12, x2: 2.12, y2: 0.0 },
    ],
    circles: [
      { cx: 7.0, cy: 32.12, r: 2.5 },
      { cx: 15.04, cy: 57.02, r: 2.5 },
      { cx: 15.0, cy: 7.17, r: 2.5 },
    ],
  },
  '95mm__t45__narrow': {
    width: 25.0,
    height: 62.88,
    bodyOffsetX: 0.0,
    bodyOffsetY: 2.12,
    lines: [
      { x1: 22.88, y1: 62.87, x2: 2.12, y2: 62.88 },
      { x1: 2.12, y1: 62.88, x2: 0.0, y2: 60.76 },
      { x1: 25.0, y1: 60.75, x2: 22.88, y2: 62.87 },
      { x1: 25.0, y1: 25.0, x2: 0.0, y2: 0.0 },
      { x1: 25.0, y1: 60.75, x2: 25.0, y2: 25.0 },
      { x1: 0.0, y1: 60.76, x2: 0.0, y2: 0.0 },
    ],
    circles: [
      { cx: 7.0, cy: 20.0, r: 2.5 },
      { cx: 7.0, cy: 55.0, r: 2.5 },
      { cx: 20.0, cy: 38.0, r: 2.5 },
    ],
  },
  '125mm__full_scale__narrow': {
    width: 25.0,
    height: 78.66,
    bodyOffsetX: 0.0,
    bodyOffsetY: 0.0,
    lines: [
      { x1: 0.0, y1: 75.83, x2: 2.83, y2: 78.66 },
      { x1: 25.0, y1: 75.83, x2: 22.17, y2: 78.66 },
      { x1: 22.17, y1: 25.0, x2: 25.0, y2: 27.83 },
      { x1: 2.83, y1: 78.66, x2: 22.17, y2: 78.66 },
      { x1: 25.0, y1: 22.17, x2: 25.0, y2: 0.0 },
      { x1: 0.0, y1: 75.83, x2: 0.0, y2: 2.83 },
      { x1: 22.17, y1: 25.0, x2: 25.0, y2: 22.17 },
      { x1: 25.0, y1: 27.83, x2: 25.0, y2: 75.83 },
      { x1: 0.0, y1: 2.83, x2: 2.83, y2: 0.0 },
      { x1: 2.83, y1: 0.0, x2: 25.0, y2: 0.0 },
    ],
    circles: [
      { cx: 7.17, cy: 38.0, r: 2.5 },
      { cx: 17.17, cy: 8.0, r: 2.5 },
      { cx: 17.17, cy: 68.0, r: 2.5 },
    ],
  },
  '125mm__t45__narrow': {
    width: 25.0,
    height: 75.83,
    bodyOffsetX: 0.0,
    bodyOffsetY: 2.83,
    lines: [
      { x1: 0.0, y1: 73.0, x2: 0.0, y2: 0.0 },
      { x1: 0.0, y1: 73.0, x2: 2.83, y2: 75.83 },
      { x1: 2.83, y1: 75.83, x2: 22.17, y2: 75.83 },
      { x1: 25.0, y1: 25.0, x2: 25.0, y2: 73.0 },
      { x1: 25.0, y1: 73.0, x2: 22.17, y2: 75.83 },
      { x1: 25.0, y1: 25.0, x2: 0.0, y2: 0.0 },
    ],
    circles: [
      { cx: 7.19, cy: 47.77, r: 2.5 },
      { cx: 17.17, cy: 30.17, r: 2.5 },
      { cx: 17.17, cy: 65.17, r: 2.5 },
    ],
  },
  '125mm__t45__wide_cf': {
    width: 25.0,
    height: 75.83,
    bodyOffsetX: 0.0,
    bodyOffsetY: 2.83,
    lines: [
      { x1: 2.83, y1: 75.83, x2: 22.17, y2: 75.83 },
      { x1: 25.0, y1: 25.0, x2: 25.0, y2: 73.0 },
      { x1: 25.0, y1: 25.0, x2: 0.0, y2: 0.0 },
      { x1: 0.0, y1: 73.0, x2: 0.0, y2: 0.0 },
      { x1: 25.0, y1: 73.0, x2: 22.17, y2: 75.83 },
      { x1: 0.0, y1: 73.0, x2: 2.83, y2: 75.83 },
    ],
    circles: [
      { cx: 7.19, cy: 47.77, r: 2.5 },
      { cx: 17.17, cy: 30.17, r: 2.5 },
      { cx: 17.17, cy: 65.17, r: 2.5 },
    ],
  },
  '175mm__full_scale__narrow': {
    width: 25.0,
    height: 100.01,
    bodyOffsetX: 0.0,
    bodyOffsetY: 0.0,
    lines: [
      { x1: 25.0, y1: 96.47, x2: 21.47, y2: 100.01 },
      { x1: 0.0, y1: 3.54, x2: 0.0, y2: 96.47 },
      { x1: 25.0, y1: 96.47, x2: 25.0, y2: 28.54 },
      { x1: 0.0, y1: 3.54, x2: 3.54, y2: 0.0 },
      { x1: 21.46, y1: 25.0, x2: 25.0, y2: 21.47 },
      { x1: 3.53, y1: 100.01, x2: 0.0, y2: 96.47 },
      { x1: 25.0, y1: 28.54, x2: 21.46, y2: 25.0 },
      { x1: 21.47, y1: 100.01, x2: 3.53, y2: 100.01 },
      { x1: 3.54, y1: 0.0, x2: 25.0, y2: 0.0 },
      { x1: 25.0, y1: 21.47, x2: 25.0, y2: 0.0 },
    ],
    circles: [
      { cx: 14.99, cy: 90.01, r: 2.5 },
      { cx: 14.99, cy: 10.01, r: 2.5 },
      { cx: 9.99, cy: 50.01, r: 2.5 },
    ],
  },
  '175mm__full_scale__wide_cf': {
    width: 25.0,
    height: 100.01,
    bodyOffsetX: 0.0,
    bodyOffsetY: 0.0,
    lines: [
      { x1: 25.0, y1: 21.47, x2: 25.0, y2: 0.0 },
      { x1: 25.0, y1: 96.47, x2: 25.0, y2: 28.54 },
      { x1: 21.47, y1: 100.01, x2: 3.53, y2: 100.01 },
      { x1: 0.0, y1: 3.54, x2: 0.0, y2: 96.47 },
      { x1: 3.54, y1: 0.0, x2: 25.0, y2: 0.0 },
      { x1: 0.0, y1: 3.54, x2: 3.54, y2: 0.0 },
      { x1: 21.46, y1: 25.0, x2: 25.0, y2: 21.47 },
      { x1: 3.53, y1: 100.01, x2: 0.0, y2: 96.47 },
      { x1: 25.0, y1: 96.47, x2: 21.47, y2: 100.01 },
      { x1: 25.0, y1: 28.54, x2: 21.46, y2: 25.0 },
    ],
    circles: [
      { cx: 14.99, cy: 90.01, r: 2.5 },
      { cx: 9.99, cy: 50.01, r: 2.5 },
      { cx: 14.99, cy: 10.01, r: 2.5 },
    ],
  },
  '175mm__t45__narrow': {
    width: 25.0,
    height: 96.47,
    bodyOffsetX: 0.0,
    bodyOffsetY: 3.54,
    lines: [
      { x1: 0.0, y1: 0.0, x2: 0.0, y2: 92.93 },
      { x1: 25.0, y1: 92.93, x2: 25.0, y2: 25.0 },
      { x1: 25.0, y1: 25.0, x2: 0.0, y2: 0.0 },
      { x1: 3.53, y1: 96.47, x2: 0.0, y2: 92.93 },
      { x1: 25.0, y1: 92.93, x2: 21.47, y2: 96.47 },
      { x1: 21.47, y1: 96.47, x2: 3.53, y2: 96.47 },
    ],
    circles: [
      { cx: 14.99, cy: 86.47, r: 2.5 },
      { cx: 10.32, cy: 59.2, r: 2.5 },
      { cx: 14.99, cy: 31.47, r: 2.5 },
    ],
  },
  '250mm__full_scale__narrow': {
    width: 30.0,
    height: 140.0,
    bodyOffsetX: 0.0,
    bodyOffsetY: 0.0,
    lines: [
      { x1: 30.0, y1: 135.76, x2: 25.76, y2: 140.0 },
      { x1: 4.25, y1: 0.0, x2: 30.0, y2: 0.0 },
      { x1: 30.0, y1: 34.25, x2: 25.76, y2: 30.01 },
      { x1: 4.24, y1: 140.0, x2: 0.0, y2: 135.76 },
      { x1: 0.0, y1: 4.24, x2: 0.0, y2: 135.76 },
      { x1: 30.0, y1: 135.76, x2: 30.0, y2: 34.25 },
      { x1: 25.76, y1: 140.0, x2: 4.24, y2: 140.0 },
      { x1: 25.76, y1: 30.01, x2: 30.0, y2: 25.76 },
      { x1: 4.25, y1: 0.0, x2: 0.0, y2: 4.24 },
      { x1: 30.0, y1: 25.76, x2: 30.0, y2: 0.0 },
    ],
    circles: [
      { cx: 20.02, cy: 15.0, r: 2.5 },
      { cx: 20.02, cy: 125.0, r: 2.5 },
      { cx: 10.08, cy: 70.0, r: 2.5 },
    ],
  },
  '250mm__t45__narrow': {
    width: 30.0,
    height: 135.76,
    bodyOffsetX: 0.0,
    bodyOffsetY: 4.24,
    lines: [
      { x1: 25.76, y1: 135.76, x2: 4.24, y2: 135.76 },
      { x1: 30.0, y1: 131.52, x2: 25.76, y2: 135.76 },
      { x1: 4.24, y1: 135.76, x2: 0.0, y2: 131.52 },
      { x1: 0.0, y1: 0.0, x2: 0.0, y2: 131.52 },
      { x1: 30.0, y1: 30.01, x2: 0.0, y2: 0.0 },
      { x1: 30.0, y1: 131.52, x2: 30.0, y2: 30.01 },
    ],
    circles: [
      { cx: 20.02, cy: 120.76, r: 2.5 },
      { cx: 10.02, cy: 80.76, r: 2.5 },
      { cx: 20.02, cy: 40.76, r: 2.5 },
    ],
  },
}

export const SQUARE_SPECS: Record<SquareSize, SquareSpec> = {
  chode: {
    label: 'Chode',
    width: 67.5,
    height: 46.05,
    bladeHeight: 46,
    chamfer: 2,
    holes: 2,
    holeDiameter: 5,
    pinDiameter: 2.5,
    bodyThickness: 3,
    description: 'The pocket square. Compact enough for a tool roll, precise enough for dovetails.',
  },
  '95mm': {
    label: '95mm',
    width: 96.7,
    height: 65,
    bladeHeight: 65,
    chamfer: 3,
    holes: 3,
    holeDiameter: 5,
    pinDiameter: 2.5,
    bodyThickness: 3,
    description: 'The workhorse. The most versatile size for bench work and joinery.',
  },
  '125mm': {
    label: '125mm',
    width: 123.7,
    height: 78.7,
    bladeHeight: 79,
    chamfer: 4,
    holes: 3,
    holeDiameter: 5,
    pinDiameter: 2.5,
    bodyThickness: 3,
    description: 'For larger stock and wider boards. The go-to for cabinet work.',
  },
  '175mm': {
    label: '175mm',
    width: 175,
    height: 100,
    bladeHeight: 100,
    chamfer: 5,
    holes: 3,
    holeDiameter: 5,
    pinDiameter: 2.5,
    bodyThickness: 3,
    description: 'Serious reference for larger work. Timber framing, wide panels, workbench builds.',
  },
  '250mm': {
    label: '250mm',
    width: 250,
    height: 140,
    bladeHeight: 140,
    chamfer: 6,
    holes: 3,
    holeDiameter: 5,
    pinDiameter: 2.5,
    bodyThickness: 3,
    description: 'The full-size reference. For when precision at scale is non-negotiable.',
  },
}

export const BODY_MATERIALS = [
  { id: 'tool_steel', label: 'Tool Steel (AISI O1)', color: '#5A5A5A', metallic: '#7A7A7A', description: 'Ground flat stock, hardened and tempered. The traditional choice for precision reference tools.' },
  { id: 'titanium',   label: 'Titanium Grade 2',     color: '#A8A8A8', metallic: '#C8C8C8', description: 'Lightweight, corrosion-proof, and unmistakably premium. The same grade used in aerospace fasteners.' },
] as const

export const SCALE_TYPES = [
  { id: 'full_scale', label: 'Full Scale', description: 'Standard graduated scale for direct measurement reference.' },
  { id: 't45',        label: 'T45',        description: 'A 45\u00b0 reference edge across the top of the scale, giving you a third reference angle from a single tool.' },
] as const

/** Get body geometry for a (size, scaleType). */
export function getBody(size: SquareSize, scaleType: ScaleType): BodyShape {
  return SQUARE_BODIES[`${size}__${scaleType}`]
}

/** Get scale geometry for a (size, scaleType, variant). Falls back to narrow if wide_cf doesn't exist. */
export function getScale(size: SquareSize, scaleType: ScaleType, variant: ScaleVariant): ScaleShape | undefined {
  return SQUARE_SCALES[`${size}__${scaleType}__${variant}`] ?? SQUARE_SCALES[`${size}__${scaleType}__narrow`]
}

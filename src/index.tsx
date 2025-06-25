import TurboDragDrop from './NativeTurboDragDrop';
import type { LayoutPosition, WordMeasurement } from './NativeTurboDragDrop';

export function multiply(a: number, b: number): number {
  return TurboDragDrop.multiply(a, b);
}

export function move(input: number[], from: number, to: number): number[] {
  return TurboDragDrop.move(input, from, to).result;
}

export function between(
  value: number,
  min: number,
  max: number,
  inclusive: boolean
): boolean {
  return TurboDragDrop.between(value, min, max, inclusive);
}

export function lastOrder(orders: number[]): number {
  return TurboDragDrop.lastOrder(orders);
}

export function remove(orders: number[], index: number): number[] {
  return TurboDragDrop.remove(orders, index).result;
}

export function reorder(orders: number[], from: number, to: number): number[] {
  return TurboDragDrop.reorder(orders, from, to).result;
}

export function measureWords(viewTags: number[]): WordMeasurement[] {
  return TurboDragDrop.measureWords(viewTags).result;
}

export function calculateLayout(
  orders: number[],
  widths: number[],
  containerWidth: number,
  wordHeight: number,
  wordGap: number,
  lineGap: number,
  rtl: boolean
): LayoutPosition[] {
  return TurboDragDrop.calculateLayout(
    orders,
    widths,
    containerWidth,
    wordHeight,
    wordGap,
    lineGap,
    rtl
  ).result;
}

// Component exports
export { default as DuoDragDrop } from './components/DuoDragDrop';
export { default as SortableWord } from './components/SortableWord';
export { default as Placeholder } from './components/Placeholder';
export { default as Word } from './components/Word';
export { default as Lines } from './components/Lines';

// Type exports
export type {
  DuoWordAnimatedStyle,
  DuoAnimatedStyleWorklet,
  OnDropFunction,
  DropEvent,
  DuoDragDropRef,
} from './@types/index';

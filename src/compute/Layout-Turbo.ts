import TurboDragDrop from '../NativeTurboDragDrop';
import type { Offset } from './Layout';

export const lastOrder = (input: Offset[]) => {
  'worklet';
  const orders = input.map((o) => o.order.value);
  return TurboDragDrop.lastOrder(orders);
};

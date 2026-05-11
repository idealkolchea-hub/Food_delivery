import { useMemo } from 'react';
import { activeOrder, orderHistory } from '../data/mockData';

export function useOrders() {
  return useMemo(() => ({
    activeOrder,
    orderHistory,
  }), []);
}

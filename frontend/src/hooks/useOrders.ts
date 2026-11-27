import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { orderService, type OrderListParams } from "@/services/order.service";

export function useMyOrders(params: OrderListParams) {
  return useQuery({
    queryKey: queryKeys.orders.mine(params),
    queryFn: () => orderService.myOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => orderService.getById(id as string),
    enabled: Boolean(id),
  });
}

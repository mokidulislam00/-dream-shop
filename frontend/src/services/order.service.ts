import { api, cleanParams } from "./api";
import type {
  OrderDetailResponse,
  OrderListResponse,
  OrderResponse,
} from "@/types/api";
import type { Order, OrderStatus, ShippingAddress } from "@/types/models";

export interface PlaceOrderInput {
  shippingAddress: ShippingAddress;
  // Only Cash on Delivery is exposed: the backend has no online payment flow.
  paymentMethod: "cod";
}

export interface OrderListParams {
  page?: number;
  limit?: number;
}

export interface AdminOrderListParams extends OrderListParams {
  // One status or several (sent to the backend as a comma-separated list)
  status?: OrderStatus | OrderStatus[];
}

export const orderService = {
  // ---- customer ----
  async place(input: PlaceOrderInput): Promise<Order> {
    const { data } = await api.post<OrderResponse>("/orders", input);
    return data.order;
  },

  async myOrders(params: OrderListParams = {}): Promise<OrderListResponse> {
    const { data } = await api.get<OrderListResponse>("/orders/my-orders", {
      params: cleanParams(params),
    });
    return data;
  },

  async getById(id: string): Promise<Order> {
    const { data } = await api.get<OrderDetailResponse>(`/orders/${id}`);
    return data.order;
  },

  async cancel(id: string, reason?: string): Promise<Order> {
    const { data } = await api.patch<OrderResponse>(`/orders/${id}/cancel`, {
      ...(reason ? { reason } : {}),
    });
    return data.order;
  },

  // ---- admin ----
  async adminList(
    params: AdminOrderListParams = {}
  ): Promise<OrderListResponse> {
    const { status, ...rest } = params;
    const { data } = await api.get<OrderListResponse>("/orders/admin/all", {
      params: cleanParams({
        ...rest,
        status: Array.isArray(status) ? status.join(",") : status,
      }),
    });
    return data;
  },

  async adminGetById(id: string): Promise<Order> {
    const { data } = await api.get<OrderDetailResponse>(
      `/orders/admin/${id}`
    );
    return data.order;
  },

  async adminUpdateStatus(
    id: string,
    orderStatus: OrderStatus
  ): Promise<Order> {
    const { data } = await api.patch<OrderResponse>(
      `/orders/admin/${id}/status`,
      { orderStatus }
    );
    return data.order;
  },

  async adminConfirmCodPayment(id: string): Promise<Order> {
    const { data } = await api.patch<OrderResponse>(
      `/orders/admin/${id}/cod-payment`
    );
    return data.order;
  },
};

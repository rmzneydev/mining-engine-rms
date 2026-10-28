import type {
  RepairOrder,
  RepairOrderInput,
  RepairOrderStatus,
  StatusHistoryEntry,
} from '../types'
import { businessApi } from './http'

export interface OrderQuery {
  status?: string
  client_id?: string
  engine_id?: string
  search?: string
  skip?: number
  limit?: number
}

export function fetchOrders(query: OrderQuery = {}): Promise<RepairOrder[]> {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  const search = params.toString()
  return businessApi.get<RepairOrder[]>(`/repair-orders/${search ? `?${search}` : ''}`)
}

export function fetchOrder(id: string): Promise<RepairOrder> {
  return businessApi.get<RepairOrder>(`/repair-orders/${id}`)
}

export function createOrder(payload: RepairOrderInput): Promise<RepairOrder> {
  return businessApi.post<RepairOrder>('/repair-orders/', payload)
}

export function fetchOrderHistory(id: string): Promise<StatusHistoryEntry[]> {
  return businessApi.get<StatusHistoryEntry[]>(`/repair-orders/${id}/history`)
}

export function updateOrderStatus(
  id: string,
  status: RepairOrderStatus,
  notes?: string,
): Promise<RepairOrder> {
  return businessApi.patch<RepairOrder>(`/repair-orders/${id}/status`, {
    status,
    notes: notes?.trim() ? notes.trim() : null,
  })
}

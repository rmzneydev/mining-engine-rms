export type UserRole = 'admin' | 'operator'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
}

export interface AuthResponse {
  message: string
  user: User
  tokens: {
    accessToken: string
    expiresIn: string
  }
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}

export interface ApiValidationError {
  field: string
  message: string
}

export interface Client {
  id: string
  name: string
  identification_type: string
  identification_number: string
  email: string | null
  is_active: boolean
  created_at: string
}

export interface ClientInput {
  name: string
  identification_type: string
  identification_number: string
  email: string | null
  is_active: boolean
}

export interface Engine {
  id: string
  serial_number: string
  manufacturer: string
  model: string
  engine_type: string
  power_capacity: string
  client_id: string
  is_active: boolean
  created_at: string
}

export interface EngineInput {
  serial_number: string
  manufacturer: string
  model: string
  engine_type: string
  power_capacity: string
  client_id: string
  is_active: boolean
}

export type RepairOrderStatus =
  | 'received'
  | 'diagnosing'
  | 'waiting_approval'
  | 'repairing'
  | 'testing'
  | 'finished'
  | 'delivered'

export interface ClientSummary {
  id: string
  name: string
  identification_number: string
}

export interface EngineSummary {
  id: string
  serial_number: string
  manufacturer: string
  model: string
}

export interface RepairOrder {
  id: string
  order_number: string
  engine_id: string
  client_id: string
  received_at: string
  problem_description: string
  technical_diagnosis: string | null
  work_performed: string | null
  technician_name: string | null
  estimated_delivery: string | null
  actual_delivery: string | null
  status: RepairOrderStatus
  observations: string | null
  created_at: string
  updated_at: string
  client: ClientSummary | null
  engine: EngineSummary | null
}

export interface RepairOrderInput {
  engine_id: string
  problem_description: string
  technical_diagnosis: string | null
  work_performed: string | null
  technician_name: string | null
  estimated_delivery: string | null
  observations: string | null
}

export interface StatusHistoryEntry {
  id: string
  previous_status: RepairOrderStatus | null
  new_status: RepairOrderStatus
  changed_by: string | null
  changed_at: string
  notes: string | null
}

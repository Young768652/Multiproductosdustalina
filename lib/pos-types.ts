export type Role = "admin" | "cajero"

export interface Cashier {
  id: string
  name: string
  displayName?: string
  emoji: string
  role?: Role
  requiresPin?: boolean
  pin?: string
}

export type ServiceCategory = "copias" | "servicios" | "golosinas" | "libreria" | "aseo"

export type ServiceIconKey =
  | "copy-bw"
  | "copy-color"
  | "image"
  | "ring"
  | "laminate"
  | "scissors"
  | "printer"
  | "scan"
  | "file"
  | "candy"
  | "lollipop"
  | "cookie"
  | "chips"
  | "soda"
  | "pencil"
  | "pen"
  | "eraser"
  | "notebook"
  | "paper"
  | "folder"
  | "envelope"
  | "tape"
  | "ruler"
  | "marker"
  | "toothbrush"
  | "toothpaste"
  | "floss"
  | "soap"
  | "tissue"

export interface Service {
  id: string
  name: string
  price: number
  unit: string
  icon: ServiceIconKey
  category: ServiceCategory
  perSheetHint?: boolean
  isFavorite?: boolean
  stock?: number
  minStock?: number
}

export interface CartItem {
  id: string
  serviceId: string
  name: string
  unitPrice: number
  quantity: number
  unit: string
}

export interface Client {
  id: string
  name: string
  emoji: string
  creditLimit?: number
}

export interface CreditPayment {
  id: string
  amount: number
  date: string
  cashierId: string
  cashierName: string
}

export interface Credit {
  id: string
  clientName: string
  clientId?: string
  items: CartItem[]
  originalAmount: number
  payments: CreditPayment[]
  createdAt: string
  updatedAt: string
  cashierId: string
  cashierName: string
}

export type PaymentMethod = "efectivo" | "yape" | "fiado"

export interface Sale {
  id: string
  items: CartItem[]
  total: number
  paymentType: PaymentMethod
  received?: number
  change?: number
  createdAt: string
  cashierId: string
  cashierName: string
}
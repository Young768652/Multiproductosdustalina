"use client"

import React, { createContext, useCallback, useContext, useMemo } from "react"
import { useLocalStorage } from "./use-local-storage"
import type {
  Cashier,
  CartItem,
  Client,
  Credit,
  CreditPayment,
  Sale,
  Service,
} from "./pos-types"

const KEYS = {
  cashiers: "pos.cashiers.v3",
  services: "pos.services.v5",
  clients: "pos.clients.v3",
  sales: "pos.sales.v3",
  credits: "pos.credits.v3",
  activeCashier: "pos.activeCashier.v3",
}

const uid = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const DEFAULT_CASHIERS: Cashier[] = [
  { id: "abuelita", name: "Abuelita", emoji: "👵", role: "cajero", requiresPin: false },
  { id: "admin", name: "Administrador", emoji: "🧑‍💼", role: "admin", requiresPin: true, pin: "1234" },
]

export function isAdmin(c: Cashier | null | undefined) {
  return !!c && (c.role === "admin" || c.id === "admin")
}

// COPIAS Y SERVICIOS NO TIENEN STOCK (Servicios ilimitados)
const DEFAULT_SERVICES: Service[] = [
  { id: "copia-bn", name: "Copia B/N", price: 0.2, unit: "hoja", icon: "copy-bw", category: "copias", isFavorite: true },
  { id: "copia-color-simple", name: "Copia Color Texto", price: 0.3, unit: "hoja", icon: "copy-color", category: "copias", isFavorite: true },
  { id: "copia-color-full", name: "Copia Color Imagen", price: 0.5, unit: "hoja", icon: "image", category: "copias", isFavorite: false },
  { id: "anillado", name: "Anillado", price: 3, unit: "unidad", icon: "ring", category: "servicios", perSheetHint: true, isFavorite: true },
  { id: "enmicado", name: "Enmicado / Plastificado", price: 2, unit: "unidad", icon: "laminate", category: "servicios", isFavorite: false },
  { id: "guillotina", name: "Guillotina / Cortado", price: 0.5, unit: "corte", icon: "scissors", category: "servicios", isFavorite: false },

  // 🍬 Golosinas (Sí llevan control de Stock)
  { id: "chizitos", name: "Chizitos", price: 1, unit: "unidad", icon: "chips", category: "golosinas", isFavorite: true, stock: 15, minStock: 3 },
  { id: "papitas", name: "Papitas (Ondas)", price: 1.5, unit: "unidad", icon: "chips", category: "golosinas", isFavorite: true, stock: 12, minStock: 3 },
  { id: "galletas", name: "Galletas", price: 1, unit: "unidad", icon: "cookie", category: "golosinas", isFavorite: false, stock: 20, minStock: 5 },
  { id: "caramelos", name: "Caramelos", price: 0.2, unit: "unidad", icon: "candy", category: "golosinas", isFavorite: false, stock: 100, minStock: 20 },
  { id: "chocolates", name: "Chocolates", price: 2, unit: "unidad", icon: "candy", category: "golosinas", isFavorite: false, stock: 10, minStock: 2 },
  { id: "chupetines", name: "Chupetines", price: 0.5, unit: "unidad", icon: "lollipop", category: "golosinas", isFavorite: false, stock: 30, minStock: 5 },
  { id: "gaseosa", name: "Gaseosa / Bebida", price: 2.5, unit: "unidad", icon: "soda", category: "golosinas", isFavorite: false, stock: 18, minStock: 4 },

  // ✏️ Librería (Sí llevan control de Stock)
  { id: "lapiz", name: "Lápiz", price: 0.5, unit: "unidad", icon: "pencil", category: "libreria", isFavorite: false, stock: 50, minStock: 10 },
  { id: "lapicero-azul", name: "Lapicero Azul", price: 0.5, unit: "unidad", icon: "pen", category: "libreria", isFavorite: true, stock: 40, minStock: 10 },
  { id: "lapicero-negro", name: "Lapicero Negro", price: 0.5, unit: "unidad", icon: "pen", category: "libreria", isFavorite: false, stock: 30, minStock: 5 },
  { id: "lapicero-rojo", name: "Lapicero Rojo", price: 0.5, unit: "unidad", icon: "pen", category: "libreria", isFavorite: false, stock: 20, minStock: 5 },
  { id: "borrador", name: "Borrador", price: 0.5, unit: "unidad", icon: "eraser", category: "libreria", isFavorite: false, stock: 25, minStock: 5 },
  { id: "tajador", name: "Tajador", price: 0.5, unit: "unidad", icon: "pencil", category: "libreria", isFavorite: false, stock: 15, minStock: 3 },
  { id: "cuaderno", name: "Cuaderno", price: 3, unit: "unidad", icon: "notebook", category: "libreria", isFavorite: true, stock: 25, minStock: 5 },
  { id: "hojas-paquete", name: "Hojas Bond (paquete)", price: 12, unit: "paquete", icon: "paper", category: "libreria", isFavorite: false, stock: 8, minStock: 2 },
  { id: "folder", name: "Folder", price: 0.5, unit: "unidad", icon: "folder", category: "libreria", isFavorite: false, stock: 30, minStock: 5 },
  { id: "sobre-manila", name: "Sobre Manila", price: 0.5, unit: "unidad", icon: "envelope", category: "libreria", isFavorite: false, stock: 40, minStock: 10 },

  // 🪥 Aseo (Sí llevan control de Stock)
  { id: "cepillo-dientes", name: "Cepillo de Dientes", price: 3, unit: "unidad", icon: "toothbrush", category: "aseo", isFavorite: false, stock: 10, minStock: 2 },
  { id: "pasta-dental", name: "Pasta Dental", price: 4, unit: "unidad", icon: "toothpaste", category: "aseo", isFavorite: false, stock: 8, minStock: 2 },
]

const DEFAULT_CLIENTS: Client[] = [
  { id: "don-carlos", name: "Don Carlos", emoji: "👨‍🦳", creditLimit: 50 },
  { id: "vecina-maria", name: "Vecina María", emoji: "👩", creditLimit: 30 },
]

type PosContextValue = {
  hydrated: boolean
  cashiers: Cashier[]
  services: Service[]
  clients: Client[]
  sales: Sale[]
  credits: Credit[]
  activeCashier: Cashier | null
  setActiveCashierId: (id: string | null) => void
  addCashier: (c: Omit<Cashier, "id">) => void
  updateCashier: (id: string, patch: Partial<Cashier>) => void
  removeCashier: (id: string) => void
  addService: (s: Omit<Service, "id">) => void
  updateService: (id: string, patch: Partial<Service>) => void
  removeService: (id: string) => void
  addClient: (name: string, emoji?: string, creditLimit?: number) => Client
  recordSale: (sale: Omit<Sale, "id" | "createdAt" | "cashierId" | "cashierName">) => void
  addCredit: (input: { clientName: string; clientId?: string; items: CartItem[]; total: number }) => void
  addCreditPayment: (creditId: string, amount: number) => void
  downloadBackup: () => void
}

const PosContext = createContext<PosContextValue | null>(null)

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [cashiers, setCashiers, hCashiers] = useLocalStorage<Cashier[]>(KEYS.cashiers, DEFAULT_CASHIERS)
  const [services, setServices, hServices] = useLocalStorage<Service[]>(KEYS.services, DEFAULT_SERVICES)
  const [clients, setClients, hClients] = useLocalStorage<Client[]>(KEYS.clients, DEFAULT_CLIENTS)
  const [sales, setSales, hSales] = useLocalStorage<Sale[]>(KEYS.sales, [])
  const [credits, setCredits, hCredits] = useLocalStorage<Credit[]>(KEYS.credits, [])
  const [activeCashierId, setActiveCashierIdRaw, hActive] = useLocalStorage<string | null>(KEYS.activeCashier, "abuelita")

  const hydrated = hCashiers && hServices && hClients && hSales && hCredits && hActive

  const activeCashier = useMemo(
    () => cashiers.find((c) => c.id === activeCashierId) ?? cashiers[0] ?? null,
    [cashiers, activeCashierId],
  )

  const setActiveCashierId = useCallback((id: string | null) => setActiveCashierIdRaw(id), [setActiveCashierIdRaw])

  const addCashier = useCallback((c: Omit<Cashier, "id">) => {
    setCashiers((prev) => {
      const cleanName = c.name.trim()
      if (!cleanName || prev.some((x) => x.name.trim().toLowerCase() === cleanName.toLowerCase())) {
        return prev
      }
      return [...prev, { ...c, name: cleanName, id: uid() }]
    })
  }, [setCashiers])

  const updateCashier = useCallback((id: string, patch: Partial<Cashier>) => {
    setCashiers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [setCashiers])

  const removeCashier = useCallback((id: string) => {
    if (id === "admin") return
    setCashiers((prev) => prev.filter((c) => c.id !== id))
    setActiveCashierIdRaw((cur) => (cur === id ? "abuelita" : cur))
  }, [setCashiers, setActiveCashierIdRaw])

  const addService = useCallback((s: Omit<Service, "id">) => {
    setServices((prev) => [...prev, { ...s, id: uid() }])
  }, [setServices])

  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [setServices])

  const removeService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id))
  }, [setServices])

  const addClient = useCallback((name: string, emoji = "🙂", creditLimit = 50) => {
    const client: Client = { id: uid(), name: name.trim(), emoji, creditLimit }
    setClients((prev) => [...prev, client])
    return client
  }, [setClients])

  const recordSale = useCallback((sale: Omit<Sale, "id" | "createdAt" | "cashierId" | "cashierName">) => {
    const now = new Date().toISOString()
    setSales((prev) => [
      {
        ...sale,
        id: uid(),
        createdAt: now,
        cashierId: activeCashier?.id ?? "desconocido",
        cashierName: activeCashier?.name ?? "Desconocido",
      },
      ...prev,
    ])

    // Solo descuenta stock si el item TIENE definido el stock
    setServices((prevServices) =>
      prevServices.map((srv) => {
        const itemInSale = sale.items.find((it) => it.serviceId === srv.id)
        if (itemInSale && srv.stock !== undefined) {
          return { ...srv, stock: Math.max(0, srv.stock - itemInSale.quantity) }
        }
        return srv
      })
    )
  }, [setSales, setServices, activeCashier])

  const addCredit = useCallback((input: { clientName: string; clientId?: string; items: CartItem[]; total: number }) => {
    const now = new Date().toISOString()
    const credit: Credit = {
      id: uid(),
      clientName: input.clientName.trim(),
      clientId: input.clientId,
      items: input.items,
      originalAmount: input.total,
      payments: [],
      createdAt: now,
      updatedAt: now,
      cashierId: activeCashier?.id ?? "desconocido",
      cashierName: activeCashier?.name ?? "Desconocido",
    }
    setCredits((prev) => [credit, ...prev])
    recordSale({ items: input.items, total: input.total, paymentType: "fiado" })
  }, [setCredits, activeCashier, recordSale])

  const addCreditPayment = useCallback((creditId: string, amount: number) => {
    const payment: CreditPayment = {
      id: uid(),
      amount,
      date: new Date().toISOString(),
      cashierId: activeCashier?.id ?? "desconocido",
      cashierName: activeCashier?.name ?? "Desconocido",
    }
    setCredits((prev) =>
      prev.map((c) =>
        c.id === creditId ? { ...c, payments: [...c.payments, payment], updatedAt: payment.date } : c
      )
    )
  }, [setCredits, activeCashier])

  const downloadBackup = useCallback(() => {
    if (sales.length === 0) {
      alert("Aún no hay ventas registradas hoy para exportar.")
      return
    }

    let csvContent = "\uFEFF"
    csvContent += "FECHA Y HORA;ATENDIDO POR;METODO DE PAGO;TOTAL (S/.)\n"

    sales.forEach((s) => {
      const fecha = new Date(s.createdAt).toLocaleString()
      csvContent += `"${fecha}";"${s.cashierName}";"${s.paymentType.toUpperCase()}";"${s.total.toFixed(2)}"\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Ventas_CajaFamiliar_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }, [sales])

  return (
    <PosContext.Provider
      value={{
        hydrated,
        cashiers,
        services,
        clients,
        sales,
        credits,
        activeCashier,
        setActiveCashierId,
        addCashier,
        updateCashier,
        removeCashier,
        addService,
        updateService,
        removeService,
        addClient,
        recordSale,
        addCredit,
        addCreditPayment,
        downloadBackup,
      }}
    >
      {children}
    </PosContext.Provider>
  )
}

export function usePos() {
  const ctx = useContext(PosContext)
  if (!ctx) throw new Error("usePos debe usarse dentro de <PosProvider>")
  return ctx
}

export function creditPaid(c: Credit) {
  return c.payments.reduce((sum, p) => sum + p.amount, 0)
}
export function creditBalance(c: Credit) {
  return Math.max(0, c.originalAmount - creditPaid(c))
}
export function isCreditSettled(c: Credit) {
  return creditBalance(c) <= 0.0001
}
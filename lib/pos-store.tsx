"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Cashier, Service, Sale, Credit, Client } from "./pos-types"

export const INITIAL_SERVICES: Service[] = [
  { id: "1", name: "Copia Blanco y negro", price: 0.20, unit: "hoja", icon: "copy-bw", category: "copias", isFavorite: true },
  { id: "2", name: "Copia Color", price: 0.30, unit: "hoja", icon: "copy-color", category: "copias", isFavorite: true },
  { id: "3", name: "Copia Color Imagen", price: 0.50, unit: "hoja", icon: "image", category: "copias" },
  { id: "4", name: "Anillado", price: 3.00, unit: "unidad", icon: "ring", category: "servicios", perSheetHint: true, isFavorite: true },
  { id: "5", name: "Enmicado / Plastificado", price: 2.00, unit: "unidad", icon: "laminate", category: "servicios" },
  { id: "6", name: "Guillotina / Corte", price: 0.50, unit: "corte", icon: "scissors", category: "servicios" },
  { id: "7", name: "Impresión B/N", price: 0.30, unit: "hoja", icon: "printer", category: "copias" },
  { id: "8", name: "Escanear / Digitalizar", price: 1.00, unit: "documento", icon: "scan", category: "servicios" },
  { id: "9", name: "Chizitos / Golosinas", price: 1.00, cost: 0.70, stock: 20, minStock: 5, unit: "unidad", icon: "chips", category: "golosinas" },
]

export const CASHIERS: Cashier[] = [
  { id: "admin", name: "Administrador", emoji: "💼", role: "admin", requiresPin: true, pin: "1234" },
  { id: "cajero1", name: "Jamela", emoji: "👧", role: "cajero" },
]

export const INITIAL_CLIENTS: Client[] = [
  { id: "cli-1", name: "Familia Castro", emoji: "🏠", creditLimit: 100 },
  { id: "cli-2", name: "Profesor Juan", emoji: "👨‍🏫", creditLimit: 50 },
]

interface PosContextType {
  services: Service[]
  cashiers: Cashier[]
  sales: Sale[]
  credits: Credit[]
  clients: Client[]
  activeCashier: Cashier | null
  hydrated: boolean
  setActiveCashierId: (id: string) => void
  addService: (service: Omit<Service, "id">) => void
  updateService: (id: string, patch: Partial<Service>) => void
  removeService: (id: string) => void
  toggleFavorite: (id: string) => void
  resetCatalog: () => void
  addCashier: (cashier: Omit<Cashier, "id">) => void
  updateCashier: (id: string, patch: Partial<Cashier>) => void
  removeCashier: (id: string) => void
  addSale: (sale: Omit<Sale, "id" | "createdAt">) => void
  addCredit: (credit: Omit<Credit, "id" | "createdAt" | "updatedAt" | "payments">) => void
  addCreditPayment: (creditId: string, amount: number) => void
  addClient: (client: Omit<Client, "id">) => void
  downloadBackup: () => void
}

const PosContext = createContext<PosContextType | null>(null)

const STORAGE_KEYS = {
  SERVICES: "dustalina_pos_services_v2",
  CASHIERS: "dustalina_pos_cashiers_v2",
  SALES: "dustalina_pos_sales_v2",
  CREDITS: "dustalina_pos_credits_v2",
  CLIENTS: "dustalina_pos_clients_v2",
  ACTIVE_CASHIER: "dustalina_pos_active_cashier_v2",
}

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES)
  const [cashiers, setCashiers] = useState<Cashier[]>(CASHIERS)
  const [sales, setSales] = useState<Sale[]>([])
  const [credits, setCredits] = useState<Credit[]>([])
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS)
  const [activeCashierId, setActiveCashierIdState] = useState<string>("admin")

  useEffect(() => {
    try {
      const savedServices = localStorage.getItem(STORAGE_KEYS.SERVICES)
      const savedCashiers = localStorage.getItem(STORAGE_KEYS.CASHIERS)
      const savedSales = localStorage.getItem(STORAGE_KEYS.SALES)
      const savedCredits = localStorage.getItem(STORAGE_KEYS.CREDITS)
      const savedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS)
      const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_CASHIER)

      if (savedServices) setServices(JSON.parse(savedServices))
      if (savedCashiers) setCashiers(JSON.parse(savedCashiers))
      if (savedSales) setSales(JSON.parse(savedSales))
      if (savedCredits) setCredits(JSON.parse(savedCredits))
      if (savedClients) setClients(JSON.parse(savedClients))
      if (savedActive) setActiveCashierIdState(savedActive)
    } catch (e) {
      console.error("Error al cargar datos de localStorage", e)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services))
    localStorage.setItem(STORAGE_KEYS.CASHIERS, JSON.stringify(cashiers))
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales))
    localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(credits))
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CASHIER, activeCashierId)
  }, [services, cashiers, sales, credits, clients, activeCashierId, hydrated])

  const activeCashier = cashiers.find((c) => c.id === activeCashierId) || cashiers[0]

  const setActiveCashierId = useCallback((id: string) => {
    setActiveCashierIdState(id)
  }, [])

  const addService = useCallback((s: Omit<Service, "id">) => {
    const newService: Service = { ...s, id: Date.now().toString() }
    setServices((prev) => [...prev, newService])
  }, [])

  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const removeService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)))
  }, [])

  const resetCatalog = useCallback(() => {
    if (confirm("¿Deseas restaurar la lista oficial de productos limpiando elementos antiguos?")) {
      setServices(INITIAL_SERVICES)
      localStorage.removeItem(STORAGE_KEYS.SERVICES)
    }
  }, [])

  const addCashier = useCallback((c: Omit<Cashier, "id">) => {
    const newCashier: Cashier = { ...c, id: Date.now().toString() }
    setCashiers((prev) => [...prev, newCashier])
  }, [])

  const updateCashier = useCallback((id: string, patch: Partial<Cashier>) => {
    setCashiers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const removeCashier = useCallback((id: string) => {
    setCashiers((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addSale = useCallback((s: Omit<Sale, "id" | "createdAt">) => {
    const newSale: Sale = {
      ...s,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setSales((prev) => [newSale, ...prev])
  }, [])

  const addCredit = useCallback((c: Omit<Credit, "id" | "createdAt" | "updatedAt" | "payments">) => {
    const newCredit: Credit = {
      ...c,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
    }
    setCredits((prev) => [newCredit, ...prev])
  }, [])

  const addCreditPayment = useCallback((creditId: string, amount: number) => {
    setCredits((prev) =>
      prev.map((c) => {
        if (c.id !== creditId) return c
        const newPayment = {
          id: Date.now().toString(),
          amount,
          date: new Date().toISOString(),
          cashierId: activeCashier.id,
          cashierName: activeCashier.name,
        }
        return {
          ...c,
          updatedAt: new Date().toISOString(),
          payments: [...c.payments, newPayment],
        }
      })
    )
  }, [activeCashier])

  const addClient = useCallback((cl: Omit<Client, "id">) => {
    const newClient: Client = { ...cl, id: Date.now().toString() }
    setClients((prev) => [...prev, newClient])
  }, [])

  const downloadBackup = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ services, sales, credits, clients }, null, 2))
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `respaldo_tienda_dustalina_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [services, sales, credits, clients])

  return (
    <PosContext.Provider
      value={{
        services,
        cashiers,
        sales,
        credits,
        clients,
        activeCashier,
        hydrated,
        setActiveCashierId,
        addService,
        updateService,
        removeService,
        toggleFavorite,
        resetCatalog,
        addCashier,
        updateCashier,
        removeCashier,
        addSale,
        addCredit,
        addCreditPayment,
        addClient,
        downloadBackup,
      }}
    >
      {children}
    </PosContext.Provider>
  )
}

export function usePos() {
  const context = useContext(PosContext)
  if (!context) throw new Error("usePos debe usarse dentro de <PosProvider>")
  return context
}

export function isAdmin(cashier: Cashier | null): boolean {
  return cashier?.role === "admin"
}

export function isCreditSettled(credit: Credit): boolean {
  const paid = credit.payments.reduce((sum, p) => sum + p.amount, 0)
  return paid >= credit.originalAmount
}

export function creditBalance(credit: Credit): number {
  const paid = credit.payments.reduce((sum, p) => sum + p.amount, 0)
  return Math.max(0, credit.originalAmount - paid)
}
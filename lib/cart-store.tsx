"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { CartItem } from "./pos-types"
import { round2 } from "./format"

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

type CartContextValue = {
  items: CartItem[]
  total: number
  count: number
  addItem: (item: Omit<CartItem, "id">) => void
  setQuantity: (id: string, quantity: number) => void
  updateItem: (id: string, patch: Partial<CartItem>) => void
  removeItem: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      // Buscamos si el producto con el mismo id de servicio y precio ya existe en el carrito
      const existingIndex = prev.findIndex(
        (it) => it.serviceId === item.serviceId && it.unitPrice === item.unitPrice && it.name === item.name
      )

      if (existingIndex > -1) {
        // Si ya existe, le sumamos la cantidad (ej. si era 1 y agregamos 19, queda en 20)
        return prev.map((it, idx) =>
          idx === existingIndex
            ? { ...it, quantity: it.quantity + item.quantity }
            : it
        )
      }

      // Si no existe, creamos el nuevo ítem con id único
      return [...prev, { ...item, id: uid() }]
    })
  }, [])

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, quantity: Math.max(0, quantity) } : it))
        .filter((it) => it.quantity > 0),
    )
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<CartItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const total = useMemo(
    () => round2(items.reduce((sum, it) => sum + round2(it.unitPrice * it.quantity), 0)),
    [items],
  )
  const count = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items],
  )

  const value: CartContextValue = {
    items,
    total,
    count,
    addItem,
    setQuantity,
    updateItem,
    removeItem,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>")
  return ctx
}
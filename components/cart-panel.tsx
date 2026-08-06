"use client"

import { useState } from "react"
import { Minus, Plus, Trash2, ShoppingCart, BookOpen, Wallet } from "lucide-react"
import { usePos } from "@/lib/pos-store"
import { useCart } from "@/lib/cart-store"
import { soles } from "@/lib/format"
import { CheckoutModal } from "@/components/checkout-modal"
import { FiadoModal } from "@/components/fiado-modal"

export function CartPanel() {
  const { activeCashier } = usePos()
  const { items, total, count, setQuantity, removeItem, clear } = useCart()
  const [checkout, setCheckout] = useState(false)
  const [fiado, setFiado] = useState(false)

  const disabled = items.length === 0 || !activeCashier

  function handleClearCart() {
    if (confirm("¿Estás seguro de que deseas vaciar todos los productos del carrito?")) {
      clear()
    }
  }

  return (
    <aside
      aria-label="Venta actual"
      className="flex h-full min-h-0 flex-col rounded-3xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-xl font-extrabold">
          <ShoppingCart className="size-6 text-primary" />
          Venta actual
          {count > 0 ? (
            <span className="grid min-w-7 place-items-center rounded-full bg-primary px-2 py-0.5 text-sm font-bold text-primary-foreground">
              {count}
            </span>
          ) : null}
        </h2>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={handleClearCart}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10"
          >
            Vaciar
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <ShoppingCart className="size-12 opacity-40" />
            <p className="mt-3 text-pretty font-medium">
              Toca un servicio para empezar a cobrar.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="rounded-2xl border border-border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-pretty font-bold leading-tight">{it.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {soles(it.unitPrice)} / {it.unit}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold">
                    {soles(it.unitPrice * it.quantity)}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      it.quantity <= 1 ? removeItem(it.id) : setQuantity(it.id, it.quantity - 1)
                    }
                    className="grid size-11 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary"
                    aria-label="Restar"
                  >
                    <Minus className="size-5" />
                  </button>
                  <span className="min-w-10 text-center text-xl font-extrabold">
                    {it.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(it.id, it.quantity + 1)}
                    className="grid size-11 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary"
                    aria-label="Sumar"
                  >
                    <Plus className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="ml-auto grid size-11 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Quitar ${it.name}`}
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-base font-semibold text-muted-foreground">Total</span>
          <span className="text-4xl font-extrabold tracking-tight">{soles(total)}</span>
        </div>
        {!activeCashier ? (
          <p className="mb-3 rounded-xl bg-secondary px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
            Elige un cajero arriba para poder cobrar.
          </p>
        ) : null}
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setCheckout(true)}
            disabled={disabled}
            className="flex h-16 items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Wallet className="size-6" />
            Cobrar
          </button>
          <button
            type="button"
            onClick={() => setFiado(true)}
            disabled={disabled}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl text-lg font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{
              backgroundColor: "var(--warning)",
              color: "var(--warning-foreground)",
            }}
          >
            <BookOpen className="size-5" />
            Anotar Fiado
          </button>
        </div>
      </div>

      <CheckoutModal open={checkout} onClose={() => setCheckout(false)} />
      <FiadoModal open={fiado} onClose={() => setFiado(false)} />
    </aside>
  )
}
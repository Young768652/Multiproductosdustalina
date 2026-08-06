"use client"

import { useEffect, useMemo, useState } from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import type { Service } from "@/lib/pos-types"
import { useCart } from "@/lib/cart-store"
import { soles } from "@/lib/format"
import { Modal } from "@/components/ui/modal"
import { ServiceIcon } from "@/components/service-icon"

const QUICK = [1, 2, 5, 10, 20]

function suggestRingPrice(sheets: number, base: number) {
  if (sheets <= 0) return base
  if (sheets <= 50) return base
  if (sheets <= 100) return base + 1
  if (sheets <= 200) return base + 2
  return base + 3
}

export function ServiceQuantityModal({
  service,
  onClose,
}: {
  service: Service | null
  onClose: () => void
}) {
  const { addItem } = useCart()
  // Usamos un string para el input de cantidad para que se pueda borrar libremente
  const [quantityInput, setQuantityInput] = useState("1")
  const [unitPrice, setUnitPrice] = useState(0)
  const [sheets, setSheets] = useState(0)

  useEffect(() => {
    if (service) {
      setQuantityInput("1")
      setUnitPrice(service.price)
      setSheets(0)
    }
  }, [service])

  const suggested = useMemo(
    () => (service?.perSheetHint ? suggestRingPrice(sheets, service.price) : null),
    [service, sheets],
  )

  if (!service) return null

  // Calculamos la cantidad numérica para el subtotal
  const parsedQty = Math.max(1, Number(quantityInput) || 1)
  const subtotal = unitPrice * parsedQty

  function confirm() {
    if (!service || parsedQty <= 0) return
    addItem({
      serviceId: service.id,
      name:
        service.perSheetHint && sheets > 0
          ? `${service.name} (${sheets} hojas)`
          : service.name,
      unitPrice,
      quantity: parsedQty,
      unit: service.unit,
    })
    onClose()
  }

  return (
    <Modal
      open={!!service}
      onClose={onClose}
      title={service.name}
      description={`Precio por ${service.unit}. Puedes cambiarlo si es necesario.`}
      footer={
        <button
          type="button"
          onClick={confirm}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ShoppingCart className="size-6" />
          Agregar · {soles(subtotal)}
        </button>
      }
    >
      <div className="flex items-center gap-4 rounded-2xl bg-accent p-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-card text-primary">
          <ServiceIcon name={service.icon} className="size-8" />
        </span>
        <div>
          <p className="text-sm font-medium text-accent-foreground">Subtotal actual</p>
          <p className="text-3xl font-extrabold text-foreground">{soles(subtotal)}</p>
        </div>
      </div>

      {/* Estimador de hojas (anillado) */}
      {service.perSheetHint ? (
        <div className="mt-4 rounded-2xl border border-border p-4">
          <label className="text-sm font-bold">Cantidad de hojas del documento</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={sheets === 0 ? "" : sheets}
              onChange={(e) => setSheets(Math.max(0, Number(e.target.value) || 0))}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="h-14 w-32 rounded-xl border border-input bg-background px-3 text-center text-2xl font-bold outline-none focus:border-primary"
            />
            {suggested != null && sheets > 0 ? (
              <button
                type="button"
                onClick={() => setUnitPrice(suggested)}
                className="h-14 flex-1 rounded-xl bg-secondary px-4 text-left text-sm font-semibold transition-colors hover:bg-accent"
              >
                Precio sugerido:{" "}
                <span className="text-base font-extrabold text-primary">{soles(suggested)}</span>
                <span className="block text-xs text-muted-foreground">Toca para usarlo</span>
              </button>
            ) : (
              <p className="flex-1 text-sm text-muted-foreground">
                Ingresa las hojas para sugerir el costo del anillo.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Cantidad rápida y edición de input libre */}
      <div className="mt-4">
        <p className="mb-2 text-sm font-bold">Cantidad ({service.unit})</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantityInput(String(Math.max(1, parsedQty - 1)))}
            className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border bg-card transition-colors hover:bg-secondary"
            aria-label="Restar uno"
          >
            <Minus className="size-6" />
          </button>
          
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)} // Permite borrar libremente el 1
            onFocus={(e) => e.target.select()} // Selecciona todo al hacer clic para escribir directo
            onBlur={() => {
              if (!quantityInput || Number(quantityInput) <= 0) {
                setQuantityInput("1")
              }
            }}
            className="h-16 w-full rounded-2xl border-2 border-border bg-background text-center text-4xl font-extrabold outline-none focus:border-primary"
          />

          <button
            type="button"
            onClick={() => setQuantityInput(String(parsedQty + 1))}
            className="grid size-14 shrink-0 place-items-center rounded-2xl border border-border bg-card transition-colors hover:bg-secondary"
            aria-label="Sumar uno"
          >
            <Plus className="size-6" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          {QUICK.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuantityInput(String(n))}
              className={`h-14 rounded-xl border text-lg font-bold transition-colors ${
                parsedQty === n
                  ? "border-primary bg-accent text-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setQuantityInput(String(parsedQty + 1))}
            className="h-14 rounded-xl border border-border bg-card font-bold transition-colors hover:bg-secondary"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => setQuantityInput(String(parsedQty + 5))}
            className="h-14 rounded-xl border border-border bg-card font-bold transition-colors hover:bg-secondary"
          >
            +5
          </button>
        </div>
      </div>

      {/* Precio editable con selección automática al hacer clic */}
      <div className="mt-4 rounded-2xl border border-border p-4">
        <label className="text-sm font-bold">Precio por {service.unit} (editable)</label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-2xl font-bold text-muted-foreground">S/.</span>
          <input
            type="number"
            min={0}
            step="0.10"
            inputMode="decimal"
            value={unitPrice === 0 ? "" : unitPrice}
            onChange={(e) => setUnitPrice(e.target.value === "" ? 0 : Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            className="h-14 w-40 rounded-xl border border-input bg-background px-3 text-2xl font-bold outline-none focus:border-primary"
          />
        </div>
      </div>
    </Modal>
  )
}
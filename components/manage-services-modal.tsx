"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { usePos } from "@/lib/pos-store"
import type { ServiceCategory, ServiceIconKey } from "@/lib/pos-types"
import { Modal } from "@/components/ui/modal"
import { ServiceIcon, SERVICE_ICON_KEYS } from "@/components/service-icon"

export function ManageServicesModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { services, updateService, removeService, addService } = usePos()
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [unit, setUnit] = useState("unidad")
  const [category, setCategory] = useState<ServiceCategory>("servicios")
  const [icon, setIcon] = useState<ServiceIconKey>("file")

  const isPhysicalProduct = category === "golosinas" || category === "libreria" || category === "aseo"

  function create() {
    if (!name.trim()) return
    addService({
      name: name.trim(),
      price: Math.max(0, Number(price.replace(",", ".")) || 0),
      ...(isPhysicalProduct
        ? {
            stock: Math.max(0, Number(stock) || 0),
            minStock: 5,
          }
        : {}),
      unit: unit.trim() || "unidad",
      category,
      icon,
    })
    setName("")
    setPrice("")
    setStock("")
    setUnit("unidad")
    setIcon("file")
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gestión de Productos e Inventario"
      description="Edita precios y stock disponible. Los cambios se guardan al instante."
      size="lg"
    >
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {services.map((s) => {
          const hasStockControl = s.stock !== undefined
          return (
            <div
              key={s.id}
              className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                <ServiceIcon name={s.icon} className="size-5" />
              </span>

              <input
                value={s.name}
                onChange={(e) => updateService(s.id, { name: e.target.value })}
                className="h-11 min-w-32 flex-1 rounded-xl border border-input bg-background px-3 font-bold text-sm outline-none focus:border-primary"
                aria-label="Nombre del producto"
              />

              <div className="flex items-center gap-1 rounded-xl border border-input bg-background px-2">
                <span className="text-xs font-bold text-muted-foreground">S/.</span>
                <input
                  type="number"
                  min={0}
                  step="0.10"
                  inputMode="decimal"
                  value={s.price === 0 ? "" : s.price}
                  onChange={(e) => {
                    const val = e.target.value
                    updateService(s.id, { price: val === "" ? 0 : Number(val.replace(",", ".")) })
                  }}
                  onFocus={(e) => e.target.select()}
                  className="h-11 w-16 bg-transparent text-center text-sm font-extrabold outline-none"
                  aria-label="Precio"
                />
              </div>

              {hasStockControl ? (
                <div className="flex items-center gap-1 rounded-xl border border-input bg-background px-2" title="Stock actual">
                  <span className="text-xs font-bold text-muted-foreground">Stock:</span>
                  <input
                    type="number"
                    min={0}
                    value={s.stock === 0 ? "" : (s.stock ?? "")}
                    onChange={(e) => {
                      const val = e.target.value
                      updateService(s.id, { stock: val === "" ? 0 : Number(val) })
                    }}
                    onFocus={(e) => e.target.select()}
                    className="h-11 w-16 bg-transparent text-center text-sm font-extrabold text-primary outline-none"
                    aria-label="Stock"
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => removeService(s.id)}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Eliminar ${s.name}`}
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-5 rounded-3xl border-2 border-dashed border-border p-4 bg-secondary/20">
        <p className="mb-3 text-base font-extrabold">Añadir Nuevo Producto / Servicio</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-bold sm:col-span-3">
            Nombre del producto o servicio
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Chizitos, Cuaderno, Copia DNI"
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-medium"
            />
          </label>

          <label className="text-sm font-bold">
            Precio (S/.)
            <input
              type="number"
              min={0}
              step="0.10"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-bold"
            />
          </label>

          {isPhysicalProduct ? (
            <label className="text-sm font-bold">
              Stock Inicial (unidades)
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Ej. 20"
                className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-bold text-primary"
              />
            </label>
          ) : null}

          <label className="text-sm font-bold">
            Unidad
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="unidad, hoja, paquete..."
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-medium"
            />
          </label>

          <label className="text-sm font-bold sm:col-span-2">
            Categoría / Sección
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-bold"
            >
              <option value="copias">📄 Impresiones y Copias (Sin Stock)</option>
              <option value="servicios">🌀 Servicios Adicionales (Sin Stock)</option>
              <option value="golosinas">🍬 Golosinas y Snacks (Con Stock)</option>
              <option value="libreria">✏️ Librería y Papelería (Con Stock)</option>
              <option value="aseo">🪥 Aseo Personal (Con Stock)</option>
            </select>
          </label>

          <div className="text-sm font-bold sm:col-span-3">
            Ícono visual
            <div className="mt-1 flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
              {SERVICE_ICON_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setIcon(k)}
                  className={`grid size-11 place-items-center rounded-xl border transition-colors ${
                    icon === k
                      ? "border-primary bg-accent text-primary shadow-sm"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                  aria-label={`Ícono ${k}`}
                >
                  <ServiceIcon name={k} className="size-5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={create}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
        >
          <Plus className="size-6" /> Guardar
        </button>
      </div>
    </Modal>
  )
}
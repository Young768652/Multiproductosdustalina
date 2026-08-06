"use client"

import { useState } from "react"
import { Plus, Trash2, Calculator, TrendingUp, Layers } from "lucide-react"
import { usePos } from "@/lib/pos-store"
import type { ServiceCategory, ServiceIconKey, TieredPrice } from "@/lib/pos-types"
import { Modal } from "@/components/ui/modal"
import { ServiceIcon } from "@/components/service-icon"

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
  const [cost, setCost] = useState("")
  const [stock, setStock] = useState("")
  const [unit, setUnit] = useState("unidad")
  const [category, setCategory] = useState<ServiceCategory>("servicios")
  const [icon, setIcon] = useState<ServiceIconKey>("file")

  // Calculadora Comercial (Tira / Paquete / Caja)
  const [showCalc, setShowCalc] = useState(false)
  const [packPrice, setPackPrice] = useState("")
  const [packUnits, setPackUnits] = useState("")
  const [targetPrice, setTargetPrice] = useState("")

  // Configuración de Rangos por Hojas (Anillados, Enmicados)
  const [tieredPrices, setTieredPrices] = useState<TieredPrice[]>([])
  const [minHojas, setMinHojas] = useState("")
  const [maxHojas, setMaxHojas] = useState("")
  const [tierCost, setTierCost] = useState("")

  const isPhysicalProduct = category === "golosinas" || category === "libreria" || category === "aseo"

  // Cálculos dinámicos en vivo para la tira/paquete
  const parsedPackCost = Number(packPrice.replace(",", ".")) || 0
  const parsedPackUnits = Number(packUnits) || 0
  const parsedTargetPrice = Number(targetPrice.replace(",", ".")) || 0

  const calculatedUnitCost = parsedPackUnits > 0 ? parsedPackCost / parsedPackUnits : 0
  const calculatedProfitPerUnit = parsedTargetPrice - calculatedUnitCost
  const calculatedTotalProfit = calculatedProfitPerUnit * parsedPackUnits

  function applyPackCalc() {
    if (calculatedUnitCost > 0) {
      setCost(calculatedUnitCost.toFixed(2))
      if (parsedTargetPrice > 0) setPrice(parsedTargetPrice.toFixed(2))
      if (!stock && parsedPackUnits > 0) setStock(String(parsedPackUnits))
      setShowCalc(false)
    }
  }

  function addTier() {
    const min = Number(minHojas) || 1
    const max = Number(maxHojas) || 100
    const p = Number(tierCost.replace(",", ".")) || 0

    if (p > 0) {
      setTieredPrices((prev) => [...prev, { minSheets: min, maxSheets: max, price: p }])
      setMinHojas(String(max + 1))
      setMaxHojas("")
      setTierCost("")
    }
  }

  function removeTier(index: number) {
    setTieredPrices((prev) => prev.filter((_, i) => i !== index))
  }

  function create() {
    if (!name.trim()) return
    const parsedPrice = Math.max(0, Number(price.replace(",", ".")) || 0)
    const parsedCost = Math.max(0, Number(cost.replace(",", ".")) || 0)

    addService({
      name: name.trim(),
      price: parsedPrice,
      cost: parsedCost,
      ...(isPhysicalProduct
        ? {
            stock: Math.max(0, Number(stock) || 0),
            minStock: 5,
          }
        : {}),
      unit: unit.trim() || "unidad",
      category,
      icon,
      tieredPrices: tieredPrices.length > 0 ? tieredPrices : undefined,
    })

    setName("")
    setPrice("")
    setCost("")
    setStock("")
    setUnit("unidad")
    setIcon("file")
    setTieredPrices([])
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gestión de Precios, Costos e Inventario"
      description="Calcula costos de tiras/paquetes o configura tarifas por rango de hojas."
      size="lg"
    >
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {services.map((s) => {
          const hasStockControl = s.stock !== undefined
          const unitCost = s.cost ?? 0
          const profit = s.price - unitCost

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

              {/* Precio Venta */}
              <div className="flex items-center gap-1 rounded-xl border border-input bg-background px-2" title="Precio de venta al público">
                <span className="text-xs font-bold text-muted-foreground">Venta: S/.</span>
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
                />
              </div>

              {/* Costo Compra */}
              <div className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-2" title="Costo unitario de compra">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Costo: S/.</span>
                <input
                  type="number"
                  min={0}
                  step="0.10"
                  inputMode="decimal"
                  value={s.cost === 0 ? "" : (s.cost ?? "")}
                  onChange={(e) => {
                    const val = e.target.value
                    updateService(s.id, { cost: val === "" ? 0 : Number(val.replace(",", ".")) })
                  }}
                  onFocus={(e) => e.target.select()}
                  className="h-11 w-16 bg-transparent text-center text-sm font-extrabold text-emerald-600 outline-none"
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
                  />
                </div>
              ) : null}

              {/* Muestra ganancia unitaria */}
              <div className="hidden sm:block text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg">
                +{profit > 0 ? `S/. ${profit.toFixed(2)}` : "S/. 0.00"}
              </div>

              <button
                type="button"
                onClick={() => removeService(s.id)}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Formulario para Nuevo Producto / Servicio */}
      <div className="mt-5 rounded-3xl border-2 border-dashed border-border p-4 bg-secondary/20 space-y-3">
        <p className="text-base font-extrabold">Añadir Nuevo Producto / Servicio</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-bold sm:col-span-3">
            Nombre del producto o servicio
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Ej. Chizitos, Anillado Espiral, Cuaderno"
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-medium"
            />
          </label>

          <label className="text-sm font-bold">
            Precio Venta Base (S/.)
            <input
              type="number"
              min={0}
              step="0.10"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Ej. 1.00"
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-bold"
            />
          </label>

          <div className="text-sm font-bold">
            <div className="flex justify-between items-center">
              <span>Costo Compra (S/.)</span>
              <button
                type="button"
                onClick={() => setShowCalc(!showCalc)}
                className="text-xs text-primary flex items-center gap-1 underline font-bold"
              >
                <Calculator className="size-3.5" /> Calculadora Tira
              </button>
            </div>
            <input
              type="number"
              min={0}
              step="0.10"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Ej. 0.70"
              className="mt-1 h-12 w-full rounded-xl border border-emerald-500/50 bg-emerald-500/5 px-3 text-base outline-none focus:border-emerald-600 font-bold text-emerald-600"
            />
          </div>

          {isPhysicalProduct ? (
            <label className="text-sm font-bold">
              Stock Inicial
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Ej. 10"
                className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-bold text-primary"
              />
            </label>
          ) : null}

          {/* CALCULADORA DE MARGEN DE GANANCIA POR TIRA / PAQUETE */}
          {showCalc ? (
            <div className="sm:col-span-3 rounded-2xl border-2 border-primary/40 bg-accent/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <TrendingUp className="size-5" />
                Calculadora de Ganancias por Tira / Paquete
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">¿Cuánto te costó la tira?</label>
                  <input
                    type="number"
                    step="0.10"
                    placeholder="Ej. 7.00"
                    value={packPrice}
                    onChange={(e) => setPackPrice(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">¿Cuántos vienen?</label>
                  <input
                    type="number"
                    placeholder="Ej. 10"
                    value={packUnits}
                    onChange={(e) => setPackUnits(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">¿A cuánto venderás c/u?</label>
                  <input
                    type="number"
                    step="0.10"
                    placeholder="Ej. 1.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold outline-none text-primary"
                  />
                </div>
              </div>

              {/* Panel de resultados de Ganancias */}
              {calculatedUnitCost > 0 ? (
                <div className="rounded-xl bg-background border border-border p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo por unidad:</span>
                    <strong className="text-foreground">S/. {calculatedUnitCost.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ganancia por unidad vendida:</span>
                    <strong className={calculatedProfitPerUnit >= 0 ? "text-emerald-600 font-extrabold" : "text-destructive"}>
                      S/. {calculatedProfitPerUnit.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border font-bold text-sm">
                    <span>Ganancia total del paquete:</span>
                    <span className={calculatedTotalProfit >= 0 ? "text-emerald-600 font-extrabold" : "text-destructive"}>
                      S/. {calculatedTotalProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={applyPackCalc}
                disabled={calculatedUnitCost <= 0}
                className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-40"
              >
                Aplicar Datos al Producto
              </button>
            </div>
          ) : null}

          <label className="text-sm font-bold">
            Unidad
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="unidad, paquete..."
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-medium"
            />
          </label>

          <label className="text-sm font-bold sm:col-span-2">
            Categoría
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary font-bold"
            >
              <option value="copias">📄 Impresiones y Copias (Sin Stock)</option>
              <option value="servicios">🌀 Servicios Adicionales (Anillados/Sin Stock)</option>
              <option value="golosinas">🍬 Golosinas y Snacks (Con Stock)</option>
              <option value="libreria">✏️ Librería y Papelería (Con Stock)</option>
              <option value="aseo">🪥 Aseo Personal (Con Stock)</option>
            </select>
          </label>
        </div>

        {/* CREADOR DE RANGOS DE PRECIOS POR HOJAS (Solo para Anillados / Servicios) */}
        {!isPhysicalProduct ? (
          <div className="rounded-2xl border-2 border-primary/30 bg-accent/20 p-3 space-y-2">
            <p className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Layers className="size-4" /> Configurar Tarifas por Cantidad de Hojas (Ej: 1 a 50 hojas = S/. 6.00)
            </p>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="De Hojas (Ej. 1)"
                value={minHojas}
                onChange={(e) => setMinHojas(e.target.value)}
                className="h-10 rounded-xl border px-3 text-xs bg-background font-semibold"
              />
              <input
                type="number"
                placeholder="Hasta Hojas (Ej. 50)"
                value={maxHojas}
                onChange={(e) => setMaxHojas(e.target.value)}
                className="h-10 rounded-xl border px-3 text-xs bg-background font-semibold"
              />
              <input
                type="number"
                step="0.50"
                placeholder="Precio (Ej. 6.00)"
                value={tierCost}
                onChange={(e) => setTierCost(e.target.value)}
                className="h-10 rounded-xl border px-3 text-xs bg-background font-extrabold text-primary"
              />
            </div>

            <button
              type="button"
              onClick={addTier}
              className="h-10 w-full rounded-xl bg-secondary border border-primary/30 text-xs font-bold text-primary hover:bg-accent"
            >
              + Agregar Rango a la Lista
            </button>

            {tieredPrices.length > 0 ? (
              <div className="mt-2 space-y-1">
                {tieredPrices.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-background p-2 text-xs font-bold">
                    <span>De {t.minSheets} a {t.maxSheets} hojas</span>
                    <span className="text-primary font-extrabold">S/. {t.price.toFixed(2)}</span>
                    <button type="button" onClick={() => removeTier(idx)} className="text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={create}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
        >
          <Plus className="size-6" /> Guardar Producto / Servicio
        </button>
      </div>
    </Modal>
  )
}
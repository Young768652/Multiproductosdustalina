"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Plus, Sparkles, Star, Settings2, Zap } from "lucide-react"
import { usePos } from "@/lib/pos-store"
import { useCart } from "@/lib/cart-store"
import type { Service, ServiceCategory } from "@/lib/pos-types"
import { soles } from "@/lib/format"
import { ServiceIcon } from "@/components/service-icon"
import { ServiceQuantityModal } from "@/components/service-quantity-modal"
import { ManageServicesModal } from "@/components/manage-services-modal"

const CATEGORIES: { key: ServiceCategory | "todos"; label: string; icon: string }[] = [
  { key: "todos", label: "Todos", icon: "✨" },
  { key: "copias", label: "Copias e Impresiones", icon: "📄" },
  { key: "servicios", label: "Anillados y Servicios", icon: "🌀" },
  { key: "golosinas", label: "Golosinas y Snacks", icon: "🍬" },
  { key: "libreria", label: "Librería y Papelería", icon: "✏️" },
  { key: "aseo", label: "Aseo Personal", icon: "🪥" },
]

export function ServicesPanel() {
  const { services, toggleFavorite } = usePos()
  const { addItem } = useCart()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<ServiceCategory | "todos">("todos")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [manageOpen, setManageOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // ATAJO DE TECLADO: Presionar la tecla "/" enfoca el buscador de inmediato
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filtered = services.filter((s) => {
    const matchCategory = category === "todos" || s.category === category
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      s.unit.toLowerCase().includes(search.toLowerCase().trim())
    return matchCategory && matchSearch
  })

  const favorites = services.filter((s) => s.isFavorite)

  // Clic rápido: si es un producto simple (sin tarifas por hojas), agrega +1 directo
  function handleQuickAdd(s: Service) {
    if (s.perSheetHint || (s.tieredPrices && s.tieredPrices.length > 0)) {
      setSelectedService(s) // Para anillados o rangos de hojas, abre el modal
    } else {
      addItem({
        serviceId: s.id,
        name: s.name,
        unitPrice: s.price,
        quantity: 1,
        unit: s.unit,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda con Atajo y Botón de Precios */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto (Presiona '/' para buscar rápido)..."
            className="h-14 w-full rounded-2xl border-2 border-border bg-background pl-12 pr-12 text-base font-bold outline-none focus:border-primary shadow-sm"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-muted-foreground bg-secondary px-2 py-1 rounded-md border border-border">
            /
          </span>
        </div>

        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="flex h-14 items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 font-bold transition-colors hover:border-primary/40 hover:bg-secondary shrink-0 shadow-sm"
        >
          <Settings2 className="size-5 text-primary" />
          <span className="hidden sm:inline">Gestión de Precios</span>
        </button>
      </div>

      {/* Sugerencias Rápidas / Favoritos (Toque de 1 Clic) */}
      {favorites.length > 0 && !search && category === "todos" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-primary">
              <Zap className="size-4 fill-primary" /> Más Vendidos (Toque de 1 Clic)
            </h3>
            <span className="text-xs text-muted-foreground font-semibold">Toca la tarjeta para agregar +1</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {favorites.map((s) => (
              <div
                key={s.id}
                onClick={() => handleQuickAdd(s)}
                className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 border-primary/20 bg-card p-3 shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-95"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ServiceIcon name={s.icon} className="size-5" />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(s.id)
                    }}
                    className="text-amber-400 hover:scale-110 transition-transform"
                    title="Quitar de favoritos"
                  >
                    <Star className="size-4 fill-amber-400" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="font-extrabold text-sm line-clamp-1">{s.name}</p>
                  <p className="text-base font-black text-primary mt-0.5">{soles(s.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Filtros por Categorías */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
              category === cat.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Lista General de Productos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
          const hasStockControl = s.stock !== undefined
          const isLowStock = hasStockControl && (s.stock ?? 0) <= (s.minStock ?? 5)

          return (
            <div
              key={s.id}
              onClick={() => handleQuickAdd(s)}
              className="group relative flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary group-hover:bg-primary/10 transition-colors">
                  <ServiceIcon name={s.icon} className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{s.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="font-extrabold text-primary text-sm">{soles(s.price)}</span>
                    <span>/ {s.unit}</span>
                  </div>
                  {hasStockControl ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${isLowStock ? "bg-amber-500/20 text-amber-600 font-extrabold" : "bg-secondary text-muted-foreground"}`}>
                      Stock: {s.stock} {s.unit}s
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(s.id)
                  }}
                  className="p-1.5 text-muted-foreground hover:text-amber-400 transition-colors"
                  title={s.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
                >
                  <Star className={`size-4 ${s.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedService(s)
                  }}
                  className="grid size-9 place-items-center rounded-xl bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Editar cantidad o precio especial"
                >
                  <Plus className="size-5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modales */}
      <ServiceQuantityModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />

      <ManageServicesModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />
    </div>
  )
}
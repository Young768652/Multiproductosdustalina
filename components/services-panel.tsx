"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, Sparkles, AlertCircle } from "lucide-react"
import { usePos, isAdmin } from "@/lib/pos-store"
import { useCart } from "@/lib/cart-store"
import type { Service, ServiceCategory } from "@/lib/pos-types"
import { soles } from "@/lib/format"
import { ServiceIcon } from "@/components/service-icon"
import { ServiceQuantityModal } from "@/components/service-quantity-modal"
import { ManageServicesModal } from "@/components/manage-services-modal"

const SECTIONS: { key: ServiceCategory | "favoritos"; label: string }[] = [
  { key: "favoritos", label: "⭐ Más Vendidos / Favoritos" },
  { key: "copias", label: "📄 Impresiones y Copias" },
  { key: "servicios", label: "🌀 Servicios Adicionales" },
  { key: "golosinas", label: "🍬 Golosinas y Snacks" },
  { key: "libreria", label: "✏️ Librería y Papelería" },
  { key: "aseo", label: "🪥 Aseo Personal" },
]

export function ServicesPanel() {
  const { services, activeCashier } = usePos()
  const { items } = useCart()
  const canManage = isAdmin(activeCashier)
  const [selected, setSelected] = useState<Service | null>(null)
  const [manage, setManage] = useState(false)
  const [search, setSearch] = useState("")

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase().trim())
  )

  // 🤖 MOTOR DE RECOMENDACIÓN IA / ML DINÁMICO
  function getAiSuggestion() {
    if (items.length === 0) {
      return "Si el cliente hace trabajos o impresiones grandes, ofrécele Anillado, Enmicado o Folder."
    }

    const hasCopias = items.some((it) => it.name.toLowerCase().includes("copia") || it.name.toLowerCase().includes("impresion"))
    const hasGolosinas = items.some((it) => ["chizitos", "papitas", "galletas", "gaseosa", "caramelos"].some(g => it.name.toLowerCase().includes(g)))
    const hasLibreria = items.some((it) => ["cuaderno", "lapicero", "lápiz", "borrador"].some(l => it.name.toLowerCase().includes(l)))

    if (hasCopias && !items.some(it => it.name.toLowerCase().includes("anillado"))) {
      return "💡 Sugerencia IA: El cliente lleva copias/impresiones. Ofrécele Anillado o Folder para proteger sus hojas."
    }
    if (hasLibreria && !hasGolosinas) {
      return "💡 Sugerencia IA: ¿Lleva útiles escolares? Ofrécele una Gaseosa, Papitas o Galletas para el camino."
    }
    if (hasGolosinas) {
      return "💡 Sugerencia IA: Ofrece una servilleta o bolsa adicional si lleva bebidas y snacks."
    }

    return "💡 Sugerencia IA: No olvides preguntar si desea comprobante o si pagará con Yape/Plin."
  }

  return (
    <section aria-label="Servicios y productos" className="min-w-0 space-y-4">
      {/* Barra de Búsqueda Rápida */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Buscar producto (ej. copias, chizitos, cuaderno)..."
            className="h-16 w-full rounded-2xl border-2 border-border bg-card pl-12 pr-4 text-lg font-bold outline-none focus:border-primary shadow-sm"
          />
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setManage(true)}
            className="flex h-16 items-center gap-2 rounded-2xl border border-border bg-card px-4 font-bold shadow-sm hover:bg-secondary"
          >
            <SlidersHorizontal className="size-6 text-primary" />
            <span className="hidden sm:inline">Precios</span>
          </button>
        ) : null}
      </div>

      {/* Sugerencia Inteligente de Venta (Responde al Carrito en Vivo) */}
      <div className="flex items-center gap-3 rounded-2xl bg-accent p-3.5 border border-primary/20 text-sm font-semibold transition-all">
        <Sparkles className="size-5 text-primary shrink-0 animate-pulse" />
        <p className="text-accent-foreground leading-tight">
          <strong>Recomendación IA:</strong> {getAiSuggestion()}
        </p>
      </div>

      {search.trim().length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Resultados de Búsqueda ({filteredServices.length})
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredServices.map((s) => (
              <ServiceCard key={s.id} service={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map((section) => {
            const list =
              section.key === "favoritos"
                ? services.filter((s) => s.isFavorite)
                : services.filter((s) => s.category === section.key)

            if (list.length === 0) return null

            return (
              <div key={section.key}>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  {section.label}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {list.map((s) => (
                    <ServiceCard key={s.id} service={s} onClick={() => setSelected(s)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ServiceQuantityModal service={selected} onClose={() => setSelected(null)} />
      <ManageServicesModal open={manage && canManage} onClose={() => setManage(false)} />
    </section>
  )
}

function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const isOutOfStock = service.stock !== undefined && service.stock <= 0

  return (
    <button
      type="button"
      onClick={isOutOfStock ? undefined : onClick}
      disabled={isOutOfStock}
      className={`group relative flex min-h-28 flex-col justify-between rounded-3xl border p-4 text-left shadow-sm transition-all ${
        isOutOfStock
          ? "opacity-60 border-destructive/30 bg-secondary/30 cursor-not-allowed"
          : "border-border bg-card hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
      }`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`grid size-12 place-items-center rounded-2xl transition-colors ${
            isOutOfStock ? "bg-destructive/10 text-destructive" : "bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          }`}
        >
          <ServiceIcon name={service.icon} className="size-7" />
        </span>

        {isOutOfStock ? (
          <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-extrabold text-destructive">
            <AlertCircle className="size-3" /> Agotado
          </span>
        ) : null}
      </div>

      <span className="mt-3">
        <span className="block truncate text-base font-bold leading-tight">{service.name}</span>
        <span className="mt-0.5 block text-lg font-extrabold text-primary">
          {soles(service.price)}
          <span className="text-xs font-medium text-muted-foreground"> / {service.unit}</span>
        </span>
      </span>
    </button>
  )
}
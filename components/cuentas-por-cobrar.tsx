"use client"

import { useMemo, useState } from "react"
import { BookOpen, HandCoins, CheckCircle2, User, MessageCircle } from "lucide-react"
import { usePos, creditBalance, creditPaid, isCreditSettled } from "@/lib/pos-store"
import type { Credit } from "@/lib/pos-types"
import { soles, relativeDay } from "@/lib/format"
import { AbonoModal } from "@/components/abono-modal"

export function CuentasPorCobrar() {
  const { credits } = usePos()
  const [abono, setAbono] = useState<Credit | null>(null)
  const [showPaid, setShowPaid] = useState(false)

  const NOMBRE_TIENDA = "Tienda Dustalina"

  const pendientes = useMemo(
    () => credits.filter((c) => !isCreditSettled(c)),
    [credits],
  )
  const pagadas = useMemo(
    () => credits.filter((c) => isCreditSettled(c)),
    [credits],
  )
  const totalDeuda = useMemo(
    () => pendientes.reduce((sum, c) => sum + creditBalance(c), 0),
    [pendientes],
  )

  const list = showPaid ? pagadas : pendientes

  // Función para abrir WhatsApp con el mensaje personalizado y dinámico
  function sendWhatsappReminder(c: Credit) {
    const balance = creditBalance(c)
    const detalleProductos = c.items
      .map((it) => `• ${it.quantity}x ${it.name} (${soles(it.unitPrice * it.quantity)})`)
      .join("\n")

    // El mensaje toma la variable NOMBRE_TIENDA automáticamente
    const mensaje = `Hola *${c.clientName}* 👋, te saludamos de *${NOMBRE_TIENDA}* 🏪.\n\nTe enviamos un recordatorio amigable de tu cuenta pendiente:\n\n${detalleProductos}\n\n💰 *Total pendiente: ${soles(balance)}*\n\nPuedes cancelarlo en la tienda o por Yape/Plin al momento que gustes. ¡Muchas gracias!`

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(url, "_blank")
  }

  return (
    <section aria-label="Cuentas por cobrar">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Cuentas por Cobrar</h2>
          <p className="text-sm text-muted-foreground">
            El cuaderno digital de fiados de tu negocio.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-5 py-3 text-right shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total por cobrar
          </p>
          <p className="text-3xl font-extrabold" style={{ color: "var(--warning)" }}>
            {soles(totalDeuda)}
          </p>
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-2xl border border-border bg-secondary p-1">
        <button
          type="button"
          onClick={() => setShowPaid(false)}
          className={`h-11 rounded-xl px-4 text-sm font-bold transition-colors ${
            !showPaid ? "bg-card shadow-sm" : "text-muted-foreground"
          }`}
        >
          Pendientes ({pendientes.length})
        </button>
        <button
          type="button"
          onClick={() => setShowPaid(true)}
          className={`h-11 rounded-xl px-4 text-sm font-bold transition-colors ${
            showPaid ? "bg-card shadow-sm" : "text-muted-foreground"
          }`}
        >
          Pagadas ({pagadas.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <BookOpen className="size-12 opacity-40" />
          <p className="mt-3 text-pretty font-medium">
            {showPaid
              ? "Aún no hay cuentas saldadas."
              : "No hay cuentas pendientes. ¡Todo al día!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const balance = creditBalance(c)
            const paid = creditPaid(c)
            const settled = isCreditSettled(c)
            return (
              <article
                key={c.id}
                className="flex flex-col rounded-3xl border border-border bg-card p-4 shadow-sm justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-full bg-secondary text-2xl">
                      <User className="size-6 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-extrabold leading-tight">
                        {c.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Última anotación: {relativeDay(c.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl bg-secondary/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {settled ? "Cuenta saldada" : "Debe"}
                    </p>
                    <p
                      className="text-3xl font-extrabold"
                      style={{ color: settled ? "var(--primary)" : "var(--warning)" }}
                    >
                      {soles(settled ? c.originalAmount : balance)}
                    </p>
                    {paid > 0 && !settled ? (
                      <p className="text-xs text-muted-foreground">
                        Abonado {soles(paid)} de {soles(c.originalAmount)}
                      </p>
                    ) : null}
                  </div>

                  <ul className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                    {c.items.slice(0, 3).map((it) => (
                      <li key={it.id} className="flex justify-between gap-2">
                        <span className="truncate">
                          {it.quantity}× {it.name}
                        </span>
                        <span>{soles(it.unitPrice * it.quantity)}</span>
                      </li>
                    ))}
                    {c.items.length > 3 ? (
                      <li className="text-xs italic">+{c.items.length - 3} más…</li>
                    ) : null}
                  </ul>

                  <p className="mt-3 text-xs font-medium text-muted-foreground">
                    Fiado por: <span className="font-bold text-foreground">{c.cashierName}</span>
                  </p>
                </div>

                {/* BOTONES DE ACCIÓN */}
                {settled ? (
                  <div className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent font-bold text-primary">
                    <CheckCircle2 className="size-5" /> Pagado
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => sendWhatsappReminder(c)}
                      className="flex h-14 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-3 font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="size-5" />
                      <span className="hidden sm:inline text-xs">WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbono(c)}
                      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm text-sm"
                    >
                      <HandCoins className="size-5" /> Cobrar / Abonar
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <AbonoModal credit={abono} onClose={() => setAbono(null)} />
    </section>
  )
}
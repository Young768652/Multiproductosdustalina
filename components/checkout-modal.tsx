"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Banknote, Printer, QrCode } from "lucide-react"
import { usePos } from "@/lib/pos-store"
import { useCart } from "@/lib/cart-store"
import { soles } from "@/lib/format"
import { Modal } from "@/components/ui/modal"
import type { PaymentMethod } from "@/lib/pos-types"

const BILLS = [2, 5, 10, 20, 50, 100]

const TIENDA_INFO = {
  nombre: "Tienda Dustalina",
  slogan: "Servicios, Copias y Librería",
  telefono: "987 654 321",
  direccion: "Av. Principal 123",
}

export function CheckoutModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { recordSale } = usePos()
  const { items, total, clear } = useCart()
  const [method, setMethod] = useState<PaymentMethod>("efectivo")
  const [receivedInput, setReceivedInput] = useState("")
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setMethod("efectivo")
      setReceivedInput("")
      setDone(false)
      setIsSubmitting(false)
    }
  }, [open])

  const received = Number(receivedInput.replace(",", ".")) || 0
  const change = method === "efectivo" ? received - total : 0
  const enough = method === "yape" || (received >= total && received > 0)

  function finish() {
    if (isSubmitting || !enough) return
    setIsSubmitting(true)

    recordSale({
      items,
      total,
      paymentType: method,
      received: method === "efectivo" ? received : total,
      change: Math.max(0, change),
    })
    setDone(true)
    setIsSubmitting(false)
  }

  function printTicket() {
    window.print()
  }

  function closeAll() {
    if (done) clear()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={closeAll}
      title={done ? "¡Venta Cobrada!" : "Cobrar Venta"}
      description={done ? undefined : "Selecciona el método de pago."}
      footer={
        done ? (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={printTicket}
              className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-primary text-primary text-lg font-bold"
            >
              <Printer className="size-5" /> Imprimir Ticket
            </button>
            <button
              type="button"
              onClick={closeAll}
              className="flex h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground"
            >
              Nueva Venta
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={!enough || isSubmitting}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <CheckCircle2 className="size-6" /> Confirmar Cobro
          </button>
        )
      }
    >
      {done ? (
        <div className="py-4 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-accent text-primary">
            <CheckCircle2 className="size-12" />
          </div>
          <p className="mt-3 text-lg font-semibold">
            {method === "yape" ? "Pago recibido por Yape/Plin" : "Vuelto entregado"}
          </p>
          <p className="mt-1 text-5xl font-extrabold text-primary">
            {method === "yape" ? soles(total) : soles(Math.max(0, change))}
          </p>

          <div className="mt-6 border-t border-dashed border-border pt-4 text-left font-mono text-xs text-foreground bg-secondary/30 p-4 rounded-2xl">
            <p className="text-center font-bold text-sm">*** {TIENDA_INFO.nombre} ***</p>
            <p className="text-center text-muted-foreground">{TIENDA_INFO.slogan}</p>
            <p className="text-center text-muted-foreground">📍 {TIENDA_INFO.direccion}</p>
            <p className="text-center text-muted-foreground">📱 Yape/Teléf: {TIENDA_INFO.telefono}</p>
            <div className="my-2 border-b border-dashed border-border" />
            <p>Fecha: {new Date().toLocaleString()}</p>
            <p>Método: {method.toUpperCase()}</p>
            <div className="my-2 border-b border-dashed border-border" />
            {items.map((it) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.quantity}x {it.name}</span>
                <span>{soles(it.unitPrice * it.quantity)}</span>
              </div>
            ))}
            <div className="my-2 border-b border-dashed border-border" />
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span>{soles(total)}</span>
            </div>
            {method === "efectivo" ? (
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Recibido: {soles(received)}</span>
                <span>Vuelto: {soles(Math.max(0, change))}</span>
              </div>
            ) : null}
            <p className="mt-4 text-center text-muted-foreground font-semibold">¡Gracias por su preferencia!</p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-secondary p-4 text-center">
            <p className="text-sm font-semibold text-muted-foreground">Total a cobrar</p>
            <p className="text-5xl font-extrabold tracking-tight">{soles(total)}</p>
          </div>

          <p className="mt-4 mb-2 text-sm font-bold">Método de pago</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("efectivo")}
              className={`flex h-14 items-center justify-center gap-2 rounded-2xl border-2 font-bold ${
                method === "efectivo" ? "border-primary bg-accent text-primary" : "border-border bg-card"
              }`}
            >
              <Banknote className="size-5" /> Efectivo
            </button>
            <button
              type="button"
              onClick={() => setMethod("yape")}
              className={`flex h-14 items-center justify-center gap-2 rounded-2xl border-2 font-bold ${
                method === "yape" ? "border-primary bg-accent text-primary" : "border-border bg-card"
              }`}
            >
              <QrCode className="size-5" /> Yape / Plin
            </button>
          </div>

          {method === "efectivo" ? (
            <>
              <p className="mt-4 mb-2 text-sm font-bold">¿Con cuánto paga?</p>
              <div className="grid grid-cols-3 gap-2">
                {BILLS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setReceivedInput((prev) => String((Number(prev) || 0) + b))}
                    className="flex h-14 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-lg font-bold hover:bg-secondary"
                  >
                    <Banknote className="size-4 text-primary" /> {b}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReceivedInput(String(total))}
                  className="h-12 flex-1 rounded-2xl border border-border bg-card font-semibold hover:bg-secondary"
                >
                  Pago exacto
                </button>
                <button
                  type="button"
                  onClick={() => setReceivedInput("")}
                  className="h-12 rounded-2xl border border-border bg-card px-4 font-semibold hover:bg-secondary"
                >
                  Borrar
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-input bg-background px-3">
                <span className="text-sm font-semibold text-muted-foreground">Monto exacta digitado: S/.</span>
                <input
                  type="number"
                  step="0.10"
                  value={receivedInput}
                  onChange={(e) => setReceivedInput(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0.00"
                  className="h-12 w-full bg-transparent text-lg font-bold outline-none"
                />
              </div>

              <div className="mt-4 rounded-2xl bg-accent p-4 text-center">
                <p className="text-sm font-semibold text-muted-foreground">Vuelto a entregar</p>
                <p className="text-5xl font-extrabold text-primary">{soles(Math.max(0, change))}</p>
                {!enough && received > 0 ? (
                  <p className="mt-1 text-sm font-semibold text-destructive">
                    Faltan {soles(total - received)}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-primary/40 bg-accent/50 p-4 text-center">
              <img 
                src="/qr-yape.png" 
                alt="QR Yape y Plin" 
                className="mx-auto size-48 rounded-xl object-contain shadow-md bg-white p-2"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <p className="mt-2 font-bold text-base">Escanear QR para pagar</p>
              <p className="text-xs text-muted-foreground">Confirma que el cliente haya transferido <strong>{soles(total)}</strong></p>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
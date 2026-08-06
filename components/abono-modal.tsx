"use client"

import { useEffect, useState } from "react"
import { Banknote, CheckCircle2, QrCode } from "lucide-react"
import { usePos, creditBalance } from "@/lib/pos-store"
import type { Credit } from "@/lib/pos-types"
import { soles } from "@/lib/format"
import { Modal } from "@/components/ui/modal"

const BILLS = [5, 10, 20, 50, 100]

export function AbonoModal({
  credit,
  onClose,
}: {
  credit: Credit | null
  onClose: () => void
}) {
  const { addCreditPayment } = usePos()
  const [method, setMethod] = useState<"efectivo" | "yape">("efectivo")
  const [payInput, setPayInput] = useState("")
  const [givenInput, setGivenInput] = useState("")

  const balance = credit ? creditBalance(credit) : 0

  useEffect(() => {
    if (credit) {
      setMethod("efectivo")
      setPayInput(String(balance))
      setGivenInput(String(balance))
    }
  }, [credit, balance])

  if (!credit) return null

  const payAmount = Math.max(0, Number(payInput.replace(",", ".")) || 0)
  const givenAmount = Math.max(0, Number(givenInput.replace(",", ".")) || 0)

  const pay = Math.min(payAmount, balance)
  const remaining = Math.max(0, balance - pay)
  const change = Math.max(0, givenAmount - pay)
  const settlesDebt = pay >= balance && pay > 0
  const isEnough = method === "yape" || (givenAmount >= pay && pay > 0)

  function confirm() {
    if (!isEnough || pay <= 0) return
    addCreditPayment(credit!.id, pay)
    onClose()
  }

  return (
    <Modal
      open={!!credit}
      onClose={onClose}
      title={`Cobrar a ${credit.clientName}`}
      description="Registra el pago o abono parcial."
      footer={
        <button
          type="button"
          onClick={confirm}
          disabled={!isEnough || pay <= 0}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <CheckCircle2 className="size-6" />
          {settlesDebt ? "Saldar deuda" : "Registrar abono"} · {soles(pay)}
        </button>
      }
    >
      <div className="rounded-2xl bg-secondary p-4 text-center">
        <p className="text-sm font-semibold text-muted-foreground">Deuda actual</p>
        <p className="text-4xl font-extrabold tracking-tight">{soles(balance)}</p>
      </div>

      {/* Selector de Método de Pago */}
      <p className="mt-4 mb-2 text-sm font-bold">¿Cómo va a pagar?</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMethod("efectivo")}
          className={`flex h-12 items-center justify-center gap-2 rounded-2xl border-2 font-bold ${
            method === "efectivo"
              ? "border-primary bg-accent text-primary"
              : "border-border bg-card"
          }`}
        >
          <Banknote className="size-5" /> Efectivo
        </button>
        <button
          type="button"
          onClick={() => setMethod("yape")}
          className={`flex h-12 items-center justify-center gap-2 rounded-2xl border-2 font-bold ${
            method === "yape"
              ? "border-primary bg-accent text-primary"
              : "border-border bg-card"
          }`}
        >
          <QrCode className="size-5" /> Yape / Plin
        </button>
      </div>

      {/* Monto que paga */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-bold">Monto que abonará / pagará</p>
          <button
            type="button"
            onClick={() => {
              setPayInput(String(balance))
              setGivenInput(String(balance))
            }}
            className="text-xs font-bold text-primary hover:underline"
          >
            Pagar Deuda Total ({soles(balance)})
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-4">
          <span className="text-xl font-bold text-muted-foreground">S/.</span>
          <input
            type="number"
            min={0}
            step="0.10"
            inputMode="decimal"
            value={payInput}
            onChange={(e) => {
              setPayInput(e.target.value)
              if (Number(givenInput) < Number(e.target.value)) {
                setGivenInput(e.target.value)
              }
            }}
            onFocus={(e) => e.target.select()}
            placeholder="0.00"
            className="h-14 w-full bg-transparent text-2xl font-extrabold outline-none"
          />
        </div>
      </div>

      {method === "efectivo" ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-bold mb-2">¿Con qué billete paga el cliente?</p>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {BILLS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setGivenInput(String(b))}
                className={`flex h-12 items-center justify-center gap-1 rounded-xl border text-base font-bold ${
                  givenInput === String(b)
                    ? "border-primary bg-accent text-primary"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <Banknote className="size-4" /> {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3">
            <span className="text-sm font-semibold text-muted-foreground">Recibido: S/.</span>
            <input
              type="number"
              min={0}
              step="0.10"
              inputMode="decimal"
              value={givenInput}
              onChange={(e) => setGivenInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="h-12 w-full bg-transparent text-lg font-bold outline-none"
            />
          </div>

          <div className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
            <p className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-400">
              Vuelto a Entregar
            </p>
            <p className="text-4xl font-extrabold text-emerald-600">{soles(change)}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-primary/40 bg-accent/50 p-4 text-center">
          <img
            src="/qr-yape.png"
            alt="QR Yape y Plin"
            className="mx-auto size-44 rounded-xl object-contain shadow-md bg-white p-2"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = "none"
            }}
          />
          <p className="mt-2 font-bold text-base">Escanear QR para abonar</p>
          <p className="text-xs text-muted-foreground">
            Confirma que el cliente te haya yapeado <strong>{soles(pay)}</strong>
          </p>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-secondary/60 p-3 text-center">
        <p className="text-xs font-semibold text-muted-foreground">Saldo restante en cuenta</p>
        <p className="text-2xl font-extrabold text-foreground">{soles(remaining)}</p>
      </div>
    </Modal>
  )
}
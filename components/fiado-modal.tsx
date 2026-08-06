"use client"

import { useEffect, useState } from "react"
import { BookOpen, Check, UserPlus, AlertTriangle, FileText } from "lucide-react"
import { usePos, creditBalance } from "@/lib/pos-store"
import { useCart } from "@/lib/cart-store"
import { soles } from "@/lib/format"
import { Modal } from "@/components/ui/modal"

export function FiadoModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { clients, credits, addClient, addCredit } = usePos()
  const { items, total, clear } = useCart()
  const [clientId, setClientId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (open) {
      setClientId(null)
      setNewName("")
      setNote("")
    }
  }, [open])

  const selectedClient = clients.find((c) => c.id === clientId)
  const chosenName = selectedClient?.name ?? newName.trim()

  const existingDebt = credits
    .filter((c) => c.clientId === clientId || c.clientName.toLowerCase() === chosenName.toLowerCase())
    .reduce((sum, c) => sum + creditBalance(c), 0)

  const limit = selectedClient?.creditLimit ?? 50
  const exceedsLimit = existingDebt + total > limit
  const canSave = chosenName.length > 0 && items.length > 0

  function save() {
    if (!canSave) return
    let id = clientId ?? undefined
    let name = chosenName
    if (!clientId && newName.trim()) {
      const created = addClient(newName.trim())
      id = created.id
      name = created.name
    }
    
    // Une el nombre con la nota si existe
    const finalItems = note.trim()
      ? [...items, { id: "note", serviceId: "", name: `📝 Nota: ${note.trim()}`, unitPrice: 0, quantity: 1, unit: "" }]
      : items

    addCredit({ clientName: name, clientId: id, items: finalItems, total })
    clear()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Anotar a Fiado"
      description="Guarda esta cuenta como pendiente de pago en el cuaderno digital."
      size="lg"
      footer={
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{
            backgroundColor: "var(--warning)",
            color: "var(--warning-foreground)",
          }}
        >
          <BookOpen className="size-6" />
          Anotar Fiado · {soles(total)}
        </button>
      }
    >
      <div className="rounded-2xl bg-secondary p-4 text-center">
        <p className="text-sm font-semibold text-muted-foreground">Monto a fiar</p>
        <p className="text-4xl font-extrabold">{soles(total)}</p>
      </div>

      <p className="mb-2 mt-4 text-sm font-bold">¿A quién le fiamos?</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {clients.map((c) => {
          const active = clientId === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setClientId(c.id)
                setNewName("")
              }}
              className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl border-2 p-3 text-center transition-colors ${
                active
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              <span className="grid size-12 place-items-center rounded-full bg-secondary text-2xl">
                {c.emoji}
              </span>
              <span className="text-sm font-bold leading-tight">{c.name}</span>
              {active ? <Check className="size-5 text-primary" /> : null}
            </button>
          )
        })}
      </div>

      {exceedsLimit ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-6 shrink-0" />
          <p className="text-xs font-semibold">
            ¡Atención! La deuda acumulada ({soles(existingDebt + total)}) superará el límite de {soles(limit)}.
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border-2 border-dashed border-border p-4 space-y-3">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold">
            <UserPlus className="size-4" /> O escribe un cliente nuevo
          </label>
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value)
              setClientId(null)
            }}
            onFocus={(e) => e.target.select()}
            placeholder="Nombre del cliente"
            className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-semibold outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <FileText className="size-3.5" /> Nota u observación (opcional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="Ej. Prometió pagar el sábado"
            className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
    </Modal>
  )
}
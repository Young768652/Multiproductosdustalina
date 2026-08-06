"use client"

import { useState } from "react"
import { ChevronDown, Lock, UserPlus, Check, Delete, Trash2, ShieldCheck, Edit2 } from "lucide-react"
import { usePos, isAdmin } from "@/lib/pos-store"
import type { Cashier } from "@/lib/pos-types"
import { Modal } from "@/components/ui/modal"

export function UserSelector() {
  const { cashiers, activeCashier, setActiveCashierId, addCashier, removeCashier, updateCashier } = usePos()
  const admin = isAdmin(activeCashier)
  const [open, setOpen] = useState(false)
  const [pinFor, setPinFor] = useState<Cashier | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null)
  const [editName, setEditName] = useState("")

  const [newName, setNewName] = useState("")
  const [newPin, setNewPin] = useState("")

  function pick(c: Cashier) {
    if (c.requiresPin) {
      setPinFor(c)
      setPin("")
      setError(false)
    } else {
      setActiveCashierId(c.id)
      setOpen(false)
    }
  }

  function confirmPin() {
    if (pinFor && pin === pinFor.pin) {
      setActiveCashierId(pinFor.id)
      setPinFor(null)
      setOpen(false)
    } else {
      setError(true)
    }
  }

  function press(d: string) {
    setError(false)
    if (d === "del") setPin((p) => p.slice(0, -1))
    else if (pin.length < 6) setPin((p) => p + d)
  }

  function createCashier() {
    if (!newName.trim()) return
    addCashier({
      name: newName.trim(),
      emoji: "🧑",
      requiresPin: newPin.trim().length > 0,
      pin: newPin.trim() || undefined,
    })
    setNewName("")
    setNewPin("")
    setCreating(false)
  }

  function saveEditedName() {
    if (editingCashier && editName.trim()) {
      updateCashier(editingCashier.id, { name: editName.trim() })
      setEditingCashier(null)
    }
  }

  function handleDeleteUser(c: Cashier) {
    if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${c.name}"?`)) {
      removeCashier(c.id)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-left shadow-sm transition-colors hover:bg-secondary"
      >
        <span className="grid size-10 place-items-center rounded-full bg-accent text-xl">
          {activeCashier?.emoji ?? "👤"}
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Atendido por
          </span>
          <span className="block truncate text-base font-bold text-foreground">
            {activeCashier?.name ?? "Elegir cajero"}
          </span>
        </span>
        <ChevronDown className="ml-1 size-5 text-muted-foreground" />
      </button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setCreating(false)
        }}
        title="¿Quién está atendiendo?"
        description="Elige tu usuario para registrar las ventas."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cashiers.map((c) => {
            const active = c.id === activeCashier?.id
            const cashierIsAdmin = isAdmin(c)
            const canDelete = admin && c.id !== "admin"
            return (
              <div key={c.id} className="relative">
                <button
                  type="button"
                  onClick={() => pick(c)}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${
                    admin ? "pr-20" : ""
                  } ${
                    active
                      ? "border-primary bg-accent"
                      : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
                  }`}
                >
                  <span className="grid size-12 place-items-center rounded-full bg-secondary text-2xl">
                    {c.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-lg font-bold">
                      {c.name}
                      {cashierIsAdmin ? (
                        <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Administrador" />
                      ) : null}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {c.requiresPin ? "🔒 Con Clave" : "⚡ Acceso Directo"}
                    </span>
                  </span>
                  {active ? <Check className="size-6 shrink-0 text-primary" /> : null}
                </button>

                {admin ? (
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCashier(c)
                        setEditName(c.name)
                      }}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Editar nombre"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUser(c)
                        }}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}

          {!admin ? (
            <p className="col-span-full rounded-2xl border border-dashed border-border bg-secondary/40 p-3 text-center text-sm text-muted-foreground">
              Inicia sesión como Administrador para cambiar nombres o agregar usuarios.
            </p>
          ) : creating ? (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Nombre del usuario
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="Ej. Jamela, Papá, Tía"
                    className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Clave / PIN (opcional)
                  <input
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    onFocus={(e) => e.target.select()}
                    inputMode="numeric"
                    placeholder="Sin clave = acceso directo"
                    className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={createCashier}
                  className="h-12 flex-1 rounded-xl bg-primary px-4 font-bold text-primary-foreground"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="h-12 rounded-xl border border-border px-4 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-3 font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <UserPlus className="size-5" /> Añadir Usuario
            </button>
          )}
        </div>
      </Modal>

      <Modal
        open={editingCashier !== null}
        onClose={() => setEditingCashier(null)}
        title="Cambiar Nombre de Usuario"
        size="md"
      >
        <div className="space-y-4">
          <label className="block text-sm font-bold">
            Nuevo nombre para {editingCashier?.name}
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="mt-2 h-14 w-full rounded-xl border border-input bg-background px-4 text-lg font-semibold outline-none focus:border-primary"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEditedName}
              className="h-14 flex-1 rounded-xl bg-primary text-lg font-bold text-primary-foreground"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={() => setEditingCashier(null)}
              className="h-14 rounded-xl border border-border px-6 font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={pinFor !== null}
        onClose={() => setPinFor(null)}
        title={`Clave de ${pinFor?.name ?? ""}`}
        description="Ingresa el PIN para ingresar."
        size="md"
      >
        <div className="mx-auto max-w-xs">
          <div
            className={`mb-4 flex h-16 items-center justify-center gap-3 rounded-2xl border-2 text-3xl tracking-[0.4em] ${
              error ? "border-destructive text-destructive" : "border-border"
            }`}
          >
            {pin ? "•".repeat(pin.length) : <span className="text-muted-foreground">----</span>}
          </div>
          {error ? (
            <p className="mb-3 text-center text-sm font-semibold text-destructive">Clave incorrecta.</p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => press(d)}
                className="h-16 rounded-2xl border border-border bg-card text-2xl font-bold hover:bg-secondary"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => press("del")}
              className="grid h-16 place-items-center rounded-2xl border border-border bg-card hover:bg-secondary"
            >
              <Delete className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => press("0")}
              className="h-16 rounded-2xl border border-border bg-card text-2xl font-bold hover:bg-secondary"
            >
              0
            </button>
            <button
              type="button"
              onClick={confirmPin}
              className="grid h-16 place-items-center rounded-2xl bg-primary text-primary-foreground hover:opacity-90"
            >
              <Check className="size-7" />
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
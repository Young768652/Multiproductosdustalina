"use client"

import { useState } from "react"
import { ChevronDown, UserPlus, Check, Trash2, ShieldCheck, Edit2, Key, Eye, EyeOff } from "lucide-react"
import { usePos, isAdmin } from "@/lib/pos-store"
import type { Cashier } from "@/lib/pos-types"
import { Modal } from "@/components/ui/modal"

export function UserSelector() {
  const { cashiers, activeCashier, setActiveCashierId, addCashier, removeCashier, updateCashier } = usePos()
  const admin = isAdmin(activeCashier)
  const [open, setOpen] = useState(false)
  const [pinFor, setPinFor] = useState<Cashier | null>(null)
  const [inputPass, setInputPass] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState(false)

  // Estados para creación y edición
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPass, setNewPass] = useState("")

  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null)
  const [editName, setEditName] = useState("")
  const [editPass, setEditPass] = useState("")

  function pick(c: Cashier) {
    if (c.requiresPin) {
      setPinFor(c)
      setInputPass("")
      setError(false)
      setShowPass(false)
    } else {
      setActiveCashierId(c.id)
      setOpen(false)
    }
  }

  function confirmLogin() {
    if (pinFor && inputPass === pinFor.pin) {
      setActiveCashierId(pinFor.id)
      setPinFor(null)
      setOpen(false)
    } else {
      setError(true)
    }
  }

  function createCashier() {
    if (!newName.trim()) return
    addCashier({
      name: newName.trim(),
      emoji: "🧑",
      requiresPin: newPass.trim().length > 0,
      pin: newPass.trim() || undefined,
    })
    setNewName("")
    setNewPass("")
    setCreating(false)
  }

  function openEditModal(c: Cashier) {
    setEditingCashier(c)
    setEditName(c.name)
    setEditPass(c.pin || "")
    setShowPass(false)
  }

  function saveEditedUser() {
    if (editingCashier && editName.trim()) {
      updateCashier(editingCashier.id, {
        name: editName.trim(),
        requiresPin: editPass.trim().length > 0,
        pin: editPass.trim() || undefined,
      })
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

      {/* Modal Principal de Usuarios */}
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
                      {c.requiresPin ? "🔒 Con Contraseña" : "⚡ Acceso Directo"}
                    </span>
                  </span>
                  {active ? <Check className="size-6 shrink-0 text-primary" /> : null}
                </button>

                {/* Acciones de Administrador */}
                {admin ? (
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(c)
                      }}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      title="Editar usuario o contraseña"
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
              Inicia sesión como Administrador para cambiar nombres, contraseñas o agregar usuarios.
            </p>
          ) : creating ? (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-border p-4 space-y-3">
              <label className="block text-sm font-bold">
                Nombre del usuario
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Ej. Jamela, Papá, Tía"
                  className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary"
                />
              </label>

              <label className="block text-sm font-bold">
                Contraseña segura (letras, números y símbolos)
                <input
                  type="text"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Dejar vacío si no requiere contraseña"
                  className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-primary"
                />
              </label>

              <div className="flex gap-2 pt-2">
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

      {/* Modal para Editar Usuario y Ver/Cambiar Contraseña (Solo Admin) */}
      <Modal
        open={editingCashier !== null}
        onClose={() => setEditingCashier(null)}
        title={`Editar Usuario: ${editingCashier?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <label className="block text-sm font-bold">
            Nombre del usuario
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-semibold outline-none focus:border-primary"
            />
          </label>

          <label className="block text-sm font-bold">
            Contraseña / Clave
            <div className="relative mt-1">
              <input
                type={showPass ? "text" : "password"}
                value={editPass}
                onChange={(e) => setEditPass(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Sin contraseña"
                className="h-12 w-full rounded-xl border border-input bg-background pl-4 pr-12 text-base font-semibold outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Puedes usar letras, números y símbolos para mayor seguridad.
            </p>
          </label>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={saveEditedUser}
              className="h-14 flex-1 rounded-xl bg-primary text-base font-bold text-primary-foreground"
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

      {/* Modal de Ingreso con Contraseña */}
      <Modal
        open={pinFor !== null}
        onClose={() => setPinFor(null)}
        title={`Contraseña de ${pinFor?.name ?? ""}`}
        description="Ingresa la contraseña para iniciar sesión."
        size="md"
      >
        <div className="mx-auto max-w-xs space-y-4">
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={inputPass}
              onChange={(e) => {
                setError(false)
                setInputPass(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmLogin()
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Escribe la contraseña..."
              className={`h-14 w-full rounded-2xl border-2 bg-background pl-4 pr-12 text-lg font-bold outline-none ${
                error ? "border-destructive" : "border-primary"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          {error ? (
            <p className="text-center text-sm font-semibold text-destructive">
              Contraseña incorrecta.
            </p>
          ) : null}

          <button
            type="button"
            onClick={confirmLogin}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Key className="size-5" /> Ingresar
          </button>
        </div>
      </Modal>
    </>
  )
}
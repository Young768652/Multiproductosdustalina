"use client"

import { useState, useMemo, useEffect } from "react"
import { Store, ShoppingBag, BookOpen, ShieldCheck, Download, AlertTriangle, CheckCircle, Plus, Sun, Moon } from "lucide-react"
import { PosProvider, usePos, creditBalance, isCreditSettled, isAdmin } from "@/lib/pos-store"
import { CartProvider } from "@/lib/cart-store"
import { soles } from "@/lib/format"
import { UserSelector } from "@/components/user-selector"
import { ServicesPanel } from "@/components/services-panel"
import { CartPanel } from "@/components/cart-panel"
import { CuentasPorCobrar } from "@/components/cuentas-por-cobrar"
import { VoiceAssistant } from "@/components/voice-assistant"

type Tab = "vender" | "cuentas" | "admin"

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true)
    }
  }, [])

  function toggleTheme() {
    if (isDark) {
      document.documentElement.classList.remove("dark")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      setIsDark(true)
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid size-12 place-items-center rounded-2xl border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-secondary"
      title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label="Cambiar tema visual"
    >
      {isDark ? <Sun className="size-5 text-amber-400" /> : <Moon className="size-5 text-slate-700" />}
    </button>
  )
}

function AdminPanel() {
  const { sales, services, updateService, downloadBackup } = usePos()
  const [adminTab, setAdminTab] = useState<"cierre" | "compras">("cierre")
  const [customStock, setCustomStock] = useState<{ [key: string]: string }>({})

  const totalHoy = useMemo(() => sales.reduce((sum, s) => sum + s.total, 0), [sales])
  const ventasEfectivo = useMemo(() => sales.filter((s) => s.paymentType === "efectivo").reduce((sum, s) => sum + s.total, 0), [sales])
  const ventasYape = useMemo(() => sales.filter((s) => s.paymentType === "yape").reduce((sum, s) => sum + s.total, 0), [sales])

  const productosConStock = useMemo(() => services.filter((s) => s.stock !== undefined), [services])
  const agotados = useMemo(() => productosConStock.filter((s) => (s.stock ?? 0) <= (s.minStock ?? 5)), [productosConStock])

  function handleAddStock(serviceId: string, currentStock: number) {
    const amountToAdd = Number(customStock[serviceId]) || 0
    if (amountToAdd <= 0) return

    updateService(serviceId, { stock: currentStock + amountToAdd })
    setCustomStock((prev) => ({ ...prev, [serviceId]: "" }))
  }

  function handleCerrarCaja() {
    if (sales.length === 0) {
      alert("No hay ventas en la caja del día de hoy.")
      return
    }
    if (confirm(`¿Deseas realizar el Cierre de Caja del día por un total de ${soles(totalHoy)}? Se descargará el reporte en Excel.`)) {
      downloadBackup()
      alert("Cierre de caja realizado con éxito.")
    }
  }

  return (
    <section aria-label="Panel de Administración" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <ShieldCheck className="size-7 text-primary" /> Panel de Administración
          </h2>
          <p className="text-sm text-muted-foreground">Arqueo de caja, reposición de inventario y respaldos en Excel.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadBackup}
            className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-bold shadow-sm hover:bg-secondary"
          >
            <Download className="size-4 text-primary" /> Descargar Excel de Ventas
          </button>
          <div className="flex gap-1 rounded-2xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => setAdminTab("cierre")}
              className={`h-11 rounded-xl px-4 text-sm font-bold ${
                adminTab === "cierre" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              📊 Cierre del Día
            </button>
            <button
              type="button"
              onClick={() => setAdminTab("compras")}
              className={`h-11 rounded-xl px-4 text-sm font-bold ${
                adminTab === "compras" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              🛒 Reposición ({agotados.length})
            </button>
          </div>
        </div>
      </div>

      {adminTab === "cierre" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-muted-foreground">Total Recaudado Hoy</p>
              <p className="mt-2 text-4xl font-extrabold text-primary">{soles(totalHoy)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Efectivo: {soles(ventasEfectivo)} | Yape: {soles(ventasYape)}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-muted-foreground">Ganancia Estimada</p>
              <p className="mt-2 text-4xl font-extrabold text-emerald-600">{soles(totalHoy * 0.45)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Margen promedio del 45%</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-muted-foreground">Cierre de Jornada</p>
                <div className="mt-1 flex items-center gap-2 text-lg font-bold text-emerald-600">
                  <CheckCircle className="size-5" /> Caja Cuadrada
                </div>
              </div>
              <button
                type="button"
                onClick={handleCerrarCaja}
                className="mt-3 h-10 w-full rounded-xl bg-destructive/10 text-destructive font-bold text-xs hover:bg-destructive/20"
              >
                Cerrar Caja y Exportar
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <h3 className="text-lg font-bold mb-3">Ventas Registradas Hoy ({sales.length})</h3>
            {sales.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No hay ventas registradas aún.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl bg-secondary/50 p-3 text-sm">
                    <div>
                      <p className="font-bold">{s.cashierName} · <span className="uppercase text-xs font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{s.paymentType}</span></p>
                      <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <span className="text-base font-extrabold">{soles(s.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-700 dark:text-amber-400 flex items-center gap-3">
            <AlertTriangle className="size-6 shrink-0" />
            <p className="text-sm font-medium">Ingresa la cantidad exacta que compraste para actualizar el inventario de golosinas y librería.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productosConStock.map((s) => {
              const currentStock = s.stock ?? 0
              const isLow = currentStock <= (s.minStock ?? 5)
              const amountToAdd = Number(customStock[s.id]) || 0
              const isButtonDisabled = amountToAdd <= 0

              return (
                <div key={s.id} className={`rounded-3xl border p-4 shadow-sm flex flex-col justify-between ${isLow ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-card"}`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-lg">{s.name}</span>
                      {isLow ? <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">¡Agotándose!</span> : null}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Stock actual: <strong className="text-foreground">{currentStock} {s.unit}s</strong></p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border">
                    <label className="text-xs font-bold text-muted-foreground block mb-1.5">Añadir unidades compradas:</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="Ej. 20"
                        value={customStock[s.id] || ""}
                        onChange={(e) => setCustomStock({ ...customStock, [s.id]: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base font-bold outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddStock(s.id, currentStock)}
                        disabled={isButtonDisabled}
                        className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="size-4" /> Sumar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function Shell() {
  const { hydrated, credits, activeCashier } = usePos()
  const [tab, setTab] = useState<Tab>("vender")

  const admin = isAdmin(activeCashier)
  const pendientes = credits.filter((c) => !isCreditSettled(c))
  const totalDeuda = pendientes.reduce((sum, c) => sum + creditBalance(c), 0)

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        Cargando Caja Familiar…
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Store className="size-6" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold leading-tight sm:text-xl">Tienda Dustalina</h1>
              <p className="text-xs text-muted-foreground">Servicios, copias y fiados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VoiceAssistant />
            <ThemeToggle />
            <UserSelector />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-3">
          <nav className="inline-flex w-full rounded-2xl border border-border bg-secondary p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setTab("vender")}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 font-bold transition-colors sm:flex-none ${
                tab === "vender" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              <ShoppingBag className="size-5" /> Vender
            </button>
            <button
              type="button"
              onClick={() => setTab("cuentas")}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 font-bold transition-colors sm:flex-none ${
                tab === "cuentas" ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              <BookOpen className="size-5" /> Cuentas por Cobrar
              {pendientes.length > 0 ? (
                <span
                  className="ml-1 rounded-full px-2 py-0.5 text-xs font-extrabold text-white"
                  style={{ backgroundColor: "var(--warning)" }}
                >
                  {soles(totalDeuda)}
                </span>
              ) : null}
            </button>

            {admin ? (
              <button
                type="button"
                onClick={() => setTab("admin")}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 font-bold transition-colors sm:flex-none ${
                  tab === "admin" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
                }`}
              >
                <ShieldCheck className="size-5" /> Administración
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === "vender" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <ServicesPanel />
            <div className="lg:sticky lg:top-36 lg:h-[calc(100vh-10rem)]">
              <CartPanel />
            </div>
          </div>
        ) : tab === "cuentas" ? (
          <CuentasPorCobrar />
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  )
}

export function PosApp() {
  return (
    <PosProvider>
      <CartProvider>
        <Shell />
      </CartProvider>
    </PosProvider>
  )
}
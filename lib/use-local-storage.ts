"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const EVENT = "pos-storage-sync"

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * Estado persistido en localStorage y sincronizado entre componentes
 * (misma pestaña vía CustomEvent y otras pestañas vía storage event).
 * Devuelve [valor, setter, hidratado].
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)
  // Ref con el valor más reciente para calcular actualizaciones sin
  // ejecutar efectos secundarios dentro del updater de setState (evita
  // dobles ejecuciones en React Strict Mode y reentradas por el evento).
  const valueRef = useRef<T>(value)

  useEffect(() => {
    const current = read(key, initial)
    valueRef.current = current
    setValue(current)
    setHydrated(true)

    const sync = () => {
      const next = read(key, initial)
      valueRef.current = next
      setValue(next)
    }
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string } | undefined
      if (!detail || detail.key === key) sync()
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) sync()
    }

    window.addEventListener(EVENT, onSync as EventListener)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(EVENT, onSync as EventListener)
      window.removeEventListener("storage", onStorage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (p: T) => T)(valueRef.current)
          : next
      valueRef.current = resolved
      setValue(resolved)
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved))
        window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }))
      } catch {
        console.log("[v0] No se pudo guardar en localStorage:", key)
      }
    },
    [key],
  )

  return [value, update, hydrated] as const
}

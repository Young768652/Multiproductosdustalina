export function round2(amount: number) {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100) / 100
}

export function soles(amount: number) {
  return `S/. ${round2(amount).toFixed(2)}`
}

export function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function relativeDay(iso: string) {
  try {
    const d = new Date(iso)
    const today = new Date()
    const diff = Math.floor(
      (today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) /
        86400000,
    )
    if (diff <= 0) return "Hoy"
    if (diff === 1) return "Ayer"
    if (diff < 7) return `Hace ${diff} días`
    return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
  } catch {
    return iso
  }
}

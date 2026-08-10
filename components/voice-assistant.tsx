"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { usePos } from "@/lib/pos-store"
import { useCart } from "@/lib/cart-store"

export function VoiceAssistant() {
  const { services } = usePos()
  const { addItem, removeItem, clear, total, items } = useCart()
  const [isListening, setIsListening] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [lastTranscript, setLastTranscript] = useState("")

  const recognitionRef = useRef<any>(null)

  function normalizeText(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quita tildes
      .trim()
  }

  function speak(text: string) {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "es-PE"
    utterance.rate = 1.0
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  const prevTotalRef = useRef(total)
  useEffect(() => {
    if (total > 0 && total !== prevTotalRef.current && items.length > 0) {
      const solesInt = Math.floor(total)
      const centimos = Math.round((total - solesInt) * 100)

      let textoTotal = `El total es ${solesInt} ${solesInt === 1 ? "sol" : "soles"}`
      if (centimos > 0) {
        textoTotal += ` con ${centimos} céntimos`
      }

      speak(textoTotal)
    }
    prevTotalRef.current = total
  }, [total, items])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = "es-PE"

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setLastTranscript(transcript)
          processVoiceCommand(transcript)
          setIsListening(false)
        }

        recognition.onerror = () => setIsListening(false)
        recognition.onend = () => setIsListening(false)

        recognitionRef.current = recognition
      }
    }
  }, [services, items])

  // Detección Ultra-Precisa de Números
  function detectExactQuantity(rawText: string): number {
    const norm = normalizeText(rawText)

    // Solo si el usuario pronunció una cifra numérica o palabra de número CLARA
    const digitsMatch = norm.match(/\b(\d+)\b/)
    if (digitsMatch) {
      const parsed = parseInt(digitsMatch[1], 10)
      if (parsed > 0 && parsed < 500) return parsed
    }

    if (/\b(dos|2)\b/.test(norm)) return 2
    if (/\b(tres|3)\b/.test(norm)) return 3
    if (/\b(cuatro|4)\b/.test(norm)) return 4
    if (/\b(cinco|5)\b/.test(norm)) return 5
    if (/\b(diez|10)\b/.test(norm)) return 10
    if (/\b(veinte|20)\b/.test(norm)) return 20
    if (/\b(cincuenta|50)\b/.test(norm)) return 50
    if (/\b(cien|100)\b/.test(norm)) return 100

    // Si no dijo un número explícito, la cantidad por defecto es estrictamente 1
    return 1
  }

  function processVoiceCommand(rawText: string) {
    const textNorm = normalizeText(rawText)

    // 1. COMANDO VACIAR / LIMPIAR TODO
    if (/\b(vaciar|limpiar|borrar todo|eliminar todo)\b/.test(textNorm)) {
      clear()
      speak("Carrito vaciado por completo.")
      return
    }

    // 2. DETECTAR SI ES UN COMANDO DE ELIMINAR / QUITAR
    const isDeleteCommand = /\b(elimina|eliminar|quita|quitar|borra|borrar)\b/.test(textNorm)

    // Limpieza de palabras de relleno
    const cleanText = textNorm
      .replace(/de\s+\d+\s*(centimos|centimo|céntimos|céntimo|soles|sol)/g, "")
      .replace(/\b(agrega|añade|pon|dame|lleva|elimina|eliminar|quita|quitar|borra|borrar|por favor|un|una|de|del|los|las)\b/g, " ")
      .replace(/\b(\d+|dos|tres|cuatro|cinco|diez|veinte|cincuenta|cien)\b/g, " ")
      .trim()

    if (!cleanText) {
      speak("No entendí el producto.")
      return
    }

    // Búsqueda del producto en la tienda
    let bestMatch: any = null
    let maxScore = 0

    services.forEach((s) => {
      const sName = normalizeText(s.name)
      let score = 0

      if (sName === cleanText) score += 10
      else if (sName.includes(cleanText) || cleanText.includes(sName)) score += 5

      const textWords = cleanText.split(" ").filter((w) => w.length > 2)
      textWords.forEach((word) => {
        if (sName.includes(word)) score += 2
      })

      if (score > maxScore) {
        maxScore = score
        bestMatch = s
      }
    })

    if (bestMatch && maxScore > 0) {
      if (isDeleteCommand) {
        // Quitar ítem del carrito
        const cartItemIndex = items.findIndex((it) => it.serviceId === bestMatch.id)
        if (cartItemIndex > -1) {
          removeItem(items[cartItemIndex].id)
          speak(`Eliminado ${bestMatch.name}.`)
        } else {
          speak(`${bestMatch.name} no está en el carrito.`)
        }
      } else {
        // Agregar ítem con la cantidad exacta detectada
        const quantity = detectExactQuantity(rawText)

        addItem({
          serviceId: bestMatch.id,
          name: bestMatch.name,
          unitPrice: bestMatch.price,
          quantity: quantity,
          unit: bestMatch.unit,
        })

        speak(`Agregado ${quantity > 1 ? quantity : ""} ${bestMatch.name}.`)
      }
    } else {
      speak(`No encontré "${cleanText}" en la lista de productos.`)
    }
  }

  function toggleListening() {
    if (!recognitionRef.current) {
      alert("Tu navegador no soporta voz. Usa Google Chrome.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        speak("Te escucho")
      } catch (e) {
        setIsListening(false)
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        className={`flex h-12 items-center gap-2 rounded-2xl px-3.5 text-sm font-bold transition-all shadow-sm ${
          isListening
            ? "bg-destructive text-destructive-foreground animate-pulse"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        }`}
        title={isListening ? "Escuchando..." : "Hablar para agregar o quitar producto"}
      >
        {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        <span className="hidden md:inline">
          {isListening ? "Escuchando..." : "Asistente de Voz"}
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          const next = !speechEnabled
          setSpeechEnabled(next)
          if (!next) window.speechSynthesis?.cancel()
        }}
        className="grid size-12 place-items-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={speechEnabled ? "Desactivar voz hablada" : "Activar voz hablada"}
      >
        {speechEnabled ? <Volume2 className="size-5 text-primary" /> : <VolumeX className="size-5" />}
      </button>

      {lastTranscript && isListening ? (
        <span className="hidden lg:inline text-xs font-semibold text-muted-foreground animate-fade-in">
          "{lastTranscript}"
        </span>
      ) : null}
    </div>
  )
}
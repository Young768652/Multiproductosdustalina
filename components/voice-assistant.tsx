"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { usePos } from "@/lib/pos-store"
import { useCart } from "@/lib/cart-store"

    export function VoiceAssistant() {
    const { services } = usePos()
    const { addItem, total, items } = useCart()
    const [isListening, setIsListening] = useState(false)
    const [speechEnabled, setSpeechEnabled] = useState(true)
    const [lastTranscript, setLastTranscript] = useState("")

    const recognitionRef = useRef<any>(null)

    // Función para normalizar texto (quitar tildes y convertir a minúsculas)
    function normalizeText(text: string) {
        return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quita tildes
        .trim()
    }

    // Hacer hablar al navegador
    function speak(text: string) {
        if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return

        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "es-PE"
        utterance.rate = 1.0
        utterance.pitch = 1.0
        window.speechSynthesis.speak(utterance)
    }

    // Anunciar el total
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

            recognition.onerror = () => {
            setIsListening(false)
            }

            recognition.onend = () => {
            setIsListening(false)
            }

            recognitionRef.current = recognition
        }
        }
    }, [services])

    // Convertir palabras numéricas a números
    function parseQuantity(text: string): number {
        if (text.includes("dos") || text.includes(" 2 ")) return 2
        if (text.includes("tres") || text.includes(" 3 ")) return 3
        if (text.includes("cuatro") || text.includes(" 4 ")) return 4
        if (text.includes("cinco") || text.includes(" 5 ")) return 5
        if (text.includes("diez") || text.includes(" 10 ")) return 10
        return 1
    }

    // Buscador Inteligente
    function processVoiceCommand(rawText: string) {
    const text = normalizeText(rawText)
    const qty = parseQuantity(text)

    // Búsqueda en los productos guardados
    let foundService = services.find((s) => {
        const serviceName = normalizeText(s.name)
      // Coincidencia exacta o contenida
        return text.includes(serviceName) || serviceName.includes(text.replace(/agrega|añade|pon|dame|lleva|un|una|dos|tres|cuatro|cinco|de|por|sol|soles/g, "").trim())
    })

    // Búsqueda flexible por palabras clave individuales si no hubo coincidencia directa
    if (!foundService) {
        const words = text.split(" ").filter((w) => w.length > 2)
        foundService = services.find((s) => {
        const sName = normalizeText(s.name)
        return words.some((w) => sName.includes(w))
        })
    }

    if (foundService) {
        addItem({
        serviceId: foundService.id,
        name: foundService.name,
        unitPrice: foundService.price,
        quantity: qty,
        unit: foundService.unit,
        })

        speak(`Agregado ${qty > 1 ? qty : ""} ${foundService.name}.`)
    } else {
        speak(`No encontré el producto "${rawText}". Por favor intenta de nuevo.`)
    }
    }

    function toggleListening() {
    if (!recognitionRef.current) {
        alert("Tu navegador no soporta voz. Te recomendamos usar Google Chrome.")
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
        title={isListening ? "Escuchando..." : "Hablar para agregar producto"}
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
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

    // Función para hacer hablar al sistema
    function speak(text: string) {
        if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return

        window.speechSynthesis.cancel() // Detener speech anterior si hay
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = "es-PE" // Español de Perú / Latino
        utterance.rate = 1.0 // Velocidad normal
        utterance.pitch = 1.0
        window.speechSynthesis.speak(utterance)
    }

    // Anunciar el total hablado cuando cambia el total del carrito
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

    // Configuración del Reconocimiento de Voz
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
            const transcript = event.results[0][0].transcript.toLowerCase().trim()
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

    // Procesador inteligente de lo que el usuario habla
    function processVoiceCommand(text: string) {
        // Normalizar texto
        const cleanedText = text
        .replace(/agrega|añade|pon|dame|lleva|un|una|dos|tres|cuatro|cinco|de|por/g, " ")
        .trim()

        // Buscar coincidencia en los productos
        const matchedService = services.find((s) => {
        const name = s.name.toLowerCase()
        return text.includes(name) || cleanedText.includes(name)
        })

        if (matchedService) {
        addItem({
            serviceId: matchedService.id,
            name: matchedService.name,
            unitPrice: matchedService.price,
            quantity: 1,
            unit: matchedService.unit,
        })

        speak(`Agregado ${matchedService.name}.`)
        } else {
        speak("No encontré ese producto en la lista. Por favor intenta de nuevo.")
        }
    }

    function toggleListening() {
        if (!recognitionRef.current) {
        alert("Tu navegador no soporta reconocimiento de voz. Te recomendamos usar Google Chrome.")
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
        {/* Botón de Escuchar por Micrófono */}
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

        {/* Botón Activar / Desactivar Voz parlante */}
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
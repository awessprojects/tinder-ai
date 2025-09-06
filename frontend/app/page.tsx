"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Heart, Settings, ArrowLeft, RotateCcw } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "ai" | "hitch"
  timestamp: Date
}

interface UserProfile {
  name: string
  age: string
  interests: string[]
}

interface Personality {
  id: string
  name: string
  avatar: string
  color: string
  theme: string
}

const personalities: Personality[] = [
  { id: "suzi", name: "Suzi", avatar: "💕", color: "bg-gradient-to-r from-pink-500 to-rose-500", theme: "suzi-theme" },
  {
    id: "chler",
    name: "Chler",
    avatar: "🧡",
    color: "bg-gradient-to-r from-orange-500 to-amber-500",
    theme: "chler-theme",
  },
  {
    id: "cynthia",
    name: "Cynthia",
    avatar: "💜",
    color: "bg-gradient-to-r from-purple-500 to-violet-500",
    theme: "cynthia-theme",
  },
  {
    id: "anna",
    name: "Anna",
    avatar: "💖",
    color: "bg-gradient-to-r from-pink-600 to-fuchsia-500",
    theme: "anna-theme",
  },
]

export default function TinderChat() {
  const [currentStep, setCurrentStep] = useState<"onboarding" | "chat">("onboarding")
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: "", age: "", interests: [] })
  const [currentPersonality, setCurrentPersonality] = useState(personalities[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [ws, setWs] = useState<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Onboarding form states
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [tempName, setTempName] = useState("")
  const [tempAge, setTempAge] = useState("")
  const [tempInterests, setTempInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState("")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // WebSocket connection
  useEffect(() => {
    if (currentStep === "chat") {
      const websocket = new WebSocket("ws://localhost:8000/ws")

      websocket.onopen = () => {
        console.log("[v0] Conectado ao WebSocket")
        setWs(websocket)
      }

      websocket.onmessage = (event) => {
        console.log(event)
        const message = event.data
        const isHitchMessage = message.includes("hitch")
        const newMessage: Message = {
          id: Date.now().toString(),
          text: message,
          sender: isHitchMessage ? "hitch" : "ai",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, newMessage])
      }

      websocket.onclose = () => {
        console.log("[v0] Desconectado do WebSocket")
        setWs(null)
      }

      websocket.onerror = (error) => {
        console.log("[v0] Erro no WebSocket:", error)
      }

      return () => {
        websocket.close()
      }
    }
  }, [currentStep])

  const addInterest = () => {
    if (newInterest.trim() && !tempInterests.includes(newInterest.trim())) {
      setTempInterests([...tempInterests, newInterest.trim()])
      setNewInterest("")
    }
  }

  const removeInterest = (interest: string) => {
    setTempInterests(tempInterests.filter((i) => i !== interest))
  }

  const completeOnboarding = () => {
    setUserProfile({ name: tempName, age: tempAge, interests: tempInterests })
    setCurrentStep("chat")

    // Mensagem inicial da AI
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Oi ${tempName}! 😊 Que bom te conhecer! Sou a ${currentPersonality.name}. Como você está hoje?`,
      sender: "ai",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !ws) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Enviar para WebSocket
    ws.send(
      JSON.stringify({
        message: inputMessage,
        personality: currentPersonality.id,
        userProfile: userProfile,
      }),
    )

    setInputMessage("")
  }

  const formatMessage = (text: string) => {
    const parts = text.split(/(@hitch\s*)/g)
    return parts.map((part, index) => {
      if (part.match(/@hitch\s*/)) {
        return (
          <span key={index} className="text-blue-500 font-semibold">
            @hitch{" "}
          </span>
        )
      } else if (index > 0 && parts[index - 1]?.match(/@hitch\s*/)) {
        return (
          <span key={index} className="underline">
            {part}
          </span>
        )
      }
      return part
    })
  }

  const changePersonality = (personality: Personality) => {
    setCurrentPersonality(personality)
    document.documentElement.style.setProperty("--personality-color", personality.color)

    const changeMessage: Message = {
      id: Date.now().toString(),
      text: `Oi! Agora você está conversando com a ${personality.name}! 😊`,
      sender: "ai",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, changeMessage])
  }

  useEffect(() => {
    if (currentPersonality) {
      document.documentElement.style.setProperty("--personality-color", currentPersonality.color)
    }
  }, [currentPersonality])

  const resetConversation = () => {
    setMessages([])
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Oi ${userProfile.name}! 😊 Vamos começar uma nova conversa! Sou a ${currentPersonality.name}.`,
      sender: "ai",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }

  if (currentStep === "onboarding") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">💕</div>
            <h1 className="text-3xl font-bold text-primary mb-2">Bem-vindo!</h1>
            <p className="text-muted-foreground">Vamos nos conhecer melhor</p>
          </div>

          {onboardingStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Qual é o seu nome?</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Digite seu nome"
                />
              </div>
              <button
                onClick={() => tempName.trim() && setOnboardingStep(1)}
                disabled={!tempName.trim()}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="space-y-4">
              <button
                onClick={() => setOnboardingStep(0)}
                className="flex items-center text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </button>
              <div>
                <label className="block text-sm font-medium mb-2">Qual é a sua idade?</label>
                <input
                  type="number"
                  value={tempAge}
                  onChange={(e) => setTempAge(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Digite sua idade"
                  min="18"
                />
              </div>
              <button
                onClick={() => tempAge.trim() && Number.parseInt(tempAge) >= 18 && setOnboardingStep(2)}
                disabled={!tempAge.trim() || Number.parseInt(tempAge) < 18}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-4">
              <button
                onClick={() => setOnboardingStep(1)}
                className="flex items-center text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </button>
              <div>
                <label className="block text-sm font-medium mb-2">Quais são seus interesses para hoje?</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addInterest()}
                    className="flex-1 p-3 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: música, filmes, esportes..."
                  />
                  <button
                    onClick={addInterest}
                    className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tempInterests.map((interest) => (
                    <span
                      key={interest}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => removeInterest(interest)}
                    >
                      {interest} ×
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={completeOnboarding}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Começar a conversar! 💕
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-background transition-colors duration-300`}
      style={{
        background: `linear-gradient(135deg, ${
          currentPersonality.id === "suzi"
            ? "#fdf2f8"
            : currentPersonality.id === "chler"
              ? "#fff7ed"
              : currentPersonality.id === "cynthia"
                ? "#faf5ff"
                : "#fdf2f8"
        } 0%, #ffffff 100%)`,
      }}
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 ${currentPersonality.color} rounded-full flex items-center justify-center text-2xl shadow-lg`}
          >
            {currentPersonality.avatar}
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-800">{currentPersonality.name}</h2>
            <p className="text-sm text-gray-500">Online agora</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetConversation}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Resetar conversa"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <Heart className="w-6 h-6 text-red-500" />
          <Settings className="w-6 h-6 text-gray-500" />
        </div>
      </div>

      {/* Personality Selector */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex space-x-3 overflow-x-auto">
          {personalities.map((personality) => (
            <button
              key={personality.id}
              onClick={() => changePersonality(personality)}
              className={`flex-shrink-0 flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-200 ${
                currentPersonality.id === personality.id
                  ? "bg-white shadow-lg border-2 border-gray-300 scale-105"
                  : "hover:bg-white/50 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 ${personality.color} rounded-full flex items-center justify-center text-lg shadow-md`}
              >
                {personality.avatar}
              </div>
              <span className="text-xs font-medium text-gray-700">{personality.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            {message.sender !== "user" && (
              <div className="flex-shrink-0 mr-3">
                {message.sender === "hitch" ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    H
                  </div>
                ) : (
                  <div
                    className={`w-8 h-8 ${currentPersonality.color} rounded-full flex items-center justify-center text-sm`}
                  >
                    {currentPersonality.avatar}
                  </div>
                )}
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.sender === "user"
                  ? `${currentPersonality.color} text-white`
                  : message.sender === "hitch"
                    ? "bg-blue-50 border border-blue-200 text-blue-900"
                    : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <p className="text-sm leading-relaxed">{formatMessage(message.text)}</p>
              <p className={`text-xs mt-1 ${message.sender === "user" ? "text-white/70" : "text-gray-500"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 p-3 border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Digite sua mensagem..."
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className={`w-12 h-12 ${currentPersonality.color} text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 shadow-md`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  MessageSquare,
  Clock,
  Ticket,
  MapPin,
  Coffee,
  Info,
  ChevronRight,
  Send,
  ArrowLeft,
  X,
  User,
  Globe,
  Calendar,
  Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import TicketBookingFlow from "@/components/ticket-booking-flow"
import CancelBookingFlow from "@/components/cancel-booking-flow"
import { getTranslation } from "@/lib/translations"

type MessageType = {
  id: string
  role: "user" | "assistant"
  content: string
  type?: "text" | "menu" | "quickReplies" | "ticketBooking" | "bookingConfirmation"
  options?: string[]
  bookingDetails?: {
    date: Date
    tickets: string
    name: string
  }
}

export default function MuseumChatbot() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [input, setInput] = useState("")
  const [language, setLanguage] = useState("en")
  const [showTicketBooking, setShowTicketBooking] = useState(false)
  const [showCancelBooking, setShowCancelBooking] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [lastBookingId, setLastBookingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const t = getTranslation(language)

  // Initialize chat with welcome message
  useEffect(() => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: t.welcome,
        type: "menu",
        options: ["openingHours", "ticketPrices", "exhibitions", "directions", "facilities", "about", "bookTicket", "cancelBooking"],
      },
    ])
  }, [language])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return

    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Process user message and generate response
    setTimeout(() => {
      // Fallback response for free text input
      const botResponse: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t.fallback,
        type: "menu",
        options: ["openingHours", "ticketPrices", "exhibitions", "directions", "facilities", "about", "bookTicket"],
      }

      setMessages((prev) => [...prev, botResponse])
    }, 500)
  }

  // Handler to open cancel booking safely
  const handleOpenCancelBookingFlow = () => {
    if (isCancelling) return
    setIsCancelling(true)
    setShowCancelBooking(true)
  }

  const handleMenuSelection = (option: string) => {
    // Add user selection as a message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content: t[option as keyof typeof t] as string,
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])

    // Handle ticket booking separately
    if (option === "bookTicket") {
      setShowTicketBooking(true)
      return
    }

    // Handle cancel booking separately
    if (option === "cancelBooking") {
      handleOpenCancelBookingFlow()
      return
    }

    // Generate bot response based on selection
    setTimeout(() => {
      const responseContent = t.responses[option as keyof typeof t.responses]

      const botResponse: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        type: "quickReplies",
        options: ["anythingElse", "returnToMenu"],
      }

      setMessages((prev) => [...prev, botResponse])
    }, 500)
  }

  const handleQuickReply = (option: string) => {
    // Add user selection as a message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content: t[option as keyof typeof t] as string,
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])

    // If returning to main menu
    if (option === "returnToMenu") {
      setTimeout(() => {
        const menuResponse: MessageType = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t.welcome,
          type: "menu",
          options: ["openingHours", "ticketPrices", "exhibitions", "directions", "facilities", "about", "bookTicket", "cancelBooking"],
        }

        setMessages((prev) => [...prev, menuResponse])
      }, 500)
    } else {
      // For "Anything else?" option, just show the menu again
      setTimeout(() => {
        const menuResponse: MessageType = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t.welcome,
          type: "menu",
          options: ["openingHours", "ticketPrices", "exhibitions", "directions", "facilities", "about", "bookTicket", "cancelBooking"],
        }

        setMessages((prev) => [...prev, menuResponse])
      }, 500)
    }
  }

  const handleTicketBookingComplete = (bookingDetails: { date: Date; tickets: string; name: string }) => {
    setShowTicketBooking(false)

    // Add confirmation message
    setTimeout(() => {
      const bookingId = Date.now().toString()
      setLastBookingId(bookingId)

      const confirmationMessage: MessageType = {
        id: bookingId,
        role: "assistant",
        content: t.bookingConfirmation,
        type: "bookingConfirmation",
        options: ["cancelBooking", "rescheduleBooking", "anythingElse", "returnToMenu"],
        bookingDetails,
      }

      setMessages((prev) => [...prev, confirmationMessage])
    }, 500)
  }

  // Renamed to clarify its purpose: only adds the cancellation confirmation message
  const handleCancelBookingSuccess = () => {
    setTimeout(() => {
      const cancelConfirmation: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t.cancelConfirmation,
        type: "quickReplies",
        options: ["anythingElse", "returnToMenu"],
      }

      setMessages((prev) => [...prev, cancelConfirmation])
      setLastBookingId(null)
    }, 500)
  }

  const handleRescheduleBooking = () => {
    // Add user message for rescheduling
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content: t.rescheduleBooking,
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])
    setShowTicketBooking(true)
  }

  const getIconForOption = (option: string) => {
    switch (option) {
      case "openingHours":
        return <Clock className="mr-2 h-4 w-4" />
      case "ticketPrices":
        return <Ticket className="mr-2 h-4 w-4" />
      case "exhibitions":
        return <MessageSquare className="mr-2 h-4 w-4" />
      case "directions":
        return <MapPin className="mr-2 h-4 w-4" />
      case "facilities":
        return <Coffee className="mr-2 h-4 w-4" />
      case "about":
        return <Info className="mr-2 h-4 w-4" />
      case "bookTicket":
        return <Ticket className="mr-2 h-4 w-4" />
      case "returnToMenu":
        return <ArrowLeft className="mr-2 h-4 w-4" />
      case "cancelBooking":
        return <X className="mr-2 h-4 w-4" />
      case "rescheduleBooking":
        return <Calendar className="mr-2 h-4 w-4" />
      default:
        return <ChevronRight className="mr-2 h-4 w-4" />
    }
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "hi-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {!isChatOpen ? (
          <motion.div
            key="chat-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            // Add relative positioning to the motion.div to position the "hello message"
            className="relative"
          >
            <Button
              onClick={toggleChat}
              className="h-14 w-14 rounded-full bg-white text-white shadow-lg hover:bg-gray-800"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src="/museum-bot-avatar.png" alt="Museum Bot" />
                <AvatarFallback className="bg-black text-white">
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            </Button>
            {/* "Hello" message container */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg bg-white-800 px-3 py-2 text-sm text-white-600 font-bold shadow-md whitespace-nowrap border border-white-600">
                 Hello there, how can I assist you?
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat-window"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Card className="w-[350px] md:w-[400px] h-[600px] flex flex-col shadow-xl border-gray-200 bg-black text-white">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black rounded-t-lg">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-2 bg-white">
                    <AvatarImage src="/museum-bot-avatar.png" alt="Museum Bot" />
                    <AvatarFallback className="bg-white text-black font-bold">
                      <Bot className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold text-white">Museum Assistant</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800 hover:text-whites">
                        <Globe className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-gray-800 border-gray-800 p-0 text-white">
                      <div className="grid grid-cols-3 gap-1 p-1">
                        <Button
                          variant={language === "en" ? "default" : "ghost"}
                          onClick={() => setLanguage("en")}
                          className="justify-start text-sm"
                        >
                          English
                        </Button>
                        <Button
                          variant={language === "hi" ? "default" : "ghost"}
                          onClick={() => setLanguage("hi")}
                          className="justify-start text-sm"
                        >
                          हिन्दी
                        </Button>
                        <Button
                          variant={language === "bn" ? "default" : "ghost"}
                          onClick={() => setLanguage("bn")}
                          className="justify-start text-sm"
                        >
                          বাংলা
                        </Button>
                        <Button
                          variant={language === "gu" ? "default" : "ghost"}
                          onClick={() => setLanguage("gu")}
                          className="justify-start text-sm"
                        >
                          ગુજરાતી
                        </Button>
                        <Button
                          variant={language === "ta" ? "default" : "ghost"}
                          onClick={() => setLanguage("ta")}
                          className="justify-start text-sm"
                        >
                          தமிழ்
                        </Button>
                        <Button
                          variant={language === "te" ? "default" : "ghost"}
                          onClick={() => setLanguage("te")}
                          className="justify-start text-sm"
                        >
                          తెలుగు
                        </Button>
                        <Button
                          variant={language === "kn" ? "default" : "ghost"}
                          onClick={() => setLanguage("kn")}
                          className="justify-start text-sm"
                        >
                          ಕನ್ನಡ
                        </Button>
                        <Button
                          variant={language === "pa" ? "default" : "ghost"}
                          onClick={() => setLanguage("pa")}
                          className="justify-start text-sm"
                        >
                          ਪੰਜਾਬੀ
                        </Button>
                        <Button
                          variant={language === "mr" ? "default" : "ghost"}
                          onClick={() => setLanguage("mr")}
                          className="justify-start text-sm"
                        >
                          मराठी
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleChat}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-white">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn("mb-4", message.role === "user" ? "flex justify-end" : "flex justify-start")}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 mr-2 mt-1 bg-black">
                          <AvatarImage src="/museum-bot-avatar.png" alt="Museum Bot" />
                          <AvatarFallback className="bg-black text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.role === "user"
                            ? "bg-black text-white rounded-tr-none"
                            : "bg-gray-100 text-black rounded-tl-none border border-gray-200",
                        )}
                      >
                        <p className="whitespace-pre-line">{message.content}</p>

                        {message.type === "menu" && (
                          <div className="mt-3 grid gap-2">
                            {message.options?.map((option) => (
                              <Button
                                key={option}
                                variant="outline"
                                className="justify-start text-left h-auto py-2 border-gray-300 bg-white hover:bg-gray-100 text-black"
                                onClick={() => handleMenuSelection(option)}
                              >
                                {getIconForOption(option)}
                                {t[option as keyof typeof t]}
                              </Button>
                            ))}
                          </div>
                        )}

                        {message.type === "quickReplies" && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.options?.map((option) => (
                              <Button
                                key={option}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickReply(option)}
                                className="flex items-center border-gray-300 bg-white hover:bg-gray-100 text-black"
                              >
                                {getIconForOption(option)}
                                {t[option as keyof typeof t]}
                              </Button>
                            ))}
                          </div>
                        )}

                        {message.type === "bookingConfirmation" && message.bookingDetails && (
                          <div className="mt-3">
                            <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                              <p className="font-medium">{t.bookingDetails}:</p>
                              <p>
                                {t.fullName}: {message.bookingDetails.name}
                              </p>
                              <p>
                                {t.date}: {formatDate(message.bookingDetails.date)}
                              </p>
                              <p>
                                {t.tickets}: {message.bookingDetails.tickets}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleOpenCancelBookingFlow} // This will now open the CancelBookingFlow popup
                                className="flex items-center"
                              >
                                <X className="mr-2 h-4 w-4" />
                                {t.cancelBooking}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRescheduleBooking}
                                className="flex items-center border-gray-300 bg-white hover:bg-gray-100 text-black"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {t.rescheduleBooking}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 ml-2 mt-1 bg-gray-800">
                          <AvatarImage src="/user-avatar.png" alt="User" />
                          <AvatarFallback className="bg-gray-800 text-white">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-gray-800 bg-black rounded-b-lg">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage(input)
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t.typeMessage}
                    className="flex-1 bg-white border-gray-300 text-black placeholder:text-gray-500"
                    disabled={showTicketBooking}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || showTicketBooking}
                    className="bg-white hover:bg-gray-100 text-black"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {showTicketBooking && (
        <TicketBookingFlow
          onComplete={handleTicketBookingComplete}
          onCancel={() => setShowTicketBooking(false)}
          language={language}
        />
      )}
      {showCancelBooking && (
        <CancelBookingFlow
          onComplete={() => {
            setShowCancelBooking(false)
            handleCancelBookingSuccess()
            setIsCancelling(false)
          }}
          onCancel={() => {
            setShowCancelBooking(false)
            setIsCancelling(false)
          }}
          language={language}
        />
      )}
    </div>
  )
}
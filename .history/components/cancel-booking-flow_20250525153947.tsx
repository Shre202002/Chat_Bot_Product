"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, ArrowLeft, ArrowRight, Calendar } from "lucide-react"
import { getTranslation } from "@/lib/translations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isBefore, startOfToday } from "date-fns"


type CancelBookingFlowProps = {
  onComplete: () => void
  onCancel: () => void
  language: string
}

export default function CancelBookingFlow({ onComplete, onCancel, language }: CancelBookingFlowProps) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [tickets, setTickets] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [otpError, setOtpError] = useState("")


  const t = getTranslation(language)

  // const handleEmailSubmit = () => {
  //   if (!email) return

  //   setIsSubmitting(true)

  //   // Simulate OTP sending
  //   setTimeout(() => {
  //     setIsSubmitting(false)
  //     setOtpSent(true)
  //     setStep(2)
  //   }, 1500)
  // }


  // const handleOtpSubmit = () => {
  //   if (!otp) return

  //   setIsSubmitting(true)

  //   // Simulate OTP verification
  //   setTimeout(() => {
  //     setIsSubmitting(false)
  //     setStep(3)
  //   }, 1500)
  // }

  const handleEmailSubmit = async () => {
  if (!email) {
    setEmailError("Please enter your email.")
    return
  }

  setEmailError("")
  setIsSubmitting(true)

  try {
    const response = await fetch("http://localhost:5000/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    })

    const result = await response.json()

    if (response.ok && result.status === "success") {
      setOtpSent(true)
      setStep(2)
    } else {
      setEmailError(result.message || "Failed to send OTP.")
    }
  } catch (error) {
    console.error("Error sending OTP:", error)
    setEmailError("Something went wrong.")
  } finally {
    setIsSubmitting(false)
  }
}



  const handleOtpSubmit = async () => {
  if (!otp) {
    setOtpError("Please enter the OTP.")
    return
  }

  setOtpError("")
  setIsSubmitting(true)

  try {
    const response = await fetch("http://localhost:5000/verify-cancellation-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, otp })
    })

    const result = await response.json()

    if (response.ok && result.status === "success") {
      setStep(3)  // or onComplete()
    } else {
      setOtpError(result.message || "Invalid OTP.")
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    setOtpError("Something went wrong.")
  } finally {
    setIsSubmitting(false)
  }
}

  const handleFinalSubmit = async () => {
  if (!date) return

  setIsSubmitting(true)

  const formattedDate = date
    ? `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`
    : ""

  try {
    const response = await fetch("http://localhost:5000/cancel-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        date: formattedDate,
      }),
    })

    const result = await response.json()

    if (response.ok && result.status === "success") {
      alert(result.message)
      onComplete()
    } else {
      alert(result.message || "Cancellation failed.")
    }
  } catch (error) {
    console.error("Cancellation error:", error)
    alert("Something went wrong.")
  } finally {
    setIsSubmitting(false)
  }
}




  // const handleFinalSubmit = () => {
  //   if (!date || !tickets) return

  //   setIsSubmitting(true)

  //   // Simulate cancellation process
  //   setTimeout(() => {
  //     setIsSubmitting(false)
  //     onComplete()
  //   }, 1500)
  // }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-gray-200">
            <CardHeader className="relative border-b">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
              <CardTitle>{t.cancelBooking}</CardTitle>
            </CardHeader>

            {step === 1 && (
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                    <p className="text-sm text-gray-500">
                      {t.emailVerificationMessage || "Please enter the email associated with your booking."}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}

            {step === 2 && (
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">{t.otp || "Verification Code"}</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder={t.otpPlaceholder || "Enter OTP"}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    {otpError && <p className="text-sm text-red-500">{otpError}</p>}
                    <p className="text-sm text-gray-500">
                      {t.otpVerificationMessage || `We've sent a verification code to ${email}. Please enter it above.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}

            {step === 3 && (
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t.selectCancellationDate || "Select date to cancel your tickets for"}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => isBefore(date, startOfToday())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            )}



            {/* {step === 3 && (
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t.date}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : t.selectDate || "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tickets">{t.tickets}</Label>
                    <Select value={tickets} onValueChange={setTickets}>
                      <SelectTrigger id="tickets" className="w-full">
                        <SelectValue placeholder={t.selectTickets || "Select number of tickets"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )} */}

            <CardFooter className="border-t p-4">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
                </Button>
              )}

              <Button
                className="ml-auto"
                disabled={
                  isSubmitting || (step === 1 && !email) || (step === 2 && !otp) || (step === 3 && (!date))
                }
                onClick={step === 1 ? handleEmailSubmit : step === 2 ? handleOtpSubmit : handleFinalSubmit}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    {t.processing || "Processing..."}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {step === 3 ? t.cancelBooking : t.continue}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

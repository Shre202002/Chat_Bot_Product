"use client"

import type React from "react"
import axios from "axios"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays } from "date-fns"
import { CalendarIcon, Loader2, X } from "lucide-react"
import { getTranslation } from "@/lib/translations"
import { pre } from "framer-motion/client"

interface FormData {
  fullName: string
  phoneNumber: string
  email: string
  age: string
  gender: string
  country: string
  state: string
  pincode: string
  otp: string
  date: Date
  tickets: string
  additionalPassengers: Array<{ fullName: string; age: string }>
}

interface BookingInfo {
  amount: number
  currency: string
  receipt: string
  bookingData: {
    name: string
    mail: string
    phone: string
    ticket: string
    date: string
    time: string
    location: string
    passengers: Array<{ name: string; age: string; fullName?: string }>
  }
}

declare global {
  interface Window {
    Razorpay: any
  }
}

type TicketBookingFlowProps = {
  onComplete: (bookingDetails: { date: Date; tickets: string; name: string }) => void
  onCancel: () => void
  language: string
}

export default function TicketBookingFlow({ onComplete, onCancel, language }: TicketBookingFlowProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [message, setMessage] = useState("")
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null) // for ticket data

  useEffect(() => {
    if (bookingInfo) {
      paymentgateway(bookingInfo)
    }
  }, [bookingInfo])

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    age: "",
    gender: "",
    country: "",
    state: "",
    pincode: "",
    otp: "",
    date: new Date(),
    tickets: "1",
    additionalPassengers: [] as Array<{ fullName: string; age: string }>,
  })
  const [loading, setLoading] = useState(false)

  const t = getTranslation(language)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
      state: value !== "India" ? "NA" : "",
      pincode: value !== "India" ? "NA" : "",
    }))
  }

  // const handleContinue = () => {
  //   setLoading(true)

  //   // Simulate processing
  //   setTimeout(() => {
  //     setLoading(false)
  //     setStep((prev) => prev + 1)
  //   }, 1000)
  // }

  // Validate user info and proceed to the next step
  const handleContinue = async () => {
    setLoading(true)
    setErrors({})
    setMessage("")

    // Validate required fields for step 1
    const requiredFields = ["fullName", "age", "gender", "country", "phoneNumber", "email"]
    const newErrors: { [key: string]: string } = {}

    requiredFields.forEach((field) => {
      if (!(formData as any)[field]?.trim()) {
        newErrors[field] = t.fieldRequired
      }
    })

    // Additional validation for India-specific fields
    if (formData.country === "India") {
      if (!formData.state?.trim()) {
        newErrors.state = t.fieldRequired
      }
      if (!formData.pincode?.trim()) {
        newErrors.pincode = t.fieldRequired
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    // Validate age
    if (Number.parseInt(formData.age) <= 12) {
      setErrors({ age: t.ageAbove12 })
      setLoading(false)
      return
    }

    try {
      const res = await axios.post("http://localhost:5000/validate-user-info", {
        name: formData.fullName,
        phone: formData.phoneNumber,
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        country: formData.country,
        state: formData.state,
        pincode: formData.pincode,
      })

      setMessage(res.data.message)
      // Print the formData to check if the data is being sent correctly
      setStep((prev) => prev + 1)
    } catch (err: any) {
      if (err.res && err.res.data && err.res.data.errors) {
        setErrors(err.res.data.errors)
      } else {
        setMessage("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Resend Send OTP to the user's email

  const handelResendOtp = async () => {
    setLoading(true)
    setErrors({})
    setMessage("")

    try {
      const res = await axios.post("http://localhost:5000/validate-user-info", {
        name: formData.fullName,
        phone: formData.phoneNumber,
        email: formData.email,
      })

      setMessage(res.data.message)
      // Print the formData to check if the data is being sent correctly
    } catch (err: any) {
      if (err.res && err.res.data && err.res.data.errors) {
        setErrors(err.res.data.errors)
      } else {
        setMessage("Something went wrong. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Verification of OTP
  const handleVerifyOTP = async () => {
    setLoading(true)
    setErrors({})
    setMessage("")

    try {
      // Print the formData to check if the OTP is being sent correctly
      console.log("Form Data:", formData)
      const res = await axios.post("http://localhost:5000/verify-otp", {
        email: formData.email,
        otp: formData.otp,
      })

      setMessage(res.data.message)
      setStep((prev) => prev + 1)
    } catch (err: any) {
      if (err.res?.data?.errors) {
        setErrors(err.res.data.errors)
      } else {
        setMessage("Invalid OTP. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTicketChange = (value: string) => {
    const ticketCount = Number.parseInt(value)
    const additionalPassengerCount = ticketCount - 1

    // Create array for additional passengers
    const newAdditionalPassengers = Array.from({ length: additionalPassengerCount }, (_, index) => ({
      fullName: formData.additionalPassengers[index]?.fullName || "",
      age: formData.additionalPassengers[index]?.age || "",
    }))

    setFormData((prev) => ({
      ...prev,
      tickets: value,
      additionalPassengers: newAdditionalPassengers,
    }))
  }

  const handleAdditionalPassengerChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalPassengers: prev.additionalPassengers.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger,
      ),
    }))
  }

  // Book tickets
  const handleBookTickets = async () => {
    setLoading(true)
    setMessage("")
    setErrors({})

    // Validate required fields for step 3
    if (!formData.date) {
      setMessage(t.dateRequired)
      setLoading(false)
      return
    }

    if (!formData.tickets || formData.tickets === "0") {
      setMessage(t.ticketsRequired)
      setLoading(false)
      return
    }

    // Validate additional passengers ages and required fields
    if (Number.parseInt(formData.tickets) > 1) {
      const incompletePassengers = formData.additionalPassengers.some(
        (passenger) => !passenger.fullName.trim() || !passenger.age.trim(),
      )

      if (incompletePassengers) {
        setMessage(t.fillAllPassengerDetails)
        setLoading(false)
        return
      }

      const underagePassengers = formData.additionalPassengers.some((passenger) => Number.parseInt(passenger.age) <= 12)

      if (underagePassengers) {
        setMessage(t.allPassengersAbove12)
        setLoading(false)
        return
      }
    }




    try {
      const res = await axios.post("http://localhost:5000/book-tickets", {
        email: formData.email,
        date: formData.date?.toISOString().split("T")[0],
        tickets: Number.parseInt(formData.tickets),
        mainPassenger: {
          name: formData.fullName,
          age: formData.age,
        },
        additionalPassengers: formData.additionalPassengers,
      })

      console.log("Booking res:", res.data)

      if (res.data.status !== "success") {
        console.log("Booking Error:", res.data.message)
        setMessage(res.data.message)
      }

      const newBookingInfo = {
        amount: Number.parseInt(formData.tickets) * 10000,
        currency: "INR",
        receipt: `receipt#${Math.floor(Math.random() * 10000)}`,
        bookingData: {
          name: formData.fullName,
          mail: formData.email,
          phone: formData.phoneNumber,
          ticket: formData.tickets,
          date: formData.date.toISOString().split("T")[0],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          location: "Museum of Natural History, New York",
          passengers: [{ name: formData.fullName, age: formData.age }, ...formData.additionalPassengers],
        },
      }

      setBookingInfo(newBookingInfo)
      console.log("Booking Info:", bookingInfo)
      if (res.data.status === "success") {
        paymentgateway(bookingInfo)
      }

      setMessage(res.data.message)
    } catch (err: any) {
      setMessage("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Payment Gateway Integration (Dummy function)

  const paymentgateway = async (bookingInfo: BookingInfo | null) => {
    console.log("Booking Info:", bookingInfo)
    // Check if bookingInfo is not null



    // console.log("Payment Info:", bookingInfo.amount, bookingInfo.currency, bookingInfo.receipt)

    try {
      const res = await fetch("http://localhost:5000/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingInfo),
      })
      const data = await res.json()

      console.log("Payment Gateway res:", data)
      if (data.status === "success") {
        console.log("Payment successful:", data)
      }

      // 2) load the Razorpay checkout script
      await new Promise((res, rej) => {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = res
        script.onerror = rej
        document.body.appendChild(script)
      })

      // 3) open the Razorpay checkout with the order details

      const options = {
        key: "rzp_test_eArhJz6sk8Wtm6", // your publishable key
        amount: data.amount,
        currency: data.currency,
        name: "Museum of Natural History",
        description: `Booking ${bookingInfo.ticketCount} ticket(s)`,
        order_id: data.orderId,
        prefill: {
          name: bookingInfo.name,
          email: bookingInfo.email,
          contact: bookingInfo.phone,
        },

        handler: async function (res) {
          console.log("Payment success:", res);

          const verificationPayload = {
            razorpay_order_id: res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature: res.razorpay_signature,
            bookingInfo: {
              name: bookingInfo.bookingData.name,
              email: bookingInfo.bookingData.mail,
              phone: bookingInfo.bookingData.phone,
              ticketCount: bookingInfo.bookingData.ticket,
              date: bookingInfo.bookingData.date,
              time: bookingInfo.bookingData.time,
              location: bookingInfo.bookingData.location,
            },
          }

          // Send payment info and booking info to backend for verification
          try {
            const verifyRes = await fetch("http://localhost:5000/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...verificationPayload, ...bookingInfo }),
            })

            const result = await verifyRes.json()
            if (result.status === "success") {
              console.log("Payment verified:", result)
              setPaymentSuccess(true)
              setMessage("Payment successful and verified! Your tickets have been booked.")
              setStep((prev) => prev + 1)
              setTicketData(verificationPayload) // Save payload for later download

              // Call the downloadTicket function here
              downloadTicket(verificationPayload)
            } else {
              setPaymentSuccess(false)
              setMessage("Payment verification failed. Please contact support.")
            }
          } catch (err) {
            console.error("Verification error:", err)
            setMessage("Error verifying payment.")
          }
        },
        theme: { color: "#8B5CF6" },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error("Error during payment:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadTicket = async (payload: any) => {
    try {
      console.log("Download Ticket is called")
      console.log("Payload:", payload)

      const response = await fetch("http://127.0.0.1:5000/generate-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_id: payload.razorpay_payment_id,
          date: formData.date ? `${formData.date.getDate().toString().padStart(2, '0')}-${(formData.date.getMonth() + 1).toString().padStart(2, '0')}-${formData.date.getFullYear()}` : "",
          name: payload.bookingInfo.name,
          ticket: payload.bookingInfo.ticketCount,
          valid_status: 1,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "ticket.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed", error)
    }
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
  }

  const handleComplete = () => {
    setLoading(true)

    // Simulate payment processing
    setTimeout(() => {
      setLoading(false)
      onComplete({
        date: formData.date,
        tickets: formData.tickets,
        name: formData.fullName,
      })
    }, 2000)
  }

  // Generate available dates (next 7 days)
  const today = new Date()
  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1))

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md my-8 mx-auto"
        >
          <Card className="shadow-xl bg-white text-black border-gray-200 max-h-[90vh] flex flex-col">
            <CardHeader className="relative border-b border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 text-gray-500 hover:text-black hover:bg-gray-100"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-black">{t.bookTicket}</CardTitle>
              <div className="flex justify-between mt-4">
                <div className={`flex flex-col items-center ${step >= 1 ? "text-black" : "text-gray-400"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-black text-white" : "bg-gray-200"}`}
                  >
                    1
                  </div>
                  <span className="text-xs mt-1">{t.personalInfo}</span>
                </div>
                <div className={`flex flex-col items-center ${step >= 2 ? "text-black" : "text-gray-400"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-black text-white" : "bg-gray-200"}`}
                  >
                    2
                  </div>
                  <span className="text-xs mt-1">{t.verification}</span>
                </div>
                <div className={`flex flex-col items-center ${step >= 3 ? "text-black" : "text-gray-400"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-black text-white" : "bg-gray-200"}`}
                  >
                    3
                  </div>
                  <span className="text-xs mt-1">{t.ticketDetails}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 overflow-y-auto flex-1">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700">
                      {t.fullName}
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="bg-white border-gray-300 text-black"
                      required
                    />
                    {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-gray-700">
                        {t.age}
                      </Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        min="1"
                        max="120"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="bg-white border-gray-300 text-black"
                        required
                      />
                      {errors.age && <p className="text-sm text-red-600">{errors.age}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-gray-700">
                        {t.gender}
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger className="bg-white border-gray-300 text-black">
                          <SelectValue placeholder={t.selectGender} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-black">
                          <SelectItem value="male">{t.male}</SelectItem>
                          <SelectItem value="female">{t.female}</SelectItem>
                          <SelectItem value="other">{t.other}</SelectItem>
                          <SelectItem value="prefer-not-to-say">{t.preferNotToSay}</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-gray-700">
                      {t.country}
                    </Label>
                    <Select value={formData.country} onValueChange={handleCountryChange}>
                      <SelectTrigger className="bg-white border-gray-300 text-black">
                        <SelectValue placeholder={t.selectCountry} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 text-black">
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Japan">Japan</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-sm text-red-600">{errors.country}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-gray-700">
                        {t.state}
                      </Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="bg-white border-gray-300 text-black"
                        disabled={formData.country !== "India"}
                        placeholder={formData.country !== "India" ? "NA" : t.enterState}
                        required
                      />
                      {errors.state && <p className="text-sm text-red-600">{errors.state}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-gray-700">
                        {t.pincode}
                      </Label>
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="bg-white border-gray-300 text-black"
                        disabled={formData.country !== "India"}
                        placeholder={formData.country !== "India" ? "NA" : t.enterPincode}
                        required
                      />
                      {errors.pincode && <p className="text-sm text-red-600">{errors.pincode}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-gray-700">
                      {t.phoneNumber}
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="bg-white border-gray-300 text-black"
                      required
                    />
                    {errors.phoneNumber && <p className="text-sm text-red-600">{errors.phoneNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      {t.email}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-white border-gray-300 text-black"
                      required
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* Buttons for continue and cancel */}
                  <div className="space-y-2 flex justify-end items-center">
                    <Button
                      onClick={handleContinue}
                      disabled={loading}
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t.continue}
                    </Button>


                    
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{t.otpSent}</p>

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-gray-700">
                      {t.enterOTP}
                    </Label>
                    <Input
                      id="otp"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      maxLength={6}
                      className="text-center text-xl tracking-widest bg-white border-gray-300 text-black"
                      required
                    />
                    {message && <p className="text-green-600 text-sm">{message}</p>}
                    {errors.otp && <p className="text-red-500 text-sm">{errors.otp}</p>}
                  </div>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-gray-600 hover:text-black"
                      onClick={handelResendOtp}
                      disabled={loading}
                    >
                      {t.resendOTP}
                    </Button>

                    <Button onClick={handleVerifyOTP} disabled={loading}>
                      {loading ? <Loader2 className="animate-spin h-4 w-4" /> : t.verify}
                    </Button>

                    

                    

                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  {/* Date Picker */}
                  <div className="space-y-2">
                    <Label className="text-gray-700">{t.selectDate}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white border-gray-300 text-black hover:bg-gray-100"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : <span>{t.pickDate}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-gray-200">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => setFormData((prev) => ({ ...prev, date: date || new Date() }))}
                          disabled={(date) => {
                            return !availableDates.some(
                              (d) =>
                                d.getDate() === date.getDate() &&
                                d.getMonth() === date.getMonth() &&
                                d.getFullYear() === date.getFullYear(),
                            )
                          }}
                          initialFocus
                          className="bg-white text-black"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Ticket Count */}
                  <div className="space-y-2">
                    <Label htmlFor="tickets" className="text-gray-700">
                      {t.numberOfTickets}
                    </Label>
                    <Select value={formData.tickets} onValueChange={handleTicketChange}>
                      <SelectTrigger className="bg-white border-gray-300 text-black">
                        <SelectValue placeholder={t.selectNumberOfTickets} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 text-black">
                        {Array.from({ length: 10 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {message && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-600">{message}</p>
                    </div>
                  )}

                  {/* Additional Passengers */}
                  {Number.parseInt(formData.tickets) > 1 && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                          {t.additionalPassengers} ({Number.parseInt(formData.tickets) - 1})
                        </h3>
                        {formData.additionalPassengers.map((passenger, index) => (
                          <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-lg mb-3">
                            <h4 className="font-medium text-gray-700">
                              {t.passenger} {index + 2}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="text-gray-700">{t.fullName}</Label>
                                <Input
                                  value={passenger.fullName}
                                  onChange={(e) => handleAdditionalPassengerChange(index, "fullName", e.target.value)}
                                  className="bg-white border-gray-300 text-black"
                                  placeholder={t.enterFullName}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-700">{t.age}</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="120"
                                  value={passenger.age}
                                  onChange={(e) => handleAdditionalPassengerChange(index, "age", e.target.value)}
                                  className="bg-white border-gray-300 text-black"
                                  placeholder={t.enterAge}
                                  required
                                />
                                {passenger.age && Number.parseInt(passenger.age) <= 12 && Number.parseInt(passenger.age) > 100 && (
                                  <p className="text-sm text-red-600">{t.ageAbove12}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep((prev) => prev - 2)}>
                      Back
                    </Button>
                    <Button
                      onClick={handleBookTickets}
                      disabled={loading}
                      className={`relative flex items-center justify-center ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {loading && (
                        <svg
                          className="animate-spin h-5 w-5 mr-2 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      )}
                      {loading ? "Booking..." : "🎟️ Pay Now"}
                    </Button>

                     <Button 
                    onClick={prev => setStep((prev) => prev +1)}
                    >
                      {t.cancel}
                    </Button>

                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 text-center">
                  <h2 className="text-2xl font-semibold text-green-600">🎉 {t.paymentSuccessful}</h2>
                  <p className="text-gray-700">{t.bookingThankYou}</p>
                  <div className="pl-8 mt-4 flex content-between items-center w-full">
                    <Button
                      onClick={() => downloadTicket(ticketData)}
                      className="mr-2 bg-green-600 text-white hover:bg-blue-700"
                    >
                      ⬇️ {t.downloadTicket}
                    </Button>

                    <Button
                      onClick={() => setStep((prev) => 1)}
                      variant="outline"
                      className="ml-2 border-gray-300 bg-white hover:bg-gray-100 text-black"
                    >
                      {t.bookAnotherTicket}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>

            {/* <CardFooter className="flex justify-between border-t border-gray-200 pt-4">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-gray-300 bg-white hover:bg-gray-100 text-black"
                >
                  {t.back}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="border-gray-300 bg-white hover:bg-gray-100 text-black"
                >
                  {t.cancel}
                </Button>
              )}

              {step < 4 ? (
                <Button onClick={handleContinue} disabled={loading} className="bg-black hover:bg-gray-800 text-white">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.continue}
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading} className="bg-black hover:bg-gray-800 text-white">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? t.processing : t.pay}
                </Button>
              )}
            </CardFooter> */}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

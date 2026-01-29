'use client'

import React, { useState } from 'react'

interface ConfirmResult {
  orderId: string
  customerName: string
  phone: string
  deliveredCount: number
  deliveredItems: string[]
}

export function DeliveryConfirmForm() {
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ConfirmResult | null>(null)

  // Get clean phone digits (without spaces, dashes, plus)
  const cleanPhoneDigits = phone.replace(/[\s\-+]/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    // Validate phone
    if (cleanPhoneDigits.length < 9) {
      setError('Please enter a valid phone number')
      return
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      setError('Please enter a valid 4-digit PIN')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/delivery-codes/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhoneDigits, code: pin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm delivery')
      }

      setResult(data.order)
      setPhone('')
      setPin('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, spaces, dashes, and plus sign
    const value = e.target.value.replace(/[^\d\s\-+]/g, '')
    setPhone(value)
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(value)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setPhone('')
    setPin('')
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-300 p-4">
          <p className="text-green-900 font-semibold text-lg mb-3">Delivery Confirmed!</p>
          <div className="space-y-2 text-sm text-green-800">
            <p>
              <span className="font-medium">Order:</span> #{result.orderId}
            </p>
            <p>
              <span className="font-medium">Customer:</span> {result.customerName}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {result.phone}
            </p>
            <p>
              <span className="font-medium">Items Delivered:</span> {result.deliveredCount}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="w-full bg-black text-white py-3 px-4 font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors uppercase tracking-wide text-sm"
        >
          Confirm Another Delivery
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Phone Number */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
          Customer Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="024 530 1631"
          className="w-full px-4 py-3 text-lg border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
          disabled={isLoading}
          required
        />
      </div>

      {/* Delivery PIN */}
      <div>
        <label htmlFor="pin" className="block text-sm font-medium text-gray-900 mb-2">
          Delivery PIN
        </label>
        <input
          id="pin"
          type="text"
          inputMode="numeric"
          pattern="\d{4}"
          value={pin}
          onChange={handlePinChange}
          placeholder="0000"
          maxLength={4}
          className="w-full px-4 py-3 text-center text-3xl font-bold tracking-[0.5em] border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
          disabled={isLoading}
          required
        />
        <p className="mt-2 text-xs text-gray-500 text-center">
          Ask the customer for their 4-digit PIN
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || cleanPhoneDigits.length < 9 || pin.length !== 4}
        className="w-full bg-black text-white py-3 px-4 font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors uppercase tracking-wide text-sm"
      >
        {isLoading ? 'Confirming...' : 'Confirm Delivery'}
      </button>
    </form>
  )
}

'use client'

import React, { useState } from 'react'

export function ConfirmOrderForm() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate code format (4 digits)
    if (!/^\d{4}$/.test(code)) {
      setError('Please enter a valid 4-digit code')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/delivery-codes/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm delivery')
      }

      setSuccess(true)
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCode(value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-900 mb-2">
          Delivery Code
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          pattern="\d{4}"
          value={code}
          onChange={handleCodeChange}
          placeholder="0000"
          maxLength={4}
          className="w-full px-4 py-3 text-center text-3xl font-bold tracking-[0.5em] border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
          disabled={isLoading || success}
          required
        />
        <p className="mt-2 text-xs text-gray-500 text-center">Enter the 4-digit code</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-300 text-green-900 px-4 py-3">
          <p className="text-sm font-semibold">✓ Order delivery confirmed successfully!</p>
          <p className="text-xs mt-1">Your order has been marked as delivered.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || success || code.length !== 4}
        className="w-full bg-black text-white py-3 px-4 font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors uppercase tracking-wide text-sm"
      >
        {isLoading ? 'Confirming...' : success ? 'Confirmed' : 'Confirm Delivery'}
      </button>

      {success && (
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="w-full py-2 px-4 font-medium text-gray-700 hover:text-black focus:outline-none underline text-sm"
        >
          Confirm Another Order
        </button>
      )}
    </form>
  )
}

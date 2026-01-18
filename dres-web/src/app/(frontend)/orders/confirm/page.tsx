import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ConfirmOrderForm } from './ConfirmOrderForm'

export const metadata: Metadata = {
  title: 'Confirm Order | DRES',
  description: 'Enter your delivery code to confirm order receipt',
}

export default function ConfirmOrderPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight">DRES</h1>
          </Link>
        </div>

        {/* Page Title */}
        <h2 className="text-xl font-semibold text-center mb-4">Confirm Order Delivery</h2>
        <p className="text-center text-gray-600 mb-8">
          Enter the 4-digit code provided by your delivery person to confirm receipt of your order.
        </p>

        {/* Confirmation Form */}
        <div className="border border-gray-200 p-6 mb-6">
          <ConfirmOrderForm />
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Don't have a code yet? Your delivery person will provide it when they arrive with your
            order.
          </p>
        </div>
      </div>
    </main>
  )
}

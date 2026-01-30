import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { DeliveryConfirmForm } from './DeliveryConfirmForm'

export const metadata: Metadata = {
  title: 'Confirm Delivery | DRES',
  description: 'Courier delivery confirmation - enter customer phone and PIN',
}

export default function DeliveryConfirmPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight">DRES</h1>
          </Link>
        </div>

        {/* Page Title */}
        <h2 className="text-xl font-semibold text-center mb-2">Delivery Confirmation</h2>
        <p className="text-center text-gray-600 mb-8 text-sm">
          Enter the customer&apos;s phone number and the 4-digit PIN they provide to confirm
          delivery.
        </p>

        {/* Confirmation Form */}
        <div className="border border-gray-200 p-6 mb-6">
          <DeliveryConfirmForm />
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>The customer will provide their delivery PIN upon receiving their order.</p>
          <p className="text-xs">
            Having issues? Try using USSD: <strong>*426*130#</strong>
          </p>
        </div>
      </div>
    </main>
  )
}

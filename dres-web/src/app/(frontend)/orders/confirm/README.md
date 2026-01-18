# Order Confirmation Page

## Overview
Simple UI for customers to confirm order delivery by entering a 4-digit delivery code.

## Route
`/orders/confirm`

## Features
- 4-digit numeric code input
- Real-time validation
- Loading states
- Success/error messages
- Mobile-friendly (numeric keyboard on mobile devices)

## API Integration
**Endpoint:** `POST /api/delivery-codes/confirm`

**Request:**
```json
{
  "code": "1234"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Delivery confirmed! 2 item(s) marked as delivered.",
  "deliveredCount": 2,
  "orderId": "order_xyz"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid or expired delivery code."
}
```

## How It Works
1. Customer receives a 4-digit delivery code from the courier when items are out for delivery
2. Customer visits `/orders/confirm` and enters the code
3. System validates the code and marks items as delivered
4. Order status is updated automatically
5. Delivery code is deleted after successful confirmation (single-use)

## Code Flow
- Code is validated to be exactly 4 digits
- Backend checks if code exists and is not expired
- Items belonging to the seller for that order are marked as "delivered"
- If all items in the order are completed, order status changes to "completed"
- Code is deleted to prevent reuse

## Styling
Uses Tailwind CSS utility classes with:
- Clean, minimal design
- Blue primary color (#2563eb)
- Responsive layout
- Clear visual feedback
- Accessibility-friendly

## Future Enhancements
- Add order preview after entering code (before confirmation)
- Show which items will be marked as delivered
- SMS/Email notification after confirmation
- QR code scanning alternative to manual entry

// Generate unique transaction ID: TXN-YYYYMMDD-UUID
export const generateTransactionId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const uuid = crypto.randomUUID().toUpperCase()
  return `TXN-${dateStr}-${uuid}`
}

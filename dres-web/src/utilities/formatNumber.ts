/**
 * Format large numbers with K, M, B suffixes
 * Examples: 1234 -> "1.2K", 1500000 -> "1.5M", 1000000000 -> "1B"
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) {
    return num.toString()
  } else if (num < 1000000) {
    // Thousands (K)
    const value = num / 1000
    if (value >= 100) {
      return `${Math.floor(value)}K`
    }
    return `${value.toFixed(1)}K`
  } else if (num < 1000000000) {
    // Millions (M)
    const value = num / 1000000
    if (value >= 100) {
      return `${Math.floor(value)}M`
    }
    return `${value.toFixed(1)}M`
  } else {
    // Billions (B)
    const value = num / 1000000000
    if (value >= 100) {
      return `${Math.floor(value)}B`
    }
    return `${value.toFixed(1)}B`
  }
}

/**
 * Format with plus sign for values >= 1000
 * Examples: 999 -> "999", 1234 -> "1K+", 1500000 -> "1.5M+"
 */
export function formatCompactNumberWithPlus(num: number): string {
  if (num < 1000) {
    return num.toString()
  }
  return `${formatCompactNumber(num)}+`
}

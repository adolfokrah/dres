class NumberFormatter {
  NumberFormatter._();

  /// Format large numbers with K, M, B suffixes
  /// Examples: 1234 -> 1.2K, 1500000 -> 1.5M, 1000000000 -> 1B
  static String formatCompact(int number) {
    if (number < 1000) {
      return number.toString();
    } else if (number < 1000000) {
      // Thousands (K)
      final value = number / 1000;
      if (value >= 100) {
        return '${value.toInt()}K';
      }
      return '${value.toStringAsFixed(1)}K';
    } else if (number < 1000000000) {
      // Millions (M)
      final value = number / 1000000;
      if (value >= 100) {
        return '${value.toInt()}M';
      }
      return '${value.toStringAsFixed(1)}M';
    } else {
      // Billions (B)
      final value = number / 1000000000;
      if (value >= 100) {
        return '${value.toInt()}B';
      }
      return '${value.toStringAsFixed(1)}B';
    }
  }

  /// Format with plus sign for values >= 1000
  /// Examples: 999 -> 999, 1234 -> 1K+, 1500000 -> 1.5M+
  static String formatCompactWithPlus(int number) {
    if (number < 1000) {
      return number.toString();
    }
    return '${formatCompact(number)}+';
  }
}

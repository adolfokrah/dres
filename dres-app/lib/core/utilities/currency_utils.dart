import 'package:dres/core/services/currency_service.dart';

/// Currency formatting utilities
/// Uses CurrencyService for the current user's currency
class CurrencyUtils {
  CurrencyUtils._();

  /// Get the currency service instance
  static final CurrencyService _service = CurrencyService();

  /// Default currency symbol for the app (Ghana Cedi)
  static const String defaultSymbol = '₵';
  
  /// Default currency code
  static const String defaultCode = 'GHS';

  /// Get current currency symbol from service
  static String get currentSymbol => _service.symbol;

  /// Get current currency code from service
  static String get currentCode => _service.code;

  /// Format a price with the current currency symbol
  /// Example: 100.50 -> "GH₵ 100.50"
  static String format(double amount, {String? symbol}) {
    final currencySymbol = symbol ?? _service.symbol;
    return '$currencySymbol ${amount.toStringAsFixed(2)}';
  }

  /// Format a price without decimals
  /// Example: 100.50 -> "GH₵ 101"
  static String formatWhole(double amount, {String? symbol}) {
    final currencySymbol = symbol ?? _service.symbol;
    return '$currencySymbol ${amount.round()}';
  }

  /// Format a price range
  /// Example: "GH₵ 50 - GH₵ 100"
  static String formatRange(double min, double max, {String? symbol}) {
    final currencySymbol = symbol ?? _service.symbol;
    return '$currencySymbol ${min.toStringAsFixed(0)} - $currencySymbol ${max.toStringAsFixed(0)}';
  }

  /// Update the current currency from API response
  static void updateFromResponse(Map<String, dynamic>? currencyData) {
    _service.updateFromResponse(currencyData);
  }

  /// Get currency symbol from code
  static String getSymbol(String? code) {
    switch (code?.toUpperCase()) {
      case 'GHS':
        return '₵';
      case 'USD':
        return '\$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'NGN':
        return '₦';
      case 'KES':
        return 'KSh';
      case 'ZAR':
        return 'R';
      default:
        return code ?? defaultSymbol;
    }
  }
}

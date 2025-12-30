import 'package:flutter/foundation.dart';

/// Currency information from the API
class CurrencyInfo {
  final String code;
  final String symbol;

  const CurrencyInfo({
    required this.code,
    required this.symbol,
  });

  factory CurrencyInfo.fromJson(Map<String, dynamic> json) {
    return CurrencyInfo(
      code: json['code'] ?? 'GHS',
      symbol: json['symbol'] ?? '₵',
    );
  }

  /// Default Ghana Cedi
  static const CurrencyInfo defaultCurrency = CurrencyInfo(
    code: 'GHS',
    symbol: '₵',
  );
}

/// Global currency service that tracks the user's currency
/// Updates when API responses include currency info
class CurrencyService extends ChangeNotifier {
  static final CurrencyService _instance = CurrencyService._internal();
  factory CurrencyService() => _instance;
  CurrencyService._internal();

  CurrencyInfo _currentCurrency = CurrencyInfo.defaultCurrency;

  /// Get current currency info
  CurrencyInfo get currency => _currentCurrency;

  /// Get current currency symbol
  String get symbol => _currentCurrency.symbol;

  /// Get current currency code
  String get code => _currentCurrency.code;

  /// Update currency from API response
  void updateFromResponse(Map<String, dynamic>? currencyData) {
    if (currencyData != null) {
      final newCurrency = CurrencyInfo.fromJson(currencyData);
      if (newCurrency.code != _currentCurrency.code) {
        _currentCurrency = newCurrency;
        notifyListeners();
      }
    }
  }

  /// Format a price with current currency
  String format(double amount) {
    return '${_currentCurrency.symbol} ${amount.toStringAsFixed(2)}';
  }

  /// Format a price without decimals
  String formatWhole(double amount) {
    return '${_currentCurrency.symbol} ${amount.round()}';
  }

  /// Format a price range
  String formatRange(double min, double max) {
    return '${_currentCurrency.symbol} ${min.toStringAsFixed(0)} - ${_currentCurrency.symbol} ${max.toStringAsFixed(0)}';
  }

  /// Reset to default currency
  void reset() {
    _currentCurrency = CurrencyInfo.defaultCurrency;
    notifyListeners();
  }
}

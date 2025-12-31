/// Response from place order endpoint
class PlaceOrderResponse {
  final bool success;
  final String message;
  final PlaceOrderData? order;
  final PaymentData? payment;
  final String? error;

  PlaceOrderResponse({
    required this.success,
    required this.message,
    this.order,
    this.payment,
    this.error,
  });

  factory PlaceOrderResponse.fromJson(Map<String, dynamic> json) {
    return PlaceOrderResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      order: json['order'] != null ? PlaceOrderData.fromJson(json['order']) : null,
      payment: json['payment'] != null ? PaymentData.fromJson(json['payment']) : null,
      error: json['error'],
    );
  }
}

/// Order data from place order response
class PlaceOrderData {
  final String id;
  final String orderId;
  final String status;
  final double grandTotal;
  final int totalItems;
  final CurrencyData? currency;

  PlaceOrderData({
    required this.id,
    required this.orderId,
    required this.status,
    required this.grandTotal,
    required this.totalItems,
    this.currency,
  });

  factory PlaceOrderData.fromJson(Map<String, dynamic> json) {
    return PlaceOrderData(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      status: json['status'] ?? 'new',
      grandTotal: (json['grandTotal'] ?? 0).toDouble(),
      totalItems: json['totalItems'] ?? 0,
      currency: json['currency'] != null ? CurrencyData.fromJson(json['currency']) : null,
    );
  }
}

/// Currency data
class CurrencyData {
  final String code;
  final String symbol;

  CurrencyData({
    required this.code,
    required this.symbol,
  });

  factory CurrencyData.fromJson(Map<String, dynamic> json) {
    return CurrencyData(
      code: json['code'] ?? 'GHS',
      symbol: json['symbol'] ?? '₵',
    );
  }
}

/// Payment data from Paystack
class PaymentData {
  final String transactionId;
  final String authorizationUrl;
  final String accessCode;
  final String reference;

  PaymentData({
    required this.transactionId,
    required this.authorizationUrl,
    required this.accessCode,
    required this.reference,
  });

  factory PaymentData.fromJson(Map<String, dynamic> json) {
    return PaymentData(
      transactionId: json['transactionId'] ?? '',
      authorizationUrl: json['authorizationUrl'] ?? '',
      accessCode: json['accessCode'] ?? '',
      reference: json['reference'] ?? '',
    );
  }
}

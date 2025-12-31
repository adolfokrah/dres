/// Response from verify payment endpoint
class VerifyPaymentResponse {
  final bool success;
  final String status; // 'completed', 'cancelled', 'pending', 'error', 'failed', 'abandoned'
  final String message;
  final VerifiedOrderData? order;
  final String? error;

  VerifyPaymentResponse({
    required this.success,
    required this.status,
    required this.message,
    this.order,
    this.error,
  });

  factory VerifyPaymentResponse.fromJson(Map<String, dynamic> json) {
    return VerifyPaymentResponse(
      success: json['success'] ?? false,
      status: json['status'] ?? 'error',
      message: json['message'] ?? '',
      order: json['order'] != null ? VerifiedOrderData.fromJson(json['order']) : null,
      error: json['error'],
    );
  }

  /// Check if payment was successful
  bool get isPaymentSuccessful => success && status == 'completed';

  /// Check if payment failed
  bool get isPaymentFailed => !success && (status == 'failed' || status == 'cancelled' || status == 'abandoned');

  /// Check if payment is still pending
  bool get isPaymentPending => status == 'pending';
}

/// Order data from verify payment response
class VerifiedOrderData {
  final String id;
  final String orderId;
  final String status;

  VerifiedOrderData({
    required this.id,
    required this.orderId,
    required this.status,
  });

  factory VerifiedOrderData.fromJson(Map<String, dynamic> json) {
    return VerifiedOrderData(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      status: json['status'] ?? 'new',
    );
  }
}

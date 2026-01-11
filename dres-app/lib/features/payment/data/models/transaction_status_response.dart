/// Response from transaction status check endpoint
class TransactionStatusResponse {
  final bool success;
  final String status; // 'completed', 'cancelled', 'pending', 'error', 'failed', 'abandoned'
  final String message;
  final String? transactionId;
  final String? error;

  TransactionStatusResponse({
    required this.success,
    required this.status,
    required this.message,
    this.transactionId,
    this.error,
  });

  factory TransactionStatusResponse.fromJson(Map<String, dynamic> json) {
    return TransactionStatusResponse(
      success: json['success'] ?? false,
      status: json['status'] ?? 'error',
      message: json['message'] ?? '',
      transactionId: json['transactionId'],
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

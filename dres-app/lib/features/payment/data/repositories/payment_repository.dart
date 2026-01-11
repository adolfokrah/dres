import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/payment/data/models/transaction_status_response.dart';

export 'package:dres/features/payment/data/models/transaction_status_response.dart';

class PaymentRepository {
  final ApiService _apiService;

  PaymentRepository({required ApiService apiService}) : _apiService = apiService;

  /// Check transaction status from database (for polling)
  /// Does NOT call Paystack API - just checks our DB status
  Future<TransactionStatusResponse> checkTransactionStatus({
    required String reference,
  }) async {
    final response = await _apiService.get(
      '/transactions/check-status',
      queryParameters: {'reference': reference},
    );
    return TransactionStatusResponse.fromJson(response.data);
  }
}

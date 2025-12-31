import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/orders/data/models/verify_payment_response.dart';

export 'package:dres/features/orders/data/models/verify_payment_response.dart';

class OrdersRepository {
  final ApiService _apiService;

  OrdersRepository({required ApiService apiService}) : _apiService = apiService;

  /// Check transaction status from database (for polling)
  /// Does NOT call Paystack API - just checks our DB status
  Future<VerifyPaymentResponse> checkTransactionStatus({
    required String reference,
  }) async {
    final response = await _apiService.get(
      '/transactions/check-status',
      queryParameters: {'reference': reference},
    );
    return VerifyPaymentResponse.fromJson(response.data);
  }
}

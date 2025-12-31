import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/orders/data/models/order_model.dart';
import 'package:dres/features/orders/data/models/verify_payment_response.dart';

export 'package:dres/features/orders/data/models/order_model.dart';
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

  /// Fetch user's orders
  Future<List<OrderModel>> getOrders({int page = 1, int limit = 10}) async {
    final response = await _apiService.get(
      '/orders',
      queryParameters: {
        'page': page,
        'limit': limit,
        'sort': '-createdAt',
        'depth': 2,
      },
    );
    final docs = response.data['docs'] as List<dynamic>? ?? [];
    return docs.map((json) => OrderModel.fromJson(json)).toList();
  }

  /// Fetch a single order by ID
  Future<OrderModel> getOrderById(String id) async {
    final response = await _apiService.get('/orders/$id?depth=3');
    return OrderModel.fromJson(response.data);
  }
}

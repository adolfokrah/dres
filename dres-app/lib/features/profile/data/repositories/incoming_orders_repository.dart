import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/models/incoming_order_model.dart';

export 'package:dres/features/profile/data/models/incoming_order_model.dart';

class IncomingOrdersRepository {
  final ApiService _apiService;

  IncomingOrdersRepository({required ApiService apiService}) : _apiService = apiService;

  /// Fetch user's incoming orders (orders where user is the seller)
  Future<IncomingOrdersResponse> getIncomingOrders({
    required String userId,
    int page = 1,
    int limit = 10,
    String? statusFilter,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    if (statusFilter != null && statusFilter.isNotEmpty) {
      queryParams['status'] = statusFilter;
    }

    final response = await _apiService.get(
      '/users/$userId/incoming-orders',
      queryParameters: queryParams,
    );
    
    debugPrint('🔵 IncomingOrdersRepository: Raw response data: ${response.data}');
    
    final result = IncomingOrdersResponse.fromJson(response.data);
    
    debugPrint('🟢 IncomingOrdersRepository: Parsed ${result.docs.length} incoming orders');
    for (final order in result.docs) {
      debugPrint('  - Order ${order.orderId}: ${order.items.length} items, address: ${order.shippingAddress?.cityRegion}');
      for (final item in order.items) {
        debugPrint('    - Item: imageUrl=${item.imageUrl}, variation=${item.variationTitle}');
      }
    }
    
    return result;
  }
}

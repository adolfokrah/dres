import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/orders/data/models/incoming_order_model.dart';
import 'package:dres/features/orders/data/models/incoming_order_details_model.dart';

export 'package:dres/features/orders/data/models/incoming_order_model.dart';
export 'package:dres/features/orders/data/models/incoming_order_details_model.dart';

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
      '/orders/incoming/$userId',
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

  /// Fetch incoming order details (seller's view of a specific order)
  Future<IncomingOrderDetailsModel> getIncomingOrderDetails({
    required String userId,
    required String orderId,
  }) async {
    final response = await _apiService.get(
      '/orders/$orderId/incoming-details/$userId',
    );
    
    debugPrint('🔵 IncomingOrdersRepository: Raw order details: ${response.data}');
    
    final result = IncomingOrderDetailsModel.fromJson(response.data);
    
    debugPrint('🟢 IncomingOrdersRepository: Parsed order ${result.orderId} with ${result.items.length} items');
    
    return result;
  }

  /// Mark item as not available
  Future<void> markItemNotAvailable({
    required String userId,
    required String orderId,
    required String itemId,
  }) async {
    await _apiService.post(
      '/orders/$orderId/update-item-status/$userId',
      data: {
        'action': 'not_available',
        'itemId': itemId,
      },
    );
    debugPrint('🟢 IncomingOrdersRepository: Marked item $itemId as not available');
  }

  /// Mark item as out for delivery
  Future<void> markItemOutForDelivery({
    required String userId,
    required String orderId,
    required String itemId,
  }) async {
    await _apiService.post(
      '/orders/$orderId/update-item-status/$userId',
      data: {
        'action': 'out_for_delivery',
        'itemId': itemId,
      },
    );
    debugPrint('🟢 IncomingOrdersRepository: Marked item $itemId as out for delivery');
  }

  /// Accept return for an item
  Future<void> acceptReturn({
    required String userId,
    required String orderId,
    required String itemId,
  }) async {
    await _apiService.post(
      '/orders/$orderId/update-item-status/$userId',
      data: {
        'action': 'accept_return',
        'itemId': itemId,
      },
    );
    debugPrint('🟢 IncomingOrdersRepository: Accepted return for item $itemId');
  }

  /// Mark all seller's items as out for delivery
  Future<void> markAllOutForDelivery({
    required String userId,
    required String orderId,
  }) async {
    await _apiService.post(
      '/orders/$orderId/mark-all-out-for-delivery/$userId',
    );
    debugPrint('🟢 IncomingOrdersRepository: Marked all items as out for delivery');
  }
}

import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/orders/data/models/purchase_model.dart';

export 'package:dres/features/orders/data/models/purchase_model.dart';

class PurchasesRepository {
  final ApiService _apiService;

  PurchasesRepository({required ApiService apiService}) : _apiService = apiService;

  /// Fetch user's purchases
  Future<PurchasesResponse> getPurchases({
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
      '/orders/purchases',
      queryParameters: queryParams,
    );
    
    debugPrint('🔵 PurchasesRepository: Raw response data: ${response.data}');
    
    final result = PurchasesResponse.fromJson(response.data);
    
    debugPrint('🟢 PurchasesRepository: Parsed ${result.docs.length} purchases');
    for (final purchase in result.docs) {
      for (final item in purchase.items) {
        debugPrint('    - Item: imageUrl=${item.imageUrl}, variation=${item.variationTitle}');
      }
    }
    
    return result;
  }
}

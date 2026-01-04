import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/models/seller_product_model.dart';

export 'package:dres/features/profile/data/models/seller_product_model.dart';

class SellerProductsRepository {
  final ApiService _apiService;

  SellerProductsRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Get a seller's published products (variations)
  Future<GetSellerProductsResponse> getSellerProducts({
    required String sellerId,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiService.get(
      '/variations/seller/$sellerId',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
    return GetSellerProductsResponse.fromJson(response.data);
  }
}

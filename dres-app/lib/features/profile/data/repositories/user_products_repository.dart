import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/models/product_style_model.dart';

export 'package:dres/features/profile/data/models/product_style_model.dart';

class UserProductsRepository {
  final ApiService _apiService;

  UserProductsRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Get user's published products (styles)
  Future<GetMyProductsResponse> getMyProducts({int page = 1, int limit = 20}) async {
    final response = await _apiService.get(
      '/styles/my-products',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
    return GetMyProductsResponse.fromJson(response.data);
  }

  /// Archive a product (style)
  Future<void> archiveProduct(String styleId) async {
    await _apiService.patch(
      '/styles/$styleId',
      data: {'status': 'archived'},
    );
  }
}

import 'package:dres/core/constants/api_endpoints.dart' as api;
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/product_details/data/models/product_details_model.dart';

class ProductDetailsRepository {
  final ApiService _apiService;

  ProductDetailsRepository(this._apiService);

  Future<ProductDetailsModel> fetchProductDetails(String variationSlug) async {
    try {
      final response = await _apiService.get('${api.variationBySlug}$variationSlug/details');
      return ProductDetailsModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e, stackTrace) {
      print('❌ Failed to fetch/parse product details: $e');
      print('Stack trace: $stackTrace');
      throw Exception('Failed to fetch product details: $e');
    }
  }

  /// Record a view for the variation
  /// If user is logged in, they will be added to the users array
  Future<void> recordView(String variationId) async {
    try {
      await _apiService.post(
        api.recordVariationView,
        data: {'variationId': variationId},
      );
    } catch (e) {
      // Silent fail - don't break the user experience for analytics
      print('Failed to record view: $e');
    }
  }
}

import 'package:dres/core/constants/api_endpoints.dart' as api;
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/product_details/data/models/product_details_model.dart';

class ProductDetailsRepository {
  final ApiService _apiService;

  ProductDetailsRepository(this._apiService);

  Future<ProductDetailsModel> fetchProductDetails(String variationId) async {
    try {
      final response = await _apiService.get('${api.variationById}$variationId');
      return ProductDetailsModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      throw Exception('Failed to fetch product details: $e');
    }
  }
}

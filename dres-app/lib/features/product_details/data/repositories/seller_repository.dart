import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/product_details/data/models/seller_model.dart';

class SellerRepository {
  final ApiService _apiService;

  SellerRepository(this._apiService);

  Future<SellerModel> getSellerInfo({
    required String sellerId,
  }) async {
    try {
      final response = await _apiService.get(
        '/users/$sellerId/seller',
      );

      return SellerModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      throw Exception('Failed to load seller info: $e');
    }
  }
}

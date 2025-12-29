import 'package:dres/core/services/api_service.dart';
import 'package:dres/core/widgets/product_archive_block.dart';

class SimilarVariationsRepository {
  final ApiService _apiService;

  SimilarVariationsRepository(this._apiService);

  Future<List<ProductCardData>> getSimilarVariations({
    required String variationId,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.get(
        '/variations/$variationId/similar?limit=$limit',
      );

      final data = response.data as Map<String, dynamic>;
      final variations = data['variations'] as List<dynamic>?;

      if (variations == null) {
        return [];
      }

      return variations
          .map((v) => ProductCardData.fromJson(v as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to load similar variations: $e');
    }
  }
}

import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/product_details/data/models/reviews_model.dart';

class ReviewsRepository {
  final ApiService _apiService;

  ReviewsRepository(this._apiService);

  Future<ReviewsModel> getStyleReviews({
    required String styleId,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        '/styles/$styleId/reviews?page=$page&limit=$limit',
      );

      return ReviewsModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      throw Exception('Failed to load reviews: $e');
    }
  }
}

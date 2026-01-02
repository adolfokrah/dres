import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/models/seller_review_model.dart';

export 'package:dres/features/profile/data/models/seller_review_model.dart';

class SellerReviewsRepository {
  final ApiService _apiService;

  SellerReviewsRepository({required ApiService apiService}) : _apiService = apiService;

  /// Fetch seller's reviews
  /// [sellerId] - The seller's user ID
  Future<SellerReviewsResponse> getSellerReviews({
    required String sellerId,
    int page = 1,
    int limit = 10,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    final response = await _apiService.get(
      '/reviews/seller/$sellerId',
      queryParameters: queryParams,
    );
    
    debugPrint('⭐ SellerReviewsRepository: Raw response data: ${response.data}');
    
    final result = SellerReviewsResponse.fromJson(response.data);
    
    debugPrint('⭐ SellerReviewsRepository: Parsed ${result.reviews.length} reviews');
    
    return result;
  }
}

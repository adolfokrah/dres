import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/product_details/data/models/reviews_model.dart';
import 'package:path/path.dart' as path;

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

  /// Upload an image and return the media ID
  Future<String> uploadImage(File image) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        image.path,
        filename: path.basename(image.path),
      ),
    });

    final response = await _apiService.dio.post(
      '/media',
      data: formData,
      options: Options(
        headers: {'Accept': 'application/json'},
        receiveTimeout: const Duration(minutes: 2),
        sendTimeout: const Duration(minutes: 2),
      ),
    );

    final doc = response.data['doc'];
    return doc['id'] as String;
  }

  /// Fetch basic style info for the review screen
  Future<Map<String, dynamic>> getStyleInfo(String styleId) async {
    // Use custom endpoint that returns exactly what we need
    final response = await _apiService.get('/style-info/$styleId');
    final data = response.data as Map<String, dynamic>;

    // Extract seller info
    final seller = data['seller'] as Map<String, dynamic>?;

    return {
      'id': data['id'] as String? ?? styleId,
      'title': data['title'] as String?,
      'brandName': data['brandName'] as String?,
      'thumbnailUrl': data['thumbnailUrl'] as String?,
      'seller': seller != null ? {
        'id': seller['id'] as String?,
        'shopName': seller['shopName'] as String?,
        'photoUrl': seller['photoUrl'] as String?,
      } : null,
    };
  }

  /// Create a new review for a style
  Future<Map<String, dynamic>> createReview({
    required String styleId,
    required int rating,
    required String review,
    List<File>? images,
  }) async {
    // Upload images first if provided
    List<String> imageIds = [];
    if (images != null && images.isNotEmpty) {
      for (final image in images) {
        final imageId = await uploadImage(image);
        imageIds.add(imageId);
      }
    }

    final response = await _apiService.post(
      '/reviews/create',
      data: {
        'style': styleId,
        'rating': rating,
        'review': review,
        if (imageIds.isNotEmpty) 'images': imageIds,
      },
    );

    return response.data as Map<String, dynamic>;
  }
}

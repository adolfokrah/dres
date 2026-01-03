import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/favorites/data/models/favorite_item_model.dart';

export 'package:dres/features/favorites/data/models/favorite_item_model.dart';

class FavoritesRepository {
  final ApiService _apiService;

  FavoritesRepository({required ApiService apiService}) : _apiService = apiService;

  /// Fetch user's favorite items
  Future<FavoritesResponse> getMyFavorites({
    int page = 1,
    int limit = 10,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
    };

    final response = await _apiService.get(
      '/favorites/my-favorites',
      queryParameters: queryParams,
    );
    
    
    final result = FavoritesResponse.fromJson(response.data);
    
    
    return result;
  }

  /// Add item to favorites
  /// Returns the favorite ID if successful
  Future<String?> addToFavorites(String variationId) async {
    final response = await _apiService.post(
      '/favorites/add',
      data: {
        'variationId': variationId,
      },
    );
    return response.data['favoriteId'] as String?;
  }

  /// Remove item from favorites by variation ID
  Future<void> removeFromFavorites(String variationId) async {
    await _apiService.delete('/favorites/remove/$variationId');
  }

  /// Check if a variation is favorited
  Future<bool> checkIsFavorited(String variationId) async {
    try {
      final response = await _apiService.get(
        '/favorites/check/$variationId',
      );
      return response.data['isFavorited'] as bool? ?? false;
    } catch (e) {
      return false;
    }
  }
}

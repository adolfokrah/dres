import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/saved_searches/data/models/saved_search_models.dart';

export 'package:dres/features/saved_searches/data/models/saved_search_models.dart';

class SavedSearchRepository {
  final ApiService _apiService;

  SavedSearchRepository({required ApiService apiService}) : _apiService = apiService;

  /// Save a search with filters
  Future<SaveSearchResponse> saveSearch(SaveSearchRequest request) async {
    final response = await _apiService.post(
      '/saved-searches/save',
      data: request.toJson(),
    );
    return SaveSearchResponse.fromJson(response.data);
  }

  /// Get user's saved searches
  Future<GetSavedSearchesResponse> getMySavedSearches() async {
    final response = await _apiService.get('/saved-searches/my-searches');
    return GetSavedSearchesResponse.fromJson(response.data);
  }

  /// Delete a saved search
  Future<Map<String, dynamic>> deleteSavedSearch(String searchId) async {
    final response = await _apiService.delete('/saved-searches/$searchId/delete');
    return response.data;
  }

  /// Toggle active status for a saved search
  Future<Map<String, dynamic>> toggleActive(String searchId, bool isActive) async {
    final response = await _apiService.patch(
      '/saved-searches/$searchId',
      data: {'isActive': isActive},
    );
    return response.data;
  }
}
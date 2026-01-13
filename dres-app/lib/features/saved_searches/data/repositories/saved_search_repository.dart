import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/saved_searches/data/models/saved_search_models.dart';

export 'package:dres/features/saved_searches/data/models/saved_search_models.dart';

class SavedSearchRepository {
  final ApiService _apiService;

  SavedSearchRepository({required ApiService apiService}) : _apiService = apiService;

  /// Save a search with filters
  Future<SaveSearchResponse> saveSearch(SaveSearchRequest request) async {
    final response = await _apiService.post(
      '/api/saved-searches/save',
      data: request.toJson(),
    );
    return SaveSearchResponse.fromJson(response.data);
  }

  /// Get user's saved searches
  Future<GetSavedSearchesResponse> getMySavedSearches() async {
    final response = await _apiService.get('/api/saved-searches/my-searches');
    return GetSavedSearchesResponse.fromJson(response.data);
  }

  /// Delete a saved search
  Future<Map<String, dynamic>> deleteSavedSearch(String searchId) async {
    final response = await _apiService.delete('/api/saved-searches/$searchId/delete');
    return response.data;
  }

  /// Toggle notifications for a saved search
  Future<Map<String, dynamic>> toggleNotifications(String searchId, bool enabled) async {
    final response = await _apiService.patch(
      '/saved-searches/$searchId',
      data: {'notificationsEnabled': enabled},
    );
    return response.data;
  }
}
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/search/data/models/search_models.dart';

class SearchRepository {
  final ApiService _apiService;

  SearchRepository(this._apiService);

  /// Search for brands, categories, collections, styles, variations, and sellers
  Future<SearchResponse> search(String query) async {
    final response = await _apiService.get(
      '/search-items',
      queryParameters: {'q': query},
    );
    return SearchResponse.fromJson(response.data);
  }
}

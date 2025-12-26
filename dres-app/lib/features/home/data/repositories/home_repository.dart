import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/home/data/models/page_model.dart';

class HomeRepository {
  final ApiService _apiService;

  HomeRepository(this._apiService);

  /// Fetch home page data by slug
  /// [locale] - Language code (en, fr, de, es, it)
  Future<PageModel> fetchHomePage({String locale = 'en'}) async {
    try {
      final response = await _apiService.get(
        '/pages',
        queryParameters: {
          'where[slug][equals]': 'home',
          'depth': 2,
          'locale': locale,
        },
      );

      final docs = response.data['docs'] as List<dynamic>;
      if (docs.isEmpty) {
        throw Exception('Home page not found');
      }

      return PageModel.fromJson(docs.first as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch page by ID
  Future<PageModel> fetchPageById(String id, {String locale = 'en'}) async {
    try {
      final response = await _apiService.get(
        '/pages/$id',
        queryParameters: {
          'depth': 2,
          'locale': locale,
        },
      );

      return PageModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch page by slug
  Future<PageModel> fetchPageBySlug(String slug, {String locale = 'en'}) async {
    try {
      final response = await _apiService.get(
        '/pages',
        queryParameters: {
          'where[slug][equals]': slug,
          'depth': 2,
          'locale': locale,
        },
      );

      final docs = response.data['docs'] as List<dynamic>;
      if (docs.isEmpty) {
        throw Exception('Page not found: $slug');
      }

      return PageModel.fromJson(docs.first as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }
}

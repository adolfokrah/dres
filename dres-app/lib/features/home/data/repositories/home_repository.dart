import 'package:flutter/foundation.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/home/data/models/page_model.dart';

class HomeRepository {
  final ApiService _apiService;

  HomeRepository(this._apiService);

  /// Fetch home page data by slug
  /// [slug] - Page slug (home, home-women, etc.)
  /// [locale] - Language code (en, fr, de, es, it)
  Future<PageModel> fetchHomePage({String slug = 'home', String locale = 'en'}) async {
    debugPrint('🏠 HomeRepository: Fetching page with slug=$slug, locale=$locale');
    try {
      final response = await _apiService.get(
        '/pages',
        queryParameters: {
          'where[slug][equals]': slug,
          'depth': 2,
          'locale': locale,
        },
      );

      debugPrint('🏠 HomeRepository: Response status=${response.statusCode}');
      final docs = response.data['docs'] as List<dynamic>;
      debugPrint('🏠 HomeRepository: Found ${docs.length} docs');

      if (docs.isEmpty) {
        throw Exception('Home page not found for slug: $slug');
      }

      debugPrint('🏠 HomeRepository: Parsing page JSON...');
      final page = PageModel.fromJson(docs.first as Map<String, dynamic>);
      debugPrint('🏠 HomeRepository: Successfully parsed page: ${page.title}');
      return page;
    } catch (e, stackTrace) {
      debugPrint('🏠 HomeRepository: Error: $e');
      debugPrint('🏠 HomeRepository: Stack: $stackTrace');
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

import 'package:dio/dio.dart';
import 'package:dres/core/models/brand_model.dart';

class BrandsRepository {
  final Dio _dio;

  BrandsRepository(this._dio);

  Future<List<BrandModel>> fetchBrands({
    String? departmentId,
    int limit = 1000, // Get all brands
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };

      if (departmentId != null) {
        queryParams['department'] = departmentId;
      }

      final response = await _dio.get(
        '/brands',
        queryParameters: queryParams,
      );

      final brands = (response.data['docs'] as List)
          .map((b) => BrandModel.fromJson(b))
          .toList();

      // Sort alphabetically
      brands.sort((a, b) => a.name.compareTo(b.name));

      return brands;
    } catch (e) {
      throw Exception('Failed to fetch brands: $e');
    }
  }
}

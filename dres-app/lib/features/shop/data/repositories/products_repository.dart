import 'package:dio/dio.dart';
import 'package:dres/core/models/variation_model.dart';
import 'package:dres/core/constants/api_endpoints.dart' as api;

class ProductsRepository {
  final Dio _dio;

  ProductsRepository(this._dio);

  Future<Map<String, dynamic>> fetchProducts({
    String? departmentId,
    String? categoryId,
    String? collectionId,
    String? brandId,
    String? filterType,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      // Always use the filtered endpoint which supports all filter types
      final endpoint = api.filteredVariations;

      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (departmentId != null) queryParams['department'] = departmentId;
      if (categoryId != null) queryParams['category'] = categoryId;
      if (collectionId != null) queryParams['collection'] = collectionId;
      if (brandId != null) queryParams['brand'] = brandId;
      if (filterType != null) queryParams['filterType'] = filterType;

      final response = await _dio.get(
        endpoint,
        queryParameters: queryParams,
      );

      final variations = (response.data['variations'] as List)
          .map((v) => VariationModel.fromJson(v))
          .toList();

      return {
        'variations': variations,
        'totalDocs': response.data['totalDocs'] as int,
        'totalPages': response.data['totalPages'] as int,
        'page': response.data['page'] as int,
        'hasNextPage': response.data['hasNextPage'] as bool,
        'hasPrevPage': response.data['hasPrevPage'] as bool,
      };
    } catch (e) {
      throw Exception('Failed to fetch products: $e');
    }
  }
}

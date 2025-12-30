import 'package:dio/dio.dart';
import 'package:dres/core/models/variation_model.dart';
import 'package:dres/core/constants/api_endpoints.dart' as api;
import 'package:dres/core/utilities/currency_utils.dart';

class ProductsRepository {
  final Dio _dio;

  ProductsRepository(this._dio);

  Future<Map<String, dynamic>> fetchProducts({
    String? departmentId,
    String? categoryId,
    String? collectionId,
    String? brandId,
    String? filterType,
    String? sortBy,
    String? sortPrice,
    Map<String, List<String>>? selectedAttributes,
    double? minPrice,
    double? maxPrice,
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
      if (sortBy != null) queryParams['sortBy'] = sortBy;
      if (sortPrice != null) queryParams['sortPrice'] = sortPrice;
      if (minPrice != null) queryParams['minPrice'] = minPrice;
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice;
      
      // Add attribute filters
      // Format: attributes=attributeId:optionId1,optionId2
      if (selectedAttributes != null && selectedAttributes.isNotEmpty) {
        final attributeParams = selectedAttributes.entries
            .where((entry) => entry.value.isNotEmpty)
            .map((entry) => '${entry.key}:${entry.value.join(',')}')
            .toList();
        
        if (attributeParams.isNotEmpty) {
          queryParams['attributes'] = attributeParams.join('|');
        }
      }

      final response = await _dio.get(
        endpoint,
        queryParameters: queryParams,
      );

      // Update currency from API response
      if (response.data['currency'] != null) {
        CurrencyUtils.updateFromResponse(
          Map<String, dynamic>.from(response.data['currency']),
        );
      }

      final variations = (response.data['variations'] as List)
          .map((v) => VariationModel.fromJson(v))
          .toList();

      final filters = response.data['filters'] as List? ?? [];

      return {
        'variations': variations,
        'totalDocs': response.data['totalDocs'] as int,
        'totalPages': response.data['totalPages'] as int,
        'page': response.data['page'] as int,
        'hasNextPage': response.data['hasNextPage'] as bool,
        'hasPrevPage': response.data['hasPrevPage'] as bool,
        'filters': filters,
      };
    } catch (e) {
      throw Exception('Failed to fetch products: $e');
    }
  }
}

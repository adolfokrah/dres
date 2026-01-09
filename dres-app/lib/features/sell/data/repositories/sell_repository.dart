import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/sell/data/models/attribute_model.dart';
import 'package:dres/features/sell/data/models/draft_styles_response.dart';
import 'package:dres/features/sell/data/models/style_models.dart';
import 'package:dres/features/sell/data/models/variation_model.dart';

export 'package:dres/features/sell/data/models/attribute_model.dart';
export 'package:dres/features/sell/data/models/draft_style_model.dart';
export 'package:dres/features/sell/data/models/draft_styles_response.dart';
export 'package:dres/features/sell/data/models/style_models.dart';
export 'package:dres/features/sell/data/models/variation_model.dart';

class SellRepository {
  final ApiService _apiService;

  SellRepository({required ApiService apiService}) : _apiService = apiService;

  /// Get user's draft/incomplete styles
  Future<GetDraftStylesResponse> getMyDraftStyles() async {
    try {
      final response = await _apiService.get('/styles/my-drafts');
      return GetDraftStylesResponse.fromJson(response.data);
    } catch (e) {
      return GetDraftStylesResponse(drafts: [], totalDrafts: 0);
    }
  }

  /// Create an empty style (draft)
  Future<CreateStyleResponse> createStyle() async {
    final response = await _apiService.post('/styles');
    return CreateStyleResponse.fromJson(response.data);
  }

  /// Get style details by ID (with variations and SKUs included)
  Future<StyleDetailsModel> getStyleDetails(String styleId) async {
    try {
      final response = await _apiService.get('/styles/$styleId/details');
      return StyleDetailsModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Update style details (Step 1 - Product Details)
  Future<UpdateStyleResponse> updateStyleDetails({
    required String styleId,
    required UpdateStyleDetailsRequest request,
  }) async {
    final response = await _apiService.patch(
      '/styles/$styleId',
      data: request.toJson(),
    );
    return UpdateStyleResponse.fromJson(response.data);
  }

  /// Publish a style (make it visible to buyers)
  Future<void> publishStyle(String styleId) async {
    await _apiService.patch(
      '/styles/$styleId',
      data: {'status': 'published'},
    );
  }

  /// Unpublish a style (hide from buyers)
  Future<void> unpublishStyle(String styleId) async {
    await _apiService.patch(
      '/styles/$styleId',
      data: {'status': 'draft'},
    );
  }

  /// Archive a style (hide from seller's view)
  Future<void> archiveStyle(String styleId) async {
    await _apiService.patch(
      '/styles/$styleId',
      data: {'status': 'archived'},
    );
  }

  // ==================== VARIATIONS ====================

  /// Get variations for a style (excludes archived)
  Future<GetVariationsResponse> getStyleVariations(String styleId) async {
    try {
      final response = await _apiService.get(
        '/variations',
        queryParameters: {
          'where[style][equals]': styleId,
          'where[status][not_equals]': 'archived',
          'depth': '3',
        },
      );
      return GetVariationsResponse.fromJson(response.data);
    } catch (e) {
      return GetVariationsResponse(variations: [], totalVariations: 0);
    }
  }

  /// Create a new variation for a style
  Future<CreateVariationResponse> createVariation(
    CreateVariationRequest request,
  ) async {
    final response = await _apiService.post(
      '/variations',
      data: request.toJson(),
    );
    return CreateVariationResponse.fromJson(response.data);
  }

  /// Delete a variation
  Future<void> deleteVariation(String variationId) async {
    await _apiService.delete('/variations/$variationId');
  }

  /// Get variation details by ID for editing
  /// Uses standard Payload REST API which returns full data with IDs
  Future<VariationModel> getVariationDetails(String variationId) async {
    
    final response = await _apiService.get(
      '/variations/$variationId',
      queryParameters: {'depth': '2'},
    );
    
    return VariationModel.fromJson(response.data);
  }

  /// Upload an image to media collection and return the media ID
  Future<String> uploadImage(File image) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        image.path,
        filename: 'variation_${DateTime.now().millisecondsSinceEpoch}.jpg',
      ),
    });

    final response = await _apiService.post('/media', data: formData);
    final mediaId = response.data['doc']['id'] as String;
    return mediaId;
  }

  /// Update a variation with variants and images
  Future<void> updateVariation({
    required String variationId,
    required List<Map<String, String>> variants,
    List<String> imageIds = const [],
  }) async {

    final data = <String, dynamic>{'variants': variants};

    if (imageIds.isNotEmpty) {
      data['images'] = imageIds;
    }

    await _apiService.patch('/variations/$variationId', data: data);
  }

  // ==================== SKUs ====================

  /// Get SKUs for a variation (excludes archived)
  Future<List<SkuModel>> getVariationSkus(String variationId) async {
    try {
      final response = await _apiService.get(
        '/skus',
        queryParameters: {
          'where[variation][equals]': variationId,
          'where[status][not_equals]': 'archived',
          'depth': '1',
        },
      );
      final docs = response.data['docs'] ?? [];
      return (docs as List)
          .map((s) => SkuModel.fromJson(s as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Create a new SKU
  Future<void> createSku({
    required String variationId,
    required String attributeId,
    required String attributeOptionId,
    required double price,
    required int stock,
  }) async {
    await _apiService.post(
      '/skus',
      data: {
        'variation': variationId,
        'skuOptions': [
          {'option': attributeId, 'value': attributeOptionId},
        ],
        'price': price,
        'stock': stock,
      },
    );
  }

  /// Delete a SKU
  Future<void> deleteSku(String skuId) async {
    await _apiService.delete('/skus/$skuId');
  }

  /// Update an existing SKU
  Future<void> updateSku({
    required String skuId,
    required String attributeId,
    required String attributeOptionId,
    required double price,
    double? compareAtPrice,
    int? stock,
  }) async {
    final data = <String, dynamic>{
      'skuOptions': [
        {'option': attributeId, 'value': attributeOptionId},
      ],
      'price': price,
      // Always send stock - null means "don't track stock"
      'stock': stock,
    };
    if (compareAtPrice != null) {
      data['compareAtPrice'] = compareAtPrice;
    }
    await _apiService.patch('/skus/$skuId', data: data);
  }

  // ==================== ATTRIBUTES ====================

  /// Get attributes for a category (with their options filtered by category)
  /// Returns variation-level and SKU-level attributes available for the category
  Future<GetCategoryAttributesResponse> getCategoryAttributes(
    String categoryId,
  ) async {
    final response = await _apiService.get(
      '/categories/$categoryId/attributes',
    );

    final attributesData = response.data['attributes'] as List? ?? [];

    final attributes = attributesData
        .map((attr) => AttributeModel.fromJson(attr as Map<String, dynamic>))
        .toList();

    return GetCategoryAttributesResponse(attributes: attributes);
  }

  // ==================== ARCHIVE ====================

  /// Archive a variation (soft delete)
  Future<void> archiveVariation(String variationId) async {
    await _apiService.patch(
      '/variations/$variationId',
      data: {'status': 'archived'},
    );
  }

  /// Archive a SKU (soft delete)
  Future<void> archiveSku(String skuId) async {
    await _apiService.patch(
      '/skus/$skuId',
      data: {'status': 'archived'},
    );
  }

  // ==================== IMAGES ====================

  /// Remove an image from a variation by updating the images array
  Future<void> removeVariationImage({
    required String variationId,
    required List<String> imageIds,
  }) async {
    await _apiService.patch(
      '/variations/$variationId',
      data: {'images': imageIds},
    );
  }
}

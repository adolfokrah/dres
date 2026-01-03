import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
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

  /// Get style details by ID
  Future<StyleDetailsModel> getStyleDetails(String styleId) async {
    try {
      final response = await _apiService.get(
        '/styles/$styleId',
        queryParameters: {'depth': '2'},
      );
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

  // ==================== VARIATIONS ====================

  /// Get variations for a style
  Future<GetVariationsResponse> getStyleVariations(String styleId) async {
    try {
      final response = await _apiService.get(
        '/variations',
        queryParameters: {'where[style][equals]': styleId, 'depth': '3'},
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
    debugPrint('📥 [VariationDetail] Fetching: $variationId');
    
    final response = await _apiService.get(
      '/variations/$variationId',
      queryParameters: {'depth': '2'},
    );
    
    debugPrint('📦 [VariationDetail] images count: ${(response.data['images'] as List?)?.length ?? 0}');
    debugPrint('📦 [VariationDetail] variants count: ${(response.data['variants'] as List?)?.length ?? 0}');
    
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

    final response =
        await _apiService.patch('/variations/$variationId', data: data);
  }

  // ==================== SKUs ====================

  /// Get SKUs for a variation
  Future<List<SkuModel>> getVariationSkus(String variationId) async {
    try {
      final response = await _apiService.get(
        '/skus',
        queryParameters: {
          'where[variation][equals]': variationId,
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
    };
    if (compareAtPrice != null) {
      data['compareAtPrice'] = compareAtPrice;
    }
    if (stock != null) {
      data['stock'] = stock;
    }
    await _apiService.patch('/skus/$skuId', data: data);
  }

  // ==================== ATTRIBUTES ====================

  /// Get attributes for a category (with their options)
  /// Returns variation-level and SKU-level attributes available for the category
  Future<GetCategoryAttributesResponse> getCategoryAttributes(
    String categoryId,
  ) async {
    try {
      // First, get the category to get attribute IDs
      final categoryResponse = await _apiService.get(
        '/categories/$categoryId',
        queryParameters: {'depth': '1'},
      );

      // Extract attribute IDs from the category
      final categoryData = categoryResponse.data;
      final attributesData = categoryData['attributes'];

      if (attributesData == null ||
          attributesData is! List ||
          attributesData.isEmpty) {
        return const GetCategoryAttributesResponse(attributes: []);
      }

      // Get attribute IDs (could be strings or objects with id)
      final attributeIds = <String>[];
      for (var attr in attributesData) {
        if (attr is String) {
          attributeIds.add(attr);
        } else if (attr is Map && attr['id'] != null) {
          attributeIds.add(attr['id']);
        }
      }

      if (attributeIds.isEmpty) {
        return const GetCategoryAttributesResponse(attributes: []);
      }

      // Now fetch each attribute with its options (join field)
      final attributes = <AttributeModel>[];

      for (var attrId in attributeIds) {
        try {
          final attrResponse = await _apiService.get(
            '/attributes/$attrId',
            queryParameters: {'depth': '2'},
          );
          attributes.add(AttributeModel.fromJson(attrResponse.data));
        } catch (e) {
          // Skip failed attributes
        }
      }

      return GetCategoryAttributesResponse(attributes: attributes);
    } catch (e) {
      return const GetCategoryAttributesResponse(attributes: []);
    }
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

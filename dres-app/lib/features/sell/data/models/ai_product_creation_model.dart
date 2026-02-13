class AIProductCreationResponse {
  final bool success;
  final String styleId;
  final List<String> variationIds;
  final List<String> skuIds;
  final AIProductMetadata? metadata;

  AIProductCreationResponse({
    required this.success,
    required this.styleId,
    required this.variationIds,
    required this.skuIds,
    this.metadata,
  });

  factory AIProductCreationResponse.fromJson(Map<String, dynamic> json) {
    return AIProductCreationResponse(
      success: json['success'] as bool? ?? false,
      styleId: json['styleId'] as String? ?? '',
      variationIds: (json['variationIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      skuIds: (json['skuIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      metadata: json['metadata'] != null
          ? AIProductMetadata.fromJson(json['metadata'] as Map<String, dynamic>)
          : null,
    );
  }
}

class AIProductMetadata {
  final String title;
  final String category;
  final String? brand;
  final int variations;
  final int skusPerVariation;
  final int totalSkus;

  AIProductMetadata({
    required this.title,
    required this.category,
    this.brand,
    required this.variations,
    required this.skusPerVariation,
    required this.totalSkus,
  });

  factory AIProductMetadata.fromJson(Map<String, dynamic> json) {
    return AIProductMetadata(
      title: json['title'] as String? ?? '',
      category: json['category'] as String? ?? '',
      brand: json['brand'] as String?,
      variations: json['variations'] as int? ?? 0,
      skusPerVariation: json['skusPerVariation'] as int? ?? 0,
      totalSkus: json['totalSkus'] as int? ?? 0,
    );
  }
}

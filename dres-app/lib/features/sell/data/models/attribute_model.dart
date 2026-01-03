/// Model for an attribute option from the backend
class AttributeOptionModel {
  final String id;
  final String name;
  final String slug;

  const AttributeOptionModel({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory AttributeOptionModel.fromJson(Map<String, dynamic> json) {
    return AttributeOptionModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
    );
  }
}

/// Model for an attribute type from the backend
class AttributeModel {
  final String id;
  final String name;
  final String level; // 'variation' or 'sku'
  final List<AttributeOptionModel> options;

  const AttributeModel({
    required this.id,
    required this.name,
    required this.level,
    required this.options,
  });

  factory AttributeModel.fromJson(Map<String, dynamic> json) {

    // Parse options from join field
    List<AttributeOptionModel> options = [];
    final optionsData = json['options'];

    if (optionsData != null) {

      if (optionsData is Map && optionsData['docs'] != null) {
        // Join format: { docs: [...], hasNextPage: bool, ... }
        for (var opt in optionsData['docs']) {
          if (opt is Map<String, dynamic>) {
            options.add(AttributeOptionModel.fromJson(opt));
          }
        }
      } else if (optionsData is List) {
        // Direct array format
        for (var opt in optionsData) {
          if (opt is Map<String, dynamic>) {
            options.add(AttributeOptionModel.fromJson(opt));
          }
        }
      }
    }


    return AttributeModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      level: json['level'] ?? 'variation',
      options: options,
    );
  }

  /// Check if this is a variation-level attribute
  bool get isVariationLevel => level == 'variation';

  /// Check if this is a SKU-level attribute
  bool get isSkuLevel => level == 'sku';
}

/// Response for fetching category attributes
class GetCategoryAttributesResponse {
  final List<AttributeModel> attributes;

  const GetCategoryAttributesResponse({required this.attributes});

  factory GetCategoryAttributesResponse.fromJson(Map<String, dynamic> json) {
    List<AttributeModel> attributes = [];

    // Debug: print the entire response structure

    // Parse attributes array - could be direct array or nested in 'docs'
    var attributesData = json['attributes'];

    if (attributesData != null) {
      // Handle if it's a join result with 'docs' array
      if (attributesData is Map && attributesData['docs'] != null) {
        attributesData = attributesData['docs'];
      }

      if (attributesData is List) {
        for (var attr in attributesData) {
          if (attr is Map<String, dynamic>) {
            attributes.add(AttributeModel.fromJson(attr));
          } else if (attr is String) {
            // It's just an ID reference, not populated
          }
        }
      }
    }


    return GetCategoryAttributesResponse(attributes: attributes);
  }

  /// Get only variation-level attributes
  List<AttributeModel> get variationAttributes =>
      attributes.where((a) => a.isVariationLevel).toList();

  /// Get only SKU-level attributes
  List<AttributeModel> get skuAttributes =>
      attributes.where((a) => a.isSkuLevel).toList();
}

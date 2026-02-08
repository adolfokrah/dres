import 'package:dres/core/utilities/media_utils.dart';

/// Model for a variation image with ID and URL
class VariationImage {
  final String id;
  final String url;

  VariationImage({required this.id, required this.url});
}

/// Model for a style variation
class VariationModel {
  final String id;
  final String styleId;
  final String title; // Auto-generated title from backend
  final String? colorName;
  final String? materialName;
  final String status; // 'draft', 'active', 'archived'
  final List<VariationImage> imageObjects; // Store both ID and URL
  final List<SkuModel> skus;
  final List<VariantAttribute>
  variants; // Variant attributes (e.g., Color: Red)
  final VariationStyleRef? style; // Reference to style with category
  final DateTime? createdAt;
  final DateTime? updatedAt;
  // Image validation fields
  final String? imageValidationStatus; // 'pending', 'approved', 'rejected'
  final int? imageValidationScore; // 0-100
  final String? imageValidationNotes; // Notes/issues from AI validation

  VariationModel({
    required this.id,
    required this.styleId,
    required this.title,
    this.colorName,
    this.materialName,
    this.status = 'draft',
    this.imageObjects = const [],
    this.skus = const [],
    this.variants = const [],
    this.style,
    this.createdAt,
    this.updatedAt,
    this.imageValidationStatus,
    this.imageValidationScore,
    this.imageValidationNotes,
  });

  /// Check if variation is a draft
  bool get isDraft => status == 'draft';

  /// Check if variation is active
  bool get isActive => status == 'active';

  /// Check if images are rejected
  bool get isImageRejected => imageValidationStatus == 'rejected';

  /// Check if images need attention (rejected)
  bool get hasImageIssues => isImageRejected;

  /// Get image URLs (for backwards compatibility) - only returns images with valid URLs
  List<String> get images => imageObjects
      .where((img) => img.url.isNotEmpty)
      .map((img) => img.url)
      .toList();

  /// Get image IDs
  List<String> get imageIds => imageObjects.map((img) => img.id).toList();

  factory VariationModel.fromJson(Map<String, dynamic> json) {
    // Debug: log the style data

    // Handle style reference
    String styleId = '';
    VariationStyleRef? styleRef;
    if (json['style'] != null) {
      if (json['style'] is String) {
        styleId = json['style'];
      } else if (json['style'] is Map) {
        styleId = json['style']['id'] ?? '';
        styleRef = VariationStyleRef.fromJson(
          json['style'] as Map<String, dynamic>,
        );
          
      }
    } else {
    }

    // Parse images with IDs
    List<VariationImage> imageObjects = [];
    if (json['images'] != null && json['images'] is List) {
      for (var img in json['images']) {
        if (img is String) {
          // Just an ID, no URL available
          imageObjects.add(VariationImage(id: img, url: ''));
        } else if (img is Map) {
          // Image could be nested under 'image' key or directly at root
          final imageData = img['image'] is Map ? img['image'] as Map : img;
          final id = imageData['id']?.toString() ?? '';
          // Try multiple URL fields that Payload might return
          final rawUrl = imageData['url'] ?? 
                         imageData['thumbnailURL'] ?? 
                         (imageData['sizes']?['thumbnail']?['url']) ??
                         (imageData['sizes']?['small']?['url']) ??
                         '';
          // Resolve relative URL to full URL
          final url = MediaUtils.resolveUrl(rawUrl?.toString()) ?? '';
          if (id.isNotEmpty) {
            imageObjects.add(VariationImage(id: id, url: url));
          }
        }
      }
    }

    // Parse SKUs
    List<SkuModel> skus = [];
    final skusDocs = json['skus']?['docs'] ?? json['skus'] ?? [];
    if (skusDocs is List) {
      for (var sku in skusDocs) {
        if (sku is Map<String, dynamic>) {
          skus.add(SkuModel.fromJson(sku));
        }
      }
    }

    // Parse variants (attributes)
    List<VariantAttribute> variants = [];
    if (json['variants'] != null && json['variants'] is List) {
      for (var v in json['variants']) {
        if (v is Map<String, dynamic>) {
          variants.add(VariantAttribute.fromJson(v));
        }
      }
    }

    return VariationModel(
      id: json['id'] ?? '',
      styleId: styleId,
      title: json['title'] ?? 'Untitled Variation',
      colorName: json['colorName'],
      materialName: json['materialName'],
      status: json['status'] ?? 'draft',
      imageObjects: imageObjects,
      skus: skus,
      variants: variants,
      style: styleRef,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
      imageValidationStatus: json['imageValidationStatus'],
      imageValidationScore: json['imageValidationScore'],
      imageValidationNotes: json['imageValidationNotes'],
    );
  }

  /// Display name for the variation (uses title from backend)
  String get displayName => title;

  /// Check if variation has images
  bool get hasImages => images.isNotEmpty;

  /// Check if variation has SKUs
  bool get hasSkus => skus.isNotEmpty;

  /// Get the first image URL for thumbnail
  String? get thumbnail => images.isNotEmpty ? images.first : null;

  /// Get variant attributes as readable string (e.g., "Color: Red, Material: Leather")
  String get variantsDisplay {
    if (variants.isEmpty) return '';
    return variants.map((v) => '${v.attributeName}: ${v.valueName}').join(', ');
  }
}

/// Model for a variant attribute (e.g., Color: Red)
class VariantAttribute {
  final String attributeId;
  final String attributeName;
  final String valueId;
  final String valueName;

  VariantAttribute({
    required this.attributeId,
    required this.attributeName,
    required this.valueId,
    required this.valueName,
  });

  factory VariantAttribute.fromJson(Map<String, dynamic> json) {
    // Handle variant reference
    String attributeId = '';
    String attributeName = '';
    if (json['variant'] != null) {
      if (json['variant'] is String) {
        attributeId = json['variant'];
      } else if (json['variant'] is Map) {
        attributeId = json['variant']['id'] ?? '';
        attributeName = json['variant']['name'] ?? '';
      }
    }

    // Handle value reference
    String valueId = '';
    String valueName = '';
    if (json['value'] != null) {
      if (json['value'] is String) {
        valueId = json['value'];
      } else if (json['value'] is Map) {
        valueId = json['value']['id'] ?? '';
        valueName = json['value']['name'] ?? json['value']['value'] ?? '';
      }
    }

    return VariantAttribute(
      attributeId: attributeId,
      attributeName: attributeName,
      valueId: valueId,
      valueName: valueName,
    );
  }
}

/// Model for SKU Option (attribute and its value)
class SkuOptionModel {
  final String attributeId;
  final String attributeName;
  final String optionId;
  final String optionName;

  SkuOptionModel({
    required this.attributeId,
    required this.attributeName,
    required this.optionId,
    required this.optionName,
  });

  factory SkuOptionModel.fromJson(Map<String, dynamic> json) {
    // Handle option (attribute) reference
    String attributeId = '';
    String attributeName = '';
    if (json['option'] != null) {
      if (json['option'] is String) {
        attributeId = json['option'];
      } else if (json['option'] is Map) {
        attributeId = json['option']['id'] ?? '';
        attributeName = json['option']['name'] ?? '';
      }
    }

    // Handle value (attributeOption) reference
    String optionId = '';
    String optionName = '';
    if (json['value'] != null) {
      if (json['value'] is String) {
        optionId = json['value'];
      } else if (json['value'] is Map) {
        optionId = json['value']['id'] ?? '';
        optionName = json['value']['name'] ?? '';
      }
    }

    return SkuOptionModel(
      attributeId: attributeId,
      attributeName: attributeName,
      optionId: optionId,
      optionName: optionName,
    );
  }
}

/// Model for a SKU (Stock Keeping Unit)
class SkuModel {
  final String id;
  final String variationId;
  final List<SkuOptionModel> skuOptions;
  final double price;
  final double? compareAtPrice;
  final int? stock; // null = unlimited stock, 0 = out of stock, >0 = has stock
  final String? sku;
  final String status; // 'active' or 'archived'
  final bool isActive;
  final bool flashSaleEnabled;
  final DateTime? flashSaleEndDate;

  SkuModel({
    required this.id,
    required this.variationId,
    this.skuOptions = const [],
    required this.price,
    this.compareAtPrice,
    this.stock,
    this.sku,
    this.status = 'active',
    this.isActive = true,
    this.flashSaleEnabled = false,
    this.flashSaleEndDate,
  });

  /// Check if SKU is active (not archived and isActive is true)
  bool get isAvailable => status != 'archived' && isActive;

  /// Get size from the first SKU option (legacy helper)
  String? get size {
    if (skuOptions.isNotEmpty) {
      return skuOptions.first.optionName;
    }
    return null;
  }

  /// Get the first SKU option's attribute ID
  String? get attributeId {
    if (skuOptions.isNotEmpty) {
      return skuOptions.first.attributeId;
    }
    return null;
  }

  /// Get the first SKU option's attribute name
  String? get attributeName {
    if (skuOptions.isNotEmpty) {
      return skuOptions.first.attributeName;
    }
    return null;
  }

  /// Get the first SKU option's option ID
  String? get attributeOptionId {
    if (skuOptions.isNotEmpty) {
      return skuOptions.first.optionId;
    }
    return null;
  }

  factory SkuModel.fromJson(Map<String, dynamic> json) {
    // Handle variation reference
    String variationId = '';
    if (json['variation'] != null) {
      if (json['variation'] is String) {
        variationId = json['variation'];
      } else if (json['variation'] is Map) {
        variationId = json['variation']['id'] ?? '';
      }
    }

    // Parse skuOptions array
    List<SkuOptionModel> skuOptions = [];
    if (json['skuOptions'] != null && json['skuOptions'] is List) {
      skuOptions = (json['skuOptions'] as List)
          .map((opt) => SkuOptionModel.fromJson(opt as Map<String, dynamic>))
          .toList();
    }

    return SkuModel(
      id: json['id'] ?? '',
      variationId: variationId,
      skuOptions: skuOptions,
      price: (json['price'] ?? 0).toDouble(),
      compareAtPrice: json['compareAtPrice'] != null
          ? (json['compareAtPrice']).toDouble()
          : null,
      stock: json['stock'], // null = unlimited stock, 0 = out of stock
      sku: json['sku'],
      status: json['status'] ?? 'active',
      isActive: json['isActive'] ?? true,
      flashSaleEnabled: json['flashSaleEnabled'] ?? false,
      flashSaleEndDate: json['flashSaleEndDate'] != null
          ? DateTime.tryParse(json['flashSaleEndDate'])
          : null,
    );
  }
}

/// Response for fetching variations
class GetVariationsResponse {
  final List<VariationModel> variations;
  final int totalVariations;

  GetVariationsResponse({
    required this.variations,
    required this.totalVariations,
  });

  factory GetVariationsResponse.fromJson(Map<String, dynamic> json) {
    final docs = json['docs'] ?? json['variations'] ?? [];
    return GetVariationsResponse(
      variations: (docs as List)
          .map((v) => VariationModel.fromJson(v as Map<String, dynamic>))
          .toList(),
      totalVariations:
          json['totalDocs'] ?? json['totalVariations'] ?? docs.length,
    );
  }
}

/// Request to create a new variation
class CreateVariationRequest {
  final String styleId;
  final List<Map<String, String>>?
  variants; // e.g., [{variant: 'colorId', value: 'redId'}]

  CreateVariationRequest({required this.styleId, this.variants});

  Map<String, dynamic> toJson() {
    return {
      'style': styleId,
      if (variants != null && variants!.isNotEmpty) 'variants': variants,
    };
  }
}

/// Response from creating a variation
class CreateVariationResponse {
  final String id;
  final String message;

  CreateVariationResponse({required this.id, required this.message});

  factory CreateVariationResponse.fromJson(Map<String, dynamic> json) {
    final doc = json['doc'] as Map<String, dynamic>?;
    return CreateVariationResponse(
      id: doc?['id'] ?? json['id'] ?? '',
      message: json['message'] ?? 'Variation created successfully',
    );
  }
}

/// Reference to parent style (with category info)
class VariationStyleRef {
  final String id;
  final String? category;

  VariationStyleRef({required this.id, this.category});

  factory VariationStyleRef.fromJson(Map<String, dynamic> json) {

    // Handle category reference
    String? categoryId;
    if (json['category'] != null) {
      if (json['category'] is String) {
        categoryId = json['category'];
      } else if (json['category'] is Map) {
        categoryId = json['category']['id'];
      }
    } else {
    }

    return VariationStyleRef(id: json['id'] ?? '', category: categoryId);
  }
}

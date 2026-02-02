import 'package:dres/features/sell/data/models/variation_model.dart';

/// Response from create style endpoint
class CreateStyleResponse {
  final String id;
  final String status;
  final String message;

  CreateStyleResponse({
    required this.id,
    required this.status,
    required this.message,
  });

  factory CreateStyleResponse.fromJson(Map<String, dynamic> json) {
    // Payload returns { doc: { id: ..., ... }, message: ... }
    // or directly { id: ..., ... }
    final doc = json['doc'] as Map<String, dynamic>?;
    final actualData = doc ?? json;

    return CreateStyleResponse(
      id: actualData['id']?.toString() ?? '',
      status: json['status'] ?? 'success',
      message: json['message'] ?? 'Style created successfully',
    );
  }
}

/// Response from update style endpoint
class UpdateStyleResponse {
  final bool success;
  final String message;

  UpdateStyleResponse({required this.success, required this.message});

  factory UpdateStyleResponse.fromJson(Map<String, dynamic> json) {
    return UpdateStyleResponse(
      success: json['success'] ?? true,
      message: json['message'] ?? 'Style updated successfully',
    );
  }
}

/// Request body for updating style details (Step 1)
class UpdateStyleDetailsRequest {
  final String title;
  final String? description;
  final String? departmentId;
  final String? collectionId;
  final String categoryId;
  final String brandId;
  final String? authenticity;

  UpdateStyleDetailsRequest({
    required this.title,
    this.description,
    this.departmentId,
    this.collectionId,
    required this.categoryId,
    required this.brandId,
    this.authenticity,
  });

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      if (description != null && description!.isNotEmpty)
        'description': description,
      if (departmentId != null) 'department': departmentId,
      if (collectionId != null) 'collection': collectionId,
      'category': categoryId,
      'brand': brandId,
      if (authenticity != null) 'authenticity': authenticity,
    };
  }
}

/// Model for style details data (loaded from API)
/// Model for active boost details
class BoostDetailsModel {
  final String id;
  final String? startDate;
  final String? endDate;
  final String? tierId;
  final String? tierName;
  final int? tierDuration;
  final bool hasAnalytics;
  final bool showWeLoveBadge;

  BoostDetailsModel({
    required this.id,
    this.startDate,
    this.endDate,
    this.tierId,
    this.tierName,
    this.tierDuration,
    this.hasAnalytics = false,
    this.showWeLoveBadge = false,
  });

  factory BoostDetailsModel.fromJson(Map<String, dynamic> json) {
    final tier = json['tier'] as Map<String, dynamic>?;
    return BoostDetailsModel(
      id: json['id'] ?? '',
      startDate: json['startDate'],
      endDate: json['endDate'],
      tierId: tier?['id'],
      tierName: tier?['name'],
      tierDuration: tier?['duration'],
      hasAnalytics: tier?['hasAnalytics'] ?? false,
      showWeLoveBadge: tier?['showWeLoveBadge'] ?? false,
    );
  }

  /// Calculate days remaining for the boost
  int get daysRemaining {
    if (endDate == null) return 0;
    final end = DateTime.parse(endDate!);
    final now = DateTime.now();
    final diff = end.difference(now).inDays;
    return diff > 0 ? diff : 0;
  }

  /// Check if boost is expiring soon (within 2 days)
  bool get isExpiringSoon => daysRemaining <= 2;
}

class StyleDetailsModel {
  final String id;
  final String? title;
  final String? description;
  final String status; // 'draft' or 'published'
  final String? authenticity;
  final String? departmentId;
  final String? departmentName;
  final String? collectionId;
  final String? collectionName;
  final String? categoryId;
  final String? categoryName;
  final String? brandId;
  final String? brandName;
  final String? sellerId;
  final String? sellerFirstName;
  final String? sellerLastName;
  final String? sellerBusinessName;
  final bool isBoosted;
  final BoostDetailsModel? boostDetails;
  final List<StyleVariationModel> variations;
  final int totalVariations;

  StyleDetailsModel({
    required this.id,
    this.title,
    this.description,
    this.status = 'draft',
    this.authenticity,
    this.departmentId,
    this.departmentName,
    this.collectionId,
    this.collectionName,
    this.categoryId,
    this.categoryName,
    this.brandId,
    this.brandName,
    this.sellerId,
    this.sellerFirstName,
    this.sellerLastName,
    this.sellerBusinessName,
    this.isBoosted = false,
    this.boostDetails,
    this.variations = const [],
    this.totalVariations = 0,
  });

  bool get isPublished => status == 'published';
  bool get isDraft => status == 'draft';

  factory StyleDetailsModel.fromJson(Map<String, dynamic> json) {
    // The new endpoint returns { style: {...}, variations: [...], totalVariations: n }
    final styleData = json['style'] as Map<String, dynamic>? ?? json;

    // Helper to extract ID from relationship (can be string ID or object with id)
    String? extractId(dynamic value) {
      if (value == null) return null;
      if (value is String) return value;
      if (value is Map) return value['id']?.toString();
      return null;
    }

    // Helper to extract name from relationship object
    String? extractName(dynamic value, {String fieldName = 'name'}) {
      if (value == null) return null;
      if (value is Map) return value[fieldName]?.toString();
      return null;
    }

    // Parse variations list
    final variationsList = json['variations'] as List<dynamic>? ?? [];
    final variations = variationsList
        .map((v) => StyleVariationModel.fromJson(v as Map<String, dynamic>))
        .toList();

    return StyleDetailsModel(
      id: styleData['id'] ?? '',
      title: styleData['title'],
      description: styleData['description'],
      status: styleData['status'] ?? 'draft',
      authenticity: styleData['authenticity']?.toString(),
      departmentId: extractId(styleData['department']),
      departmentName: extractName(styleData['department']),
      collectionId: extractId(styleData['collection']),
      collectionName: extractName(styleData['collection']),
      categoryId: extractId(styleData['category']),
      categoryName: extractName(styleData['category']),
      brandId: extractId(styleData['brand']),
      brandName: extractName(styleData['brand']),
      sellerId: extractId(styleData['seller']),
      sellerFirstName: extractName(styleData['seller'], fieldName: 'firstName'),
      sellerLastName: extractName(styleData['seller'], fieldName: 'lastName'),
      sellerBusinessName: extractName(styleData['seller'], fieldName: 'businessName'),
      isBoosted: styleData['isBoosted'] ?? false,
      boostDetails: styleData['boostDetails'] != null
          ? BoostDetailsModel.fromJson(styleData['boostDetails'])
          : null,
      variations: variations,
      totalVariations: json['totalVariations'] ?? variations.length,
    );
  }
}

/// Model for a variation within style details
class StyleVariationModel {
  final String id;
  final String? title;
  final String? slug;
  final String? status;
  final List<StyleVariationImage> images;
  final List<StyleVariationAttribute> attributes;
  final List<StyleVariationSku> skus;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  StyleVariationModel({
    required this.id,
    this.title,
    this.slug,
    this.status,
    this.images = const [],
    this.attributes = const [],
    this.skus = const [],
    this.createdAt,
    this.updatedAt,
  });

  bool get hasImages => images.isNotEmpty;
  bool get hasSkus => skus.isNotEmpty;
  String? get thumbnail => images.isNotEmpty ? images.first.url : null;

  /// Convert to VariationModel for compatibility with variations list
  VariationModel toVariationModel({String styleId = ''}) {
    return VariationModel(
      id: id,
      styleId: styleId,
      title: title ?? '',
      imageObjects: images.map((img) => VariationImage(id: img.id, url: img.url)).toList(),
      variants: attributes.map((attr) => VariantAttribute(
        attributeId: '', // Not available in this model
        attributeName: attr.name,
        valueId: '', // Not available in this model
        valueName: attr.value,
      )).toList(),
      skus: skus.map((sku) => SkuModel(
        id: sku.id,
        variationId: id,
        price: sku.sellingPrice,
        compareAtPrice: sku.compareAtPrice,
        stock: sku.stock,
        skuOptions: sku.options.map((opt) => SkuOptionModel(
          attributeId: '',
          attributeName: opt.option,
          optionId: '',
          optionName: opt.value,
        )).toList(),
      )).toList(),
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  factory StyleVariationModel.fromJson(Map<String, dynamic> json) {
    final imagesList = json['images'] as List<dynamic>? ?? [];
    final attributesList = json['attributes'] as List<dynamic>? ?? [];
    final skusList = json['skus'] as List<dynamic>? ?? [];

    return StyleVariationModel(
      id: json['id'] ?? '',
      title: json['title'],
      slug: json['slug'],
      status: json['status'],
      images: imagesList
          .map((i) => StyleVariationImage.fromJson(i as Map<String, dynamic>))
          .toList(),
      attributes: attributesList
          .map((a) => StyleVariationAttribute.fromJson(a as Map<String, dynamic>))
          .toList(),
      skus: skusList
          .map((s) => StyleVariationSku.fromJson(s as Map<String, dynamic>))
          .toList(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
    );
  }
}

/// Image model for style variation
class StyleVariationImage {
  final String id;
  final String url;
  final String? alt;
  final String? filename;
  final int? width;
  final int? height;

  StyleVariationImage({
    required this.id,
    required this.url,
    this.alt,
    this.filename,
    this.width,
    this.height,
  });

  factory StyleVariationImage.fromJson(Map<String, dynamic> json) {
    return StyleVariationImage(
      id: json['id'] ?? '',
      url: json['url'] ?? '',
      alt: json['alt'],
      filename: json['filename'],
      width: json['width'],
      height: json['height'],
    );
  }
}

/// Attribute model for style variation (e.g., Color: Red)
class StyleVariationAttribute {
  final String name;
  final String value;

  StyleVariationAttribute({required this.name, required this.value});

  factory StyleVariationAttribute.fromJson(Map<String, dynamic> json) {
    return StyleVariationAttribute(
      name: json['name'] ?? '',
      value: json['value'] ?? '',
    );
  }
}

/// SKU model for style variation
class StyleVariationSku {
  final String id;
  final List<StyleSkuOption> options;
  final double sellingPrice;
  final double? compareAtPrice;
  final int? stock; // null = unlimited, 0 = out of stock, >0 = has stock

  StyleVariationSku({
    required this.id,
    this.options = const [],
    required this.sellingPrice,
    this.compareAtPrice,
    this.stock,
  });

  factory StyleVariationSku.fromJson(Map<String, dynamic> json) {
    final optionsList = json['options'] as List<dynamic>? ?? [];

    return StyleVariationSku(
      id: json['id'] ?? '',
      options: optionsList
          .map((o) => StyleSkuOption.fromJson(o as Map<String, dynamic>))
          .toList(),
      sellingPrice: (json['sellingPrice'] ?? json['price'] ?? 0).toDouble(),
      compareAtPrice: json['compareAtPrice']?.toDouble(),
      stock: json['stock'], // null = unlimited
    );
  }
}

/// SKU option model (e.g., Size: M)
class StyleSkuOption {
  final String option;
  final String value;

  StyleSkuOption({required this.option, required this.value});

  factory StyleSkuOption.fromJson(Map<String, dynamic> json) {
    return StyleSkuOption(
      option: json['option'] ?? '',
      value: json['value'] ?? '',
    );
  }
}

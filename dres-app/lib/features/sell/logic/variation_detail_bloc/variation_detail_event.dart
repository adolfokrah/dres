import 'dart:io';

import 'package:equatable/equatable.dart';

abstract class VariationDetailEvent extends Equatable {
  const VariationDetailEvent();

  @override
  List<Object?> get props => [];
}

/// Load variation details
class VariationDetailLoadRequested extends VariationDetailEvent {
  final String variationId;
  final String? categoryId; // To fetch category-specific attributes

  const VariationDetailLoadRequested({
    required this.variationId,
    this.categoryId,
  });

  @override
  List<Object?> get props => [variationId, categoryId];
}

/// Variant option for update (attribute ID and value ID)
class VariantOption {
  final String attributeId;
  final String valueId;

  const VariantOption({required this.attributeId, required this.valueId});
}

/// Update variation with variants and images
class VariationUpdateRequested extends VariationDetailEvent {
  final String variationId;
  final List<VariantOption> variants;
  final List<String> existingImageIds;
  final List<File> newImages;

  const VariationUpdateRequested({
    required this.variationId,
    required this.variants,
    this.existingImageIds = const [],
    this.newImages = const [],
  });

  @override
  List<Object?> get props => [
    variationId,
    variants,
    existingImageIds,
    newImages,
  ];
}

/// Create a new SKU for this variation
class SkuCreateRequested extends VariationDetailEvent {
  final String variationId;
  final String attributeId;
  final String attributeOptionId;
  final double price;
  final int stock;

  const SkuCreateRequested({
    required this.variationId,
    required this.attributeId,
    required this.attributeOptionId,
    required this.price,
    required this.stock,
  });

  @override
  List<Object?> get props => [
    variationId,
    attributeId,
    attributeOptionId,
    price,
    stock,
  ];
}

/// Delete a SKU
class SkuDeleteRequested extends VariationDetailEvent {
  final String skuId;

  const SkuDeleteRequested({required this.skuId});

  @override
  List<Object?> get props => [skuId];
}

/// Update an existing SKU
class SkuUpdateRequested extends VariationDetailEvent {
  final String skuId;
  final String attributeId; // Attribute ID (e.g., Size attribute)
  final String attributeOptionId; // AttributeOption ID (e.g., "M" option)
  final double price;
  final double? compareAtPrice;
  final int? stock;

  const SkuUpdateRequested({
    required this.skuId,
    required this.attributeId,
    required this.attributeOptionId,
    required this.price,
    this.compareAtPrice,
    this.stock,
  });

  @override
  List<Object?> get props => [
    skuId,
    attributeId,
    attributeOptionId,
    price,
    compareAtPrice,
    stock,
  ];
}

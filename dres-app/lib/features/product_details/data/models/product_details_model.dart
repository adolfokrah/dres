import 'seller_model.dart';
import 'reviews_model.dart';

class ProductDetailsModel {
  final VariationDetailsModel variation;
  final List<RelatedVariationModel> relatedVariations;
  final SellerModel? seller;
  final ReviewsModel? styleReviews;

  ProductDetailsModel({
    required this.variation,
    required this.relatedVariations,
    this.seller,
    this.styleReviews,
  });

  factory ProductDetailsModel.fromJson(Map<String, dynamic> json) {
    return ProductDetailsModel(
      variation: VariationDetailsModel.fromJson(json['variation'] ?? {}),
      relatedVariations: (json['relatedVariations'] as List<dynamic>?)
              ?.map((v) => RelatedVariationModel.fromJson(v))
              .toList() ??
          [],
      seller: json['seller'] != null ? SellerModel.fromJson(json['seller']) : null,
      styleReviews: json['styleReviews'] != null 
          ? ReviewsModel.fromJson(json['styleReviews']) 
          : null,
    );
  }
}

class VariationDetailsModel {
  final String id;
  final String thumbnail;
  final String title;
  final String slug;
  final List<SkuModel> skus;
  final String category;
  final String brand;
  final double price;
  final double? compareAtPrice;
  final String? currency;
  final String variants;
  final bool isBoosted;
  final String defaultSku;
  final List<ImageModel> images;
  final String? styleDescription;
  final List<DetailModel> details;
  final VariationsTitleModel? variationsTitle;
  final String? styleId;
  final String? sellerId;

  VariationDetailsModel({
    required this.id,
    required this.thumbnail,
    required this.title,
    required this.slug,
    required this.skus,
    required this.category,
    required this.brand,
    required this.price,
    this.compareAtPrice,
    this.currency,
    required this.variants,
    required this.isBoosted,
    required this.defaultSku,
    required this.images,
    this.styleDescription,
    required this.details,
    this.variationsTitle,
    this.styleId,
    this.sellerId,
  });

  factory VariationDetailsModel.fromJson(Map<String, dynamic> json) {
    return VariationDetailsModel(
      id: json['id'] ?? '',
      thumbnail: json['thumbnail'] ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      skus: (json['skus'] as List<dynamic>?)
              ?.map((s) => SkuModel.fromJson(s))
              .toList() ??
          [],
      category: json['category'] ?? '',
      brand: json['brand'] ?? '',
      price: (json['sellingPrice'] ?? json['price'] ?? 0).toDouble(),
      compareAtPrice: json['compareAtPrice']?.toDouble(),
      currency: json['currency'],
      variants: json['variants'] ?? '',
      isBoosted: json['isBoosted'] ?? false,
      defaultSku: json['defaultSku'] ?? '',
      images: (json['images'] as List<dynamic>?)
              ?.map((i) => ImageModel.fromJson(i))
              .toList() ??
          [],
      styleDescription: json['styleDescription'] is String ? json['styleDescription'] : null,
      details: (json['details'] as List<dynamic>?)
              ?.map((d) => DetailModel.fromJson(d))
              .toList() ??
          [],
      variationsTitle: json['variationsTitle'] != null
          ? VariationsTitleModel.fromJson(json['variationsTitle'])
          : null,
      styleId: json['styleId'],
      sellerId: json['sellerId'],
    );
  }
}

class SkuModel {
  final String id;
  final List<SkuOptionModel> options;
  final double price;
  final double? compareAtPrice;
  final int? stock;
  final String? currency;

  SkuModel({
    required this.id,
    required this.options,
    required this.price,
    this.compareAtPrice,
    this.stock,
    this.currency,
  });

  factory SkuModel.fromJson(Map<String, dynamic> json) {
    return SkuModel(
      id: json['id'] ?? '',
      options: (json['options'] as List<dynamic>?)
              ?.map((o) => SkuOptionModel.fromJson(o))
              .toList() ??
          [],
      price: (json['sellingPrice'] ?? json['price'] ?? 0).toDouble(),
      compareAtPrice: json['compareAtPrice']?.toDouble(),
      stock: json['stock'],
      currency: json['currency'],
    );
  }
}

class SkuOptionModel {
  final String option;
  final String value;

  SkuOptionModel({
    required this.option,
    required this.value,
  });

  factory SkuOptionModel.fromJson(Map<String, dynamic> json) {
    return SkuOptionModel(
      option: json['option'] ?? '',
      value: json['value'] ?? '',
    );
  }
}

class ImageModel {
  final String id;
  final String url;
  final String alt;
  final String filename;
  final String mimeType;
  final int width;
  final int height;

  ImageModel({
    required this.id,
    required this.url,
    required this.alt,
    required this.filename,
    required this.mimeType,
    required this.width,
    required this.height,
  });

  factory ImageModel.fromJson(Map<String, dynamic> json) {
    return ImageModel(
      id: json['id'] ?? '',
      url: json['url'] ?? '',
      alt: json['alt'] ?? '',
      filename: json['filename'] ?? '',
      mimeType: json['mimeType'] ?? '',
      width: json['width'] ?? 0,
      height: json['height'] ?? 0,
    );
  }
}

class DetailModel {
  final String name;
  final String value;

  DetailModel({
    required this.name,
    required this.value,
  });

  factory DetailModel.fromJson(Map<String, dynamic> json) {
    return DetailModel(
      name: json['name'] ?? '',
      value: json['value'] ?? '',
    );
  }
}

class VariationsTitleModel {
  final String attribute;
  final List<String> values;

  VariationsTitleModel({
    required this.attribute,
    required this.values,
  });

  factory VariationsTitleModel.fromJson(Map<String, dynamic> json) {
    return VariationsTitleModel(
      attribute: json['attribute'] ?? '',
      values: (json['values'] as List<dynamic>?)
              ?.map((v) => v.toString())
              .toList() ??
          [],
    );
  }
}

class RelatedVariationModel {
  final String id;
  final String thumbnail;
  final String title;
  final String slug;
  final List<SkuModel> skus;
  final String category;
  final String brand;
  final double price;
  final double? compareAtPrice;
  final String? currency;
  final String variants;
  final bool isBoosted;
  final String defaultSku;
  final List<RelatedDetailModel> details;

  RelatedVariationModel({
    required this.id,
    required this.thumbnail,
    required this.title,
    required this.slug,
    required this.skus,
    required this.category,
    required this.brand,
    required this.price,
    this.compareAtPrice,
    this.currency,
    required this.variants,
    required this.isBoosted,
    required this.defaultSku,
    required this.details,
  });

  factory RelatedVariationModel.fromJson(Map<String, dynamic> json) {
    return RelatedVariationModel(
      id: json['id'] ?? '',
      thumbnail: json['thumbnail'] ?? '',
      title: json['title'] ?? '',
      slug: json['slug'] ?? '',
      skus: (json['skus'] as List<dynamic>?)
              ?.map((s) => SkuModel.fromJson(s))
              .toList() ??
          [],
      category: json['category'] ?? '',
      brand: json['brand'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      compareAtPrice: json['compareAtPrice']?.toDouble(),
      currency: json['currency'],
      variants: json['variants'] ?? '',
      isBoosted: json['isBoosted'] ?? false,
      defaultSku: json['defaultSku'] ?? '',
      details: (json['details'] as List<dynamic>?)
              ?.map((d) => RelatedDetailModel.fromJson(d))
              .toList() ??
          [],
    );
  }
}

class RelatedDetailModel {
  final String attribute;
  final String value;

  RelatedDetailModel({
    required this.attribute,
    required this.value,
  });

  factory RelatedDetailModel.fromJson(Map<String, dynamic> json) {
    return RelatedDetailModel(
      attribute: json['attribute'] ?? '',
      value: json['value'] ?? '',
    );
  }
}

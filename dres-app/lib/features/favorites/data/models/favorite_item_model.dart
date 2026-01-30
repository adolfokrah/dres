import 'package:dres/core/models/variation_model.dart';

/// Favorite item model extending VariationModel
class FavoriteItemModel extends VariationModel {
  final String favoriteId;
  final DateTime favoritedAt;
  final String? defaultSku;
  final String currencyCode;
  final String currencySymbol;

  FavoriteItemModel({
    required this.favoriteId,
    required this.favoritedAt,
    this.defaultSku,
    required this.currencyCode,
    required this.currencySymbol,
    required super.id,
    required super.title,
    required super.price,
    super.compareAtPrice,
    super.thumbnail,
    required super.inStock,
    required super.quantity,
    super.brand,
    super.category,
    required super.slug,
    super.isBoosted = false,
    super.showWeLoveBadge = false,
    super.sellerId,
    super.totalStock,
  });

  factory FavoriteItemModel.fromJson(Map<String, dynamic> json) {
    return FavoriteItemModel(
      favoriteId: json['favoriteId'] as String? ?? '',
      favoritedAt: json['favoritedAt'] != null
          ? DateTime.parse(json['favoritedAt'])
          : DateTime.now(),
      defaultSku: json['defaultSku'] as String?,
      currencyCode: json['currencyCode'] as String? ?? 'USD',
      currencySymbol: json['currencySymbol'] as String? ?? '\$',
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      price: (json['sellingPrice'] as num?)?.toDouble() ?? (json['price'] as num?)?.toDouble() ?? 0.0,
      compareAtPrice: (json['compareAtPrice'] as num?)?.toDouble(),
      thumbnail: json['thumbnail'] as String?,
      inStock: json['inStock'] as bool? ?? true,
      quantity: json['quantity'] as int? ?? 0,
      brand: json['brand'] as String?,
      category: json['category'] as String?,
      slug: json['slug'] as String? ?? '',
      isBoosted: json['isBoosted'] as bool? ?? false,
      showWeLoveBadge: json['showWeLoveBadge'] as bool? ?? false,
      sellerId: json['sellerId'] as String?,
      totalStock: json['totalStock'] as int?,
    );
  }
}

/// Response model for favorites list
class FavoritesResponse {
  final List<FavoriteItemModel> docs;
  final int totalDocs;
  final int totalPages;
  final int page;
  final int limit;
  final bool hasNextPage;
  final bool hasPrevPage;

  FavoritesResponse({
    required this.docs,
    required this.totalDocs,
    required this.totalPages,
    required this.page,
    required this.limit,
    required this.hasNextPage,
    required this.hasPrevPage,
  });

  factory FavoritesResponse.fromJson(Map<String, dynamic> json) {
    return FavoritesResponse(
      docs: (json['docs'] as List<dynamic>?)
              ?.map((e) => FavoriteItemModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      totalDocs: json['totalDocs'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 1,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 10,
      hasNextPage: json['hasNextPage'] as bool? ?? false,
      hasPrevPage: json['hasPrevPage'] as bool? ?? false,
    );
  }
}

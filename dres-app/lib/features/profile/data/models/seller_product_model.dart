import 'package:dres/core/utilities/media_utils.dart';

/// Model for a seller's product (variation)
class SellerProductModel {
  final String id;
  final String title;
  final String? brand;
  final String? category;
  final String? thumbnail;
  final double price;
  final double? compareAtPrice;
  final int totalStock;
  final String slug;
  final String? styleId;
  final String? sellerId;
  final String? defaultSku;
  final bool isBoosted;
  final bool showWeLoveBadge;
  final DateTime? flashSaleEndDate;

  SellerProductModel({
    required this.id,
    required this.title,
    this.brand,
    this.category,
    this.thumbnail,
    required this.price,
    this.compareAtPrice,
    required this.totalStock,
    required this.slug,
    this.styleId,
    this.sellerId,
    this.defaultSku,
    this.isBoosted = false,
    this.showWeLoveBadge = false,
    this.flashSaleEndDate,
  });

  factory SellerProductModel.fromJson(Map<String, dynamic> json) {
    return SellerProductModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      brand: json['brand'],
      category: json['category'],
      thumbnail: json['thumbnail'] != null
          ? MediaUtils.resolveUrl(json['thumbnail'])
          : null,
      price: (json['sellingPrice'] ?? 0).toDouble(),
      compareAtPrice: json['compareAtPrice']?.toDouble(),
      totalStock: json['totalStock'] ?? 0,
      slug: json['slug'] ?? json['id'] ?? '',
      styleId: json['styleId'],
      sellerId: json['sellerId'],
      defaultSku: json['defaultSku'],
      isBoosted: json['isBoosted'] ?? false,
      showWeLoveBadge: json['showWeLoveBadge'] ?? false,
      flashSaleEndDate: json['flashSaleEndDate'] != null
          ? DateTime.tryParse(json['flashSaleEndDate'])
          : null,
    );
  }
}

/// Response from the get seller products endpoint
class GetSellerProductsResponse {
  final List<SellerProductModel> products;
  final int totalDocs;
  final int totalPages;
  final int page;
  final bool hasNextPage;

  GetSellerProductsResponse({
    required this.products,
    required this.totalDocs,
    required this.totalPages,
    required this.page,
    required this.hasNextPage,
  });

  factory GetSellerProductsResponse.fromJson(Map<String, dynamic> json) {
    return GetSellerProductsResponse(
      products: (json['docs'] as List<dynamic>?)
              ?.map((e) => SellerProductModel.fromJson(e))
              .toList() ??
          [],
      totalDocs: json['totalDocs'] ?? 0,
      totalPages: json['totalPages'] ?? 1,
      page: json['page'] ?? 1,
      hasNextPage: json['hasNextPage'] ?? false,
    );
  }
}

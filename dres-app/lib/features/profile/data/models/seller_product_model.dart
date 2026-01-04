import 'package:dres/core/utilities/media_utils.dart';

/// Model for a seller's product (variation)
class SellerProductModel {
  final String id;
  final String title;
  final String? brandName;
  final String? thumbnail;
  final double? lowestPrice;
  final int totalStock;
  final String? colorName;
  final String? styleId;
  final DateTime createdAt;

  SellerProductModel({
    required this.id,
    required this.title,
    this.brandName,
    this.thumbnail,
    this.lowestPrice,
    required this.totalStock,
    this.colorName,
    this.styleId,
    required this.createdAt,
  });

  factory SellerProductModel.fromJson(Map<String, dynamic> json) {
    return SellerProductModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      brandName: json['brandName'],
      thumbnail: json['thumbnail'] != null
          ? MediaUtils.resolveUrl(json['thumbnail'])
          : null,
      lowestPrice: json['lowestPrice']?.toDouble(),
      totalStock: json['totalStock'] ?? 0,
      colorName: json['colorName'],
      styleId: json['styleId'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
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

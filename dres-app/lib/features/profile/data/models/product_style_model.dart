import 'package:dres/core/utilities/media_utils.dart';

/// Model for a user's published product (style)
class ProductStyleModel {
  final String id;
  final String title;
  final String? brandName;
  final String? thumbnail;
  final int variationCount;
  final int totalStock;
  final double? lowestPrice;
  final DateTime updatedAt;
  final DateTime createdAt;

  ProductStyleModel({
    required this.id,
    required this.title,
    this.brandName,
    this.thumbnail,
    required this.variationCount,
    required this.totalStock,
    this.lowestPrice,
    required this.updatedAt,
    required this.createdAt,
  });

  factory ProductStyleModel.fromJson(Map<String, dynamic> json) {
    return ProductStyleModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      brandName: json['brandName'],
      thumbnail: json['thumbnail'] != null 
          ? MediaUtils.resolveUrl(json['thumbnail']) 
          : null,
      variationCount: json['variationCount'] ?? 0,
      totalStock: json['totalStock'] ?? 0,
      lowestPrice: json['lowestPrice']?.toDouble(),
      updatedAt: DateTime.tryParse(json['updatedAt'] ?? '') ?? DateTime.now(),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

/// Response from the get my products endpoint
class GetMyProductsResponse {
  final List<ProductStyleModel> products;
  final int totalDocs;
  final int totalPages;
  final int page;
  final bool hasNextPage;

  GetMyProductsResponse({
    required this.products,
    required this.totalDocs,
    required this.totalPages,
    required this.page,
    required this.hasNextPage,
  });

  factory GetMyProductsResponse.fromJson(Map<String, dynamic> json) {
    return GetMyProductsResponse(
      products: (json['docs'] as List<dynamic>?)
              ?.map((e) => ProductStyleModel.fromJson(e))
              .toList() ??
          [],
      totalDocs: json['totalDocs'] ?? 0,
      totalPages: json['totalPages'] ?? 1,
      page: json['page'] ?? 1,
      hasNextPage: json['hasNextPage'] ?? false,
    );
  }
}

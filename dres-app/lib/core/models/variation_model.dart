class VariationModel {
  final String id;
  final String title;
  final double price;
  final double? compareAtPrice;
  final String? thumbnail;
  final bool inStock;
  final int quantity;
  final String? brand;
  final String? category;
  final String slug;
  final bool isBoosted;

  VariationModel({
    required this.id,
    required this.title,
    required this.price,
    this.compareAtPrice,
    this.thumbnail,
    required this.inStock,
    required this.quantity,
    this.brand,
    this.category,
    required this.slug,
    this.isBoosted = false,
  });

  factory VariationModel.fromJson(Map<String, dynamic> json) {
    return VariationModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      compareAtPrice: (json['compareAtPrice'] as num?)?.toDouble(),
      thumbnail: json['thumbnail'] as String?,
      inStock: json['inStock'] as bool? ?? true,
      quantity: json['quantity'] as int? ?? 0,
      brand: json['brand'] as String?,
      category: json['category'] as String?,
      slug: json['slug'] as String? ?? '',
      isBoosted: json['isBoosted'] as bool? ?? false,
    );
  }

  bool get hasDiscount => compareAtPrice != null && compareAtPrice! > price;
  
  double get discountPercentage {
    if (!hasDiscount) return 0;
    return ((compareAtPrice! - price) / compareAtPrice!) * 100;
  }
}

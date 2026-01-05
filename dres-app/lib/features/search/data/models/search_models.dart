/// Model for an item search result (category, collection, style, or variation)
class ItemSearchResult {
  final String id;
  final String searchTitle;
  final String query;
  final String type; // 'category', 'collection', 'style', or 'variation'
  final String? slug;
  // Parent filter IDs for navigation
  final String? departmentId;
  final String? collectionId;
  final String? categoryId;

  ItemSearchResult({
    required this.id,
    required this.searchTitle,
    required this.query,
    required this.type,
    this.slug,
    this.departmentId,
    this.collectionId,
    this.categoryId,
  });

  bool get isCategory => type == 'category';
  bool get isCollection => type == 'collection';
  bool get isStyle => type == 'style';
  bool get isVariation => type == 'variation';

  factory ItemSearchResult.fromJson(Map<String, dynamic> json) {
    return ItemSearchResult(
      id: json['id'] as String,
      searchTitle: json['searchTitle'] as String,
      query: json['query'] as String,
      type: json['type'] as String,
      slug: json['slug'] as String?,
      departmentId: json['departmentId'] as String?,
      collectionId: json['collectionId'] as String?,
      categoryId: json['categoryId'] as String?,
    );
  }
}

/// Model for a brand search result
class BrandSearchResult {
  final String id;
  final String name;

  BrandSearchResult({
    required this.id,
    required this.name,
  });

  factory BrandSearchResult.fromJson(Map<String, dynamic> json) {
    return BrandSearchResult(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

/// Model for a seller/member search result
class SellerSearchResult {
  final String id;
  final String name;
  final String? username;
  final String? avatarUrl;

  SellerSearchResult({
    required this.id,
    required this.name,
    this.username,
    this.avatarUrl,
  });

  factory SellerSearchResult.fromJson(Map<String, dynamic> json) {
    String? avatarUrl;
    final avatar = json['avatar'];
    if (avatar != null && avatar is Map<String, dynamic>) {
      avatarUrl = avatar['url'] as String?;
    }

    return SellerSearchResult(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      username: json['username'] as String?,
      avatarUrl: avatarUrl,
    );
  }
}

/// Combined search response for all results
class SearchResponse {
  final List<ItemSearchResult> items;
  final List<BrandSearchResult> brands;
  final List<SellerSearchResult> sellers;

  SearchResponse({
    required this.items,
    required this.brands,
    required this.sellers,
  });

  factory SearchResponse.fromJson(Map<String, dynamic> json) {
    return SearchResponse(
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => ItemSearchResult.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      brands: (json['brands'] as List<dynamic>?)
              ?.map((e) => BrandSearchResult.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      sellers: (json['sellers'] as List<dynamic>?)
              ?.map((e) => SellerSearchResult.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

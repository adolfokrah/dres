/// Model for style statistics response
class StyleStatsModel {
  final String styleId;
  final String? styleTitle;
  final StyleStatsOverview overview;
  final List<VariationStatsModel> variations;
  final String currencySymbol;
  final String currencyCode;

  StyleStatsModel({
    required this.styleId,
    this.styleTitle,
    required this.overview,
    required this.variations,
    this.currencySymbol = '₵',
    this.currencyCode = 'GHS',
  });

  factory StyleStatsModel.fromJson(Map<String, dynamic> json) {
    final style = json['style'] as Map<String, dynamic>?;
    final overview = json['overview'] as Map<String, dynamic>? ?? {};
    final variationsList = json['variations'] as List<dynamic>? ?? [];
    final currency = json['currency'] as Map<String, dynamic>?;

    return StyleStatsModel(
      styleId: style?['id'] ?? '',
      styleTitle: style?['title'],
      overview: StyleStatsOverview.fromJson(overview),
      variations: variationsList
          .map((v) => VariationStatsModel.fromJson(v as Map<String, dynamic>))
          .toList(),
      currencySymbol: currency?['symbol'] ?? '₵',
      currencyCode: currency?['code'] ?? 'GHS',
    );
  }
}

/// Overview metrics for the style
class StyleStatsOverview {
  final int totalViews;
  final int uniqueViewers;
  final int totalFavorites;
  final int totalItemsSold;
  final double totalRevenue;
  final int totalOrders;
  final int totalReviews;
  final double averageRating;
  final int waitlistCount;
  final double conversionRate;
  final String? lastSaleAt;

  StyleStatsOverview({
    required this.totalViews,
    required this.uniqueViewers,
    required this.totalFavorites,
    required this.totalItemsSold,
    required this.totalRevenue,
    required this.totalOrders,
    required this.totalReviews,
    required this.averageRating,
    required this.waitlistCount,
    required this.conversionRate,
    this.lastSaleAt,
  });

  factory StyleStatsOverview.fromJson(Map<String, dynamic> json) {
    return StyleStatsOverview(
      totalViews: json['totalViews'] ?? 0,
      uniqueViewers: json['uniqueViewers'] ?? 0,
      totalFavorites: json['totalFavorites'] ?? 0,
      totalItemsSold: json['totalItemsSold'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
      totalOrders: json['totalOrders'] ?? 0,
      totalReviews: json['totalReviews'] ?? 0,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      waitlistCount: json['waitlistCount'] ?? 0,
      conversionRate: (json['conversionRate'] ?? 0).toDouble(),
      lastSaleAt: json['lastSaleAt'],
    );
  }

  /// Check if there's any activity
  bool get hasActivity =>
      totalViews > 0 ||
      totalFavorites > 0 ||
      totalItemsSold > 0 ||
      totalReviews > 0;
}

/// Per-variation statistics
class VariationStatsModel {
  final String id;
  final String? title;
  final String? slug;
  final int views;
  final int uniqueViewers;
  final int favorites;
  final int itemsSold;
  final double revenue;
  final int orders;
  final int waitlist;
  final double conversionRate;

  VariationStatsModel({
    required this.id,
    this.title,
    this.slug,
    required this.views,
    required this.uniqueViewers,
    required this.favorites,
    required this.itemsSold,
    required this.revenue,
    required this.orders,
    required this.waitlist,
    required this.conversionRate,
  });

  factory VariationStatsModel.fromJson(Map<String, dynamic> json) {
    return VariationStatsModel(
      id: json['id'] ?? '',
      title: json['title'],
      slug: json['slug'],
      views: json['views'] ?? 0,
      uniqueViewers: json['uniqueViewers'] ?? 0,
      favorites: json['favorites'] ?? 0,
      itemsSold: json['itemsSold'] ?? 0,
      revenue: (json['revenue'] ?? 0).toDouble(),
      orders: json['orders'] ?? 0,
      waitlist: json['waitlist'] ?? 0,
      conversionRate: (json['conversionRate'] ?? 0).toDouble(),
    );
  }
}

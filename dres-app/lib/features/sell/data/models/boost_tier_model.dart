/// Model for a boost tier from the API
class BoostTierModel {
  final String id;
  final String name;
  final String slug;
  final int duration;
  final double price;
  final double priceInGHS;
  final List<String> benefits;
  final bool isPopular;

  BoostTierModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.duration,
    required this.price,
    required this.priceInGHS,
    required this.benefits,
    this.isPopular = false,
  });

  /// Duration formatted as string (e.g., "7 days")
  String get durationText => '$duration ${duration == 1 ? 'day' : 'days'}';

  factory BoostTierModel.fromJson(Map<String, dynamic> json) {
    return BoostTierModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      duration: json['duration'] ?? 7,
      price: (json['price'] ?? 0).toDouble(),
      priceInGHS: (json['priceInGHS'] ?? json['price'] ?? 0).toDouble(),
      benefits: (json['benefits'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      isPopular: json['isPopular'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'duration': duration,
      'price': price,
      'priceInGHS': priceInGHS,
      'benefits': benefits,
      'isPopular': isPopular,
    };
  }
}

/// Response model for boost tiers API
class BoostTiersResponse {
  final List<BoostTierModel> tiers;
  final int total;
  final String currencySymbol;
  final String currencyCode;

  BoostTiersResponse({
    required this.tiers,
    required this.total,
    required this.currencySymbol,
    required this.currencyCode,
  });

  factory BoostTiersResponse.fromJson(Map<String, dynamic> json) {
    final currency = json['currency'] as Map<String, dynamic>?;
    return BoostTiersResponse(
      tiers: (json['tiers'] as List<dynamic>?)
              ?.map((e) => BoostTierModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      total: json['total'] ?? 0,
      currencySymbol: currency?['symbol'] ?? '₵',
      currencyCode: currency?['code'] ?? 'GHS',
    );
  }
}

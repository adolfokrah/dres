import 'package:dres/features/cart/data/models/location_model.dart';

/// Model for a shipping rate
class ShippingRateModel {
  final String id;
  final String userId;
  final String countryId;
  final List<CityModel> cities;
  final double deliveryCost;
  final double? freeShippingThreshold;
  final EstimatedDaysModel? estimatedDays;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ShippingRateModel({
    required this.id,
    required this.userId,
    required this.countryId,
    required this.cities,
    required this.deliveryCost,
    this.freeShippingThreshold,
    this.estimatedDays,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory ShippingRateModel.fromJson(Map<String, dynamic> json) {
    // Parse cities - can be list of strings (IDs) or objects
    final citiesJson = json['cities'] as List? ?? [];
    final cities = citiesJson.map((city) {
      if (city is String) {
        return CityModel(id: city, name: '');
      } else if (city is Map<String, dynamic>) {
        return CityModel.fromJson(city);
      }
      return CityModel(id: '', name: '');
    }).toList();

    // Parse user ID
    final user = json['user'];
    final userId = user is String ? user : (user as Map<String, dynamic>?)?['id'] ?? '';

    // Parse country ID
    final country = json['country'];
    final countryId = country is String ? country : (country as Map<String, dynamic>?)?['id'] ?? '';

    return ShippingRateModel(
      id: json['id']?.toString() ?? '',
      userId: userId,
      countryId: countryId,
      cities: cities,
      deliveryCost: (json['deliveryCost'] ?? 0).toDouble(),
      freeShippingThreshold: json['freeShippingThreshold']?.toDouble(),
      estimatedDays: json['estimatedDays'] != null
          ? EstimatedDaysModel.fromJson(json['estimatedDays'])
          : null,
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cities': cities.map((c) => c.id).toList(),
      'deliveryCost': deliveryCost,
      if (freeShippingThreshold != null)
        'freeShippingThreshold': freeShippingThreshold,
      if (estimatedDays != null) 'estimatedDays': estimatedDays!.toJson(),
      'isActive': isActive,
    };
  }

  /// Get a display string for the cities
  String get citiesDisplay {
    if (cities.isEmpty) return 'No cities';
    if (cities.length == 1) return cities.first.name;
    if (cities.length <= 3) {
      return cities.map((c) => c.name).join(', ');
    }
    return '${cities.take(2).map((c) => c.name).join(', ')} +${cities.length - 2} more';
  }

  /// Get estimated delivery display
  String? get estimatedDeliveryDisplay {
    if (estimatedDays == null) return null;
    final min = estimatedDays!.min;
    final max = estimatedDays!.max;
    if (min == null && max == null) return null;
    if (min == max) return '$min days';
    if (min != null && max != null) return '$min-$max days';
    if (min != null) return '$min+ days';
    return 'Up to $max days';
  }

  ShippingRateModel copyWith({
    String? id,
    String? userId,
    String? countryId,
    List<CityModel>? cities,
    double? deliveryCost,
    double? freeShippingThreshold,
    EstimatedDaysModel? estimatedDays,
    bool? isActive,
  }) {
    return ShippingRateModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      countryId: countryId ?? this.countryId,
      cities: cities ?? this.cities,
      deliveryCost: deliveryCost ?? this.deliveryCost,
      freeShippingThreshold: freeShippingThreshold ?? this.freeShippingThreshold,
      estimatedDays: estimatedDays ?? this.estimatedDays,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

/// Model for estimated delivery days
class EstimatedDaysModel {
  final int? min;
  final int? max;

  EstimatedDaysModel({this.min, this.max});

  factory EstimatedDaysModel.fromJson(Map<String, dynamic> json) {
    return EstimatedDaysModel(
      min: json['min'],
      max: json['max'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (min != null) 'min': min,
      if (max != null) 'max': max,
    };
  }
}

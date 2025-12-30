/// Shipping address model matching the backend user.addresses schema
class ShippingAddress {
  final String? id;
  final String label;
  final String fullName;
  final String phone;
  final String address;
  final String? countryId;
  final String? countryName;
  final String? regionId;
  final String? regionName;
  final String? cityId;
  final String? cityName;
  final String? postalCode;
  final String? deliveryNotes;
  final bool isDefault;

  ShippingAddress({
    this.id,
    required this.label,
    required this.fullName,
    required this.phone,
    required this.address,
    this.countryId,
    this.countryName,
    this.regionId,
    this.regionName,
    this.cityId,
    this.cityName,
    this.postalCode,
    this.deliveryNotes,
    this.isDefault = false,
  });

  factory ShippingAddress.fromJson(Map<String, dynamic> json) {
    // Handle country - can be string ID or populated object
    String? countryId;
    String? countryName;
    final country = json['country'];
    if (country is String) {
      countryId = country;
    } else if (country is Map) {
      countryId = country['id']?.toString();
      countryName = country['name'];
    }

    // Handle region - can be string ID or populated object
    String? regionId;
    String? regionName;
    final region = json['region'];
    if (region is String) {
      regionId = region;
    } else if (region is Map) {
      regionId = region['id']?.toString();
      regionName = region['name'];
    }

    // Handle city - can be string ID or populated object
    String? cityId;
    String? cityName;
    final city = json['city'];
    if (city is String) {
      cityId = city;
    } else if (city is Map) {
      cityId = city['id']?.toString();
      cityName = city['name'];
    }

    return ShippingAddress(
      id: json['id']?.toString() ?? json['_id']?.toString(),
      label: json['label'] ?? '',
      fullName: json['fullName'] ?? '',
      phone: json['phone'] ?? '',
      address: json['address'] ?? '',
      countryId: countryId,
      countryName: countryName,
      regionId: regionId,
      regionName: regionName,
      cityId: cityId,
      cityName: cityName,
      postalCode: json['postalCode'],
      deliveryNotes: json['deliveryNotes'],
      isDefault: json['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'label': label,
      'fullName': fullName,
      'phone': phone,
      'address': address,
      if (countryId != null) 'country': countryId,
      if (regionId != null) 'region': regionId,
      if (cityId != null) 'city': cityId,
      if (postalCode != null) 'postalCode': postalCode,
      if (deliveryNotes != null) 'deliveryNotes': deliveryNotes,
      'isDefault': isDefault,
    };
  }

  /// Get formatted location string (city - region)
  String get locationDisplay {
    final parts = <String>[];
    if (cityName != null && cityName!.isNotEmpty) {
      parts.add(cityName!);
    }
    if (regionName != null && regionName!.isNotEmpty) {
      parts.add(regionName!);
    }
    return parts.join(' - ');
  }

  /// Copy with method for immutable updates
  ShippingAddress copyWith({
    String? id,
    String? label,
    String? fullName,
    String? phone,
    String? address,
    String? countryId,
    String? countryName,
    String? regionId,
    String? regionName,
    String? cityId,
    String? cityName,
    String? postalCode,
    String? deliveryNotes,
    bool? isDefault,
  }) {
    return ShippingAddress(
      id: id ?? this.id,
      label: label ?? this.label,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      countryId: countryId ?? this.countryId,
      countryName: countryName ?? this.countryName,
      regionId: regionId ?? this.regionId,
      regionName: regionName ?? this.regionName,
      cityId: cityId ?? this.cityId,
      cityName: cityName ?? this.cityName,
      postalCode: postalCode ?? this.postalCode,
      deliveryNotes: deliveryNotes ?? this.deliveryNotes,
      isDefault: isDefault ?? this.isDefault,
    );
  }
}

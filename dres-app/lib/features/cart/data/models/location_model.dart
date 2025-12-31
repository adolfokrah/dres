/// Model for a city
class CityModel {
  final String id;
  final String name;
  final String? countryId;
  final String? regionId;
  final String? regionName;

  CityModel({
    required this.id,
    required this.name,
    this.countryId,
    this.regionId,
    this.regionName,
  });

  factory CityModel.fromJson(Map<String, dynamic> json, {String? countryId, String? regionId, String? regionName}) {
    return CityModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      countryId: countryId,
      regionId: regionId,
      regionName: regionName,
    );
  }

  /// Display string for the city (e.g., "Kasoa - Central Region")
  String get displayName {
    if (regionName != null && regionName!.isNotEmpty) {
      return '$name - $regionName';
    }
    return name;
  }
}

/// Model for a region with its cities
class RegionModel {
  final String id;
  final String name;
  final List<CityModel> cities;

  RegionModel({
    required this.id,
    required this.name,
    required this.cities,
  });

  factory RegionModel.fromJson(Map<String, dynamic> json, {String? countryId}) {
    final regionId = json['id']?.toString() ?? '';
    final regionName = json['name'] ?? '';
    final citiesJson = json['cities'] as List? ?? [];
    
    return RegionModel(
      id: regionId,
      name: regionName,
      cities: citiesJson
          .map((city) => CityModel.fromJson(
                city as Map<String, dynamic>,
                countryId: countryId,
                regionId: regionId,
                regionName: regionName,
              ))
          .toList(),
    );
  }
}

/// Response from the regions by country endpoint
class RegionsByCountryResponse {
  final String countryId;
  final List<RegionModel> regions;
  final List<CityModel> citiesWithoutRegion;
  final int totalRegions;
  final int totalCities;

  RegionsByCountryResponse({
    required this.countryId,
    required this.regions,
    required this.citiesWithoutRegion,
    required this.totalRegions,
    required this.totalCities,
  });

  factory RegionsByCountryResponse.fromJson(Map<String, dynamic> json) {
    final countryId = json['countryId']?.toString() ?? '';
    final regionsJson = json['regions'] as List? ?? [];
    final citiesWithoutRegionJson = json['citiesWithoutRegion'] as List? ?? [];
    
    return RegionsByCountryResponse(
      countryId: countryId,
      regions: regionsJson
          .map((r) => RegionModel.fromJson(r as Map<String, dynamic>, countryId: countryId))
          .toList(),
      citiesWithoutRegion: citiesWithoutRegionJson
          .map((c) => CityModel.fromJson(c as Map<String, dynamic>, countryId: countryId))
          .toList(),
      totalRegions: json['totalRegions'] ?? 0,
      totalCities: json['totalCities'] ?? 0,
    );
  }

  /// Get all cities flattened (useful for search)
  List<CityModel> get allCities {
    final List<CityModel> all = [];
    for (final region in regions) {
      all.addAll(region.cities);
    }
    all.addAll(citiesWithoutRegion);
    return all;
  }
}

import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/cart/data/models/location_model.dart';

export 'package:dres/features/cart/data/models/location_model.dart';

class LocationRepository {
  final ApiService _apiService;

  LocationRepository({required ApiService apiService}) : _apiService = apiService;

  /// Get regions with cities for the current user's country
  Future<RegionsByCountryResponse> getRegionsWithCities() async {
    final response = await _apiService.get('/regions/by-country');
    return RegionsByCountryResponse.fromJson(response.data);
  }
}

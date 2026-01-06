import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/profile/data/models/shipping_rate_model.dart';
import 'package:dres/features/cart/data/models/location_model.dart';

class ShippingRatesRepository {
  final ApiService _apiService;

  ShippingRatesRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Fetch user's shipping rates
  Future<List<ShippingRateModel>> getShippingRates() async {
    final response = await _apiService.get(
      '/shippingRates/me',
      queryParameters: {
        'depth': '2',
        'sort': '-createdAt',
      },
    );

    final data = response.data;
    final docs = data['docs'] as List? ?? [];
    return docs
        .map((doc) => ShippingRateModel.fromJson(doc as Map<String, dynamic>))
        .toList();
  }

  /// Create a new shipping rate
  Future<ShippingRateModel> createShippingRate({
    required List<String> cityIds,
    required double deliveryCost,
    double? freeShippingThreshold,
  }) async {
    final data = <String, dynamic>{
      'cities': cityIds,
      'deliveryCost': deliveryCost,
    };

    if (freeShippingThreshold != null) {
      data['freeShippingThreshold'] = freeShippingThreshold;
    }

    final response = await _apiService.post(
      '/shippingRates',
      data: data,
    );

    return ShippingRateModel.fromJson(response.data['doc'] ?? response.data);
  }

  /// Update an existing shipping rate
  Future<ShippingRateModel> updateShippingRate({
    required String id,
    List<String>? cityIds,
    double? deliveryCost,
    double? freeShippingThreshold,
    bool? isActive,
  }) async {
    final data = <String, dynamic>{};

    if (cityIds != null) data['cities'] = cityIds;
    if (deliveryCost != null) data['deliveryCost'] = deliveryCost;
    if (freeShippingThreshold != null) {
      data['freeShippingThreshold'] = freeShippingThreshold;
    }
    if (isActive != null) data['isActive'] = isActive;

    final response = await _apiService.patch(
      '/shippingRates/$id',
      data: data,
    );

    return ShippingRateModel.fromJson(response.data['doc'] ?? response.data);
  }

  /// Delete a shipping rate
  Future<void> deleteShippingRate(String id) async {
    await _apiService.delete('/shippingRates/$id');
  }

  /// Fetch cities for the user's country (uses logged-in user's country)
  Future<RegionsByCountryResponse> getCitiesByCountry() async {
    final response = await _apiService.get('/regions/by-country');
    return RegionsByCountryResponse.fromJson(response.data);
  }
}

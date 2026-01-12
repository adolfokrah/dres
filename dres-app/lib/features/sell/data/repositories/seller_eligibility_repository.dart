import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/sell/data/models/seller_eligibility_model.dart';

class SellerEligibilityRepository {
  final ApiService _apiService;

  SellerEligibilityRepository({required ApiService apiService})
      : _apiService = apiService;

  /// Fetch seller eligibility status
  Future<SellerEligibilityModel> getSellerEligibility() async {
    final response = await _apiService.get('/users/seller-eligibility');
    return SellerEligibilityModel.fromJson(response.data as Map<String, dynamic>);
  }
}

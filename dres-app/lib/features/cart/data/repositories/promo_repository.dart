import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/cart/data/models/promo_response.dart';

export 'package:dres/features/cart/data/models/promo_response.dart';

class PromoRepository {
  final ApiService _apiService;

  PromoRepository({required ApiService apiService}) : _apiService = apiService;

  /// Apply a promo code to the cart
  Future<ApplyPromoResponse> applyPromoCode({required String code}) async {
    final response = await _apiService.post(
      '/carts/apply-promo',
      data: {'code': code},
    );
    return ApplyPromoResponse.fromJson(response.data);
  }

  /// Remove the applied promo code from the cart
  Future<RemovePromoResponse> removePromoCode() async {
    final response = await _apiService.post(
      '/carts/remove-promo',
      data: {},
    );
    return RemovePromoResponse.fromJson(response.data);
  }
}

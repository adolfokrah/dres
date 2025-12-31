import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/cart/data/models/cart_model.dart';
import 'package:dres/features/cart/data/models/cart_response.dart';

export 'package:dres/features/cart/data/models/cart_model.dart';
export 'package:dres/features/cart/data/models/cart_response.dart';

class CartRepository {
  final ApiService _apiService;

  CartRepository({required ApiService apiService}) : _apiService = apiService;

  /// Add item to cart
  Future<AddToCartResponse> addToCart({
    required String variationId,
    required String skuId,
    int quantity = 1,
    bool buyerProtection = false,
  }) async {
    final response = await _apiService.post(
      '/carts/add-item',
      data: {
        'variationId': variationId,
        'skuId': skuId,
        'quantity': quantity,
        'buyerProtection': buyerProtection,
      },
    );
    return AddToCartResponse.fromJson(response.data);
  }

  /// Update cart item quantity
  Future<void> updateCartItemQuantity({
    required String variationId,
    required String skuId,
    required int quantity,
  }) async {
    await _apiService.patch(
      '/carts/update-item',
      data: {
        'variationId': variationId,
        'skuId': skuId,
        'quantity': quantity,
      },
    );
  }

  /// Remove item from cart
  Future<void> removeCartItem({
    required String variationId,
    required String skuId,
  }) async {
    await _apiService.post(
      '/carts/remove-item',
      data: {
        'variationId': variationId,
        'skuId': skuId,
      },
    );
  }

  /// Get user's active cart
  Future<GetCartResponse> getMyCart() async {
    try {
      final response = await _apiService.get('/carts/my-cart');
      return GetCartResponse.fromJson(response.data);
    } catch (_) {
      return GetCartResponse(cart: null, validation: null);
    }
  }

  /// Get user's active cart (legacy)
  Future<CartModel?> getActiveCart() async {
    try {
      final response = await _apiService.get(
        '/carts',
        queryParameters: {
          'where[status][equals]': 'active',
          'limit': 1,
          'depth': 2,
        },
      );
      final docs = response.data['docs'] as List?;
      if (docs != null && docs.isNotEmpty) {
        return CartModel.fromJson(docs.first);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Update shipping fees based on city
  Future<UpdateShippingResponse> updateShipping({required String cityId}) async {
    final response = await _apiService.post(
      '/carts/update-shipping',
      data: {'cityId': cityId},
    );
    return UpdateShippingResponse.fromJson(response.data);
  }
}

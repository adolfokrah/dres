import 'package:dres/core/services/api_service.dart';
import 'package:dres/features/cart/data/models/cart_model.dart';

export 'package:dres/features/cart/data/models/cart_model.dart';

class CartRepository {
  final ApiService _apiService;

  CartRepository({required ApiService apiService}) : _apiService = apiService;

  /// Add item to cart
  /// Creates a new cart if user doesn't have one, or adds to existing cart
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
    await _apiService.delete(
      '/carts/remove-item',
      data: {
        'variationId': variationId,
        'skuId': skuId,
      },
    );
  }

  /// Get user's active cart using the dedicated endpoint
  Future<CartModel?> getMyCart() async {
    try {
      final response = await _apiService.get('/carts/my-cart');

      if (response.data['cart'] != null) {
        return CartModel.fromJson(response.data['cart']);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Get user's active cart (legacy method using query params)
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
}

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
    await _apiService.post(
      '/carts/remove-item',
      data: {
        'variationId': variationId,
        'skuId': skuId,
      },
    );
  }

  /// Get user's active cart using the dedicated endpoint
  /// Returns cart with validation info
  Future<GetCartResponse> getMyCart() async {
    try {
      final response = await _apiService.get('/carts/my-cart');

      return GetCartResponse.fromJson(response.data);
    } catch (_) {
      return GetCartResponse(cart: null, validation: null);
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

  /// Update shipping fees for all cart items based on selected city
  /// Returns updated cart with new shipping fees calculated from seller rates
  Future<UpdateShippingResponse> updateShipping({
    required String cityId,
  }) async {
    final response = await _apiService.post(
      '/carts/update-shipping',
      data: {
        'cityId': cityId,
      },
    );

    return UpdateShippingResponse.fromJson(response.data);
  }
}

/// Response from get cart endpoint
class GetCartResponse {
  final CartModel? cart;
  final CartValidationResponse? validation;

  GetCartResponse({
    this.cart,
    this.validation,
  });

  factory GetCartResponse.fromJson(Map<String, dynamic> json) {
    return GetCartResponse(
      cart: json['cart'] != null ? CartModel.fromJson(json['cart']) : null,
      validation: json['validation'] != null 
          ? CartValidationResponse.fromJson(json['validation']) 
          : null,
    );
  }
}

/// Cart validation response from backend
class CartValidationResponse {
  final bool valid;
  final List<String> reasons;

  CartValidationResponse({
    required this.valid,
    required this.reasons,
  });

  factory CartValidationResponse.fromJson(Map<String, dynamic> json) {
    return CartValidationResponse(
      valid: json['valid'] ?? true,
      reasons: (json['reasons'] as List?)?.map((e) => e.toString()).toList() ?? [],
    );
  }
}

/// Response from update shipping endpoint
class UpdateShippingResponse {
  final bool success;
  final String message;
  final CartModel? cart;
  final ShippingSummary? shippingSummary;
  final CartValidationResponse? validation;

  UpdateShippingResponse({
    required this.success,
    required this.message,
    this.cart,
    this.shippingSummary,
    this.validation,
  });

  factory UpdateShippingResponse.fromJson(Map<String, dynamic> json) {
    return UpdateShippingResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      cart: json['cart'] != null ? CartModel.fromJson(json['cart']) : null,
      shippingSummary: json['shippingSummary'] != null 
          ? ShippingSummary.fromJson(json['shippingSummary']) 
          : null,
      validation: json['validation'] != null 
          ? CartValidationResponse.fromJson(json['validation']) 
          : null,
    );
  }
}

/// Shipping summary from update shipping response
class ShippingSummary {
  final String cityId;
  final double totalShipping;
  final double totalBuyerProtection;
  final int sellersWithRates;
  final int sellersWithoutRates;
  final EstimatedDays? estimatedDays;

  ShippingSummary({
    required this.cityId,
    required this.totalShipping,
    required this.totalBuyerProtection,
    required this.sellersWithRates,
    required this.sellersWithoutRates,
    this.estimatedDays,
  });

  factory ShippingSummary.fromJson(Map<String, dynamic> json) {
    return ShippingSummary(
      cityId: json['cityId'] ?? '',
      totalShipping: (json['totalShipping'] ?? 0).toDouble(),
      totalBuyerProtection: (json['totalBuyerProtection'] ?? 0).toDouble(),
      sellersWithRates: json['sellersWithRates'] ?? 0,
      sellersWithoutRates: json['sellersWithoutRates'] ?? 0,
      estimatedDays: json['estimatedDays'] != null 
          ? EstimatedDays.fromJson(json['estimatedDays']) 
          : null,
    );
  }
}

/// Estimated delivery days
class EstimatedDays {
  final int? min;
  final int? max;

  EstimatedDays({this.min, this.max});

  factory EstimatedDays.fromJson(Map<String, dynamic> json) {
    return EstimatedDays(
      min: json['min'],
      max: json['max'],
    );
  }

  String get display {
    if (min != null && max != null) {
      return '$min-$max days';
    } else if (min != null) {
      return '$min+ days';
    } else if (max != null) {
      return 'Up to $max days';
    }
    return 'TBD';
  }
}

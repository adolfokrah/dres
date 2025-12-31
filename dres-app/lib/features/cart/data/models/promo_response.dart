import 'package:dres/features/cart/data/models/cart_model.dart';

/// Response from apply promo code endpoint
class ApplyPromoResponse {
  final bool success;
  final String message;
  final CartModel? cart;
  final DiscountInfo? discount;
  final String? error;

  ApplyPromoResponse({
    required this.success,
    required this.message,
    this.cart,
    this.discount,
    this.error,
  });

  factory ApplyPromoResponse.fromJson(Map<String, dynamic> json) {
    return ApplyPromoResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      cart: json['cart'] != null ? CartModel.fromJson(json['cart']) : null,
      discount: json['discount'] != null 
          ? DiscountInfo.fromJson(json['discount']) 
          : null,
      error: json['error'],
    );
  }
}

/// Response from remove promo code endpoint
class RemovePromoResponse {
  final bool success;
  final String message;
  final CartModel? cart;
  final String? error;

  RemovePromoResponse({
    required this.success,
    required this.message,
    this.cart,
    this.error,
  });

  factory RemovePromoResponse.fromJson(Map<String, dynamic> json) {
    return RemovePromoResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      cart: json['cart'] != null ? CartModel.fromJson(json['cart']) : null,
      error: json['error'],
    );
  }
}

/// Discount info from apply promo response
class DiscountInfo {
  final String code;
  final String type; // 'percentage', 'fixed', 'free_shipping'
  final double value;
  final String? description;
  final double discountAmount;

  DiscountInfo({
    required this.code,
    required this.type,
    required this.value,
    this.description,
    required this.discountAmount,
  });

  factory DiscountInfo.fromJson(Map<String, dynamic> json) {
    return DiscountInfo(
      code: json['code'] ?? '',
      type: json['type'] ?? 'fixed',
      value: (json['value'] ?? 0).toDouble(),
      description: json['description'],
      discountAmount: (json['discountAmount'] ?? 0).toDouble(),
    );
  }
}

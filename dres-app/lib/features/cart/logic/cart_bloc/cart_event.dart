import 'package:equatable/equatable.dart';

abstract class CartEvent extends Equatable {
  const CartEvent();

  @override
  List<Object?> get props => [];
}

/// Fetch user's cart
class CartFetchRequested extends CartEvent {
  const CartFetchRequested();
}

/// Add item to cart
class CartAddItemRequested extends CartEvent {
  final String variationId;
  final String skuId;
  final int quantity;
  final bool buyerProtection;

  const CartAddItemRequested({
    required this.variationId,
    required this.skuId,
    this.quantity = 1,
    this.buyerProtection = false,
  });

  @override
  List<Object?> get props => [variationId, skuId, quantity, buyerProtection];
}

/// Clear cart state (e.g., on logout)
class CartCleared extends CartEvent {
  const CartCleared();
}

/// Update shipping fees based on selected city
class CartUpdateShippingRequested extends CartEvent {
  final String cityId;

  const CartUpdateShippingRequested({required this.cityId});

  @override
  List<Object?> get props => [cityId];
}

/// Apply promo code to cart
class CartApplyPromoRequested extends CartEvent {
  final String code;

  const CartApplyPromoRequested({required this.code});

  @override
  List<Object?> get props => [code];
}

/// Remove promo code from cart
class CartRemovePromoRequested extends CartEvent {
  const CartRemovePromoRequested();
}

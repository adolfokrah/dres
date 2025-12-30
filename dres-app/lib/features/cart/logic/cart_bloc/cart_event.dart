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

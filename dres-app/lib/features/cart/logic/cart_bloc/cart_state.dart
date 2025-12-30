import 'package:equatable/equatable.dart';
import 'package:dres/features/cart/data/repositories/cart_repository.dart';

enum CartStatus { initial, loading, loaded, error }

class CartState extends Equatable {
  final CartStatus status;
  final CartModel? cart;
  final String? errorMessage;

  const CartState({
    this.status = CartStatus.initial,
    this.cart,
    this.errorMessage,
  });

  /// Get total item count in cart
  int get itemCount => cart?.itemCount ?? 0;

  /// Get cart items
  List<CartItemModel> get items => cart?.items ?? [];

  /// Check if cart has items
  bool get hasItems => itemCount > 0;

  /// Check if cart has unavailable items
  bool get hasUnavailableItems => items.any((item) => item.isUnavailable);

  /// Get unavailable items count
  int get unavailableItemsCount => items.where((item) => item.isUnavailable).length;

  /// Get subtotal
  double get subtotal => cart?.subtotal ?? 0;

  /// Get grand total
  double get grandTotal => cart?.grandTotal ?? 0;

  CartState copyWith({
    CartStatus? status,
    CartModel? cart,
    String? errorMessage,
    bool clearCart = false,
  }) {
    return CartState(
      status: status ?? this.status,
      cart: clearCart ? null : (cart ?? this.cart),
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, cart, errorMessage];
}
